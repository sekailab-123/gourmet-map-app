'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createDirectus, rest, authentication, readMe, readItems, createItem, logout } from '@directus/sdk';

// 設定
const DIRECTUS_URL = 'http://127.0.0.1:8055';
const client = createDirectus(DIRECTUS_URL)
  .with(authentication('json')) // JSONモード
  .with(rest());

type Shop = {
  id: string;
  name_ja: string;
  name_en: string;
  lat: number;
  lng: number;
  category: string;
  category_en: string;
  price_min: string;
  price_max: string;
  photo_url: string;
  tiktok_url: string;
};

export default function Home() {
  const mapContainer = useRef(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState('すべて');
  const [language, setLanguage] = useState<'ja' | 'en'>('ja');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');

  // --- 1. 初期化 ---
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('gourmet-map-bookmarks');
    if (saved) setBookmarkedIds(JSON.parse(saved));

    client.request(readMe()).then(user => {
        setCurrentUser(user);
        fetchRemoteBookmarks();
    }).catch(() => {});

    fetchShopsFromDirectus();
  }, []);

  const fetchShopsFromDirectus = async () => {
    try {
      console.log("Fetching shops...");
      const result = await client.request(readItems('restaurants', {
        fields: ['*', 'photo', { categories: ['categories_id.*'] }]
      }));

      const shops: Shop[] = result.map((item: any) => {
        const categoryData = item.categories?.[0]?.categories_id;
        return {
            id: item.id,
            name_ja: item.name_ja,
            name_en: item.name_en || item.name_ja,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lng),
            category: categoryData?.name_ja || 'その他',
            category_en: categoryData?.name_en || 'Other',
            price_min: String(item.price_min || 0),
            price_max: String(item.price_max || 0),
            photo_url: item.photo ? `${DIRECTUS_URL}/assets/${item.photo}` : '',
            tiktok_url: item.tiktok_url || ''
        };
      });
      // ダミーは削除済み
      console.log("Data Loaded. Count:", shops.length);
      setAllShops(shops);
    } catch (e) { console.error(e); }
  };

  // --- 2. 地図初期化 ---
  useEffect(() => {
    if (!isClient || map.current) return;
    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    if (!apiKey) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`,
      center: [139.767, 35.681],
      zoom: 13
    });
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), 'top-right');

    map.current.on('load', () => setMapLoaded(true));

    const setCursor = (type: string) => { if(map.current) map.current.getCanvas().style.cursor = type; };
    map.current.on('mouseenter', 'clusters', () => setCursor('pointer'));
    map.current.on('mouseleave', 'clusters', () => setCursor(''));
    map.current.on('mouseenter', 'unclustered-point', () => setCursor('pointer'));
    map.current.on('mouseleave', 'unclustered-point', () => setCursor(''));

    map.current.on('click', 'clusters', async (e) => {
        const features = map.current?.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features?.[0].properties.cluster_id;
        const source: any = map.current?.getSource('shops');
        const zoom = await source.getClusterExpansionZoom(clusterId);
        map.current?.easeTo({ center: (features?.[0].geometry as any).coordinates, zoom });
    });

    map.current.on('click', 'unclustered-point', (e) => {
        const props = e.features?.[0].properties;
        const coordinates = (e.features?.[0].geometry as any).coordinates.slice();
        showPopup(coordinates, props);
    });
  }, [isClient]);

  // --- 3. データ反映 ---
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const filteredShops = allShops.filter(shop => {
        if (selectedCategory !== 'すべて' && shop.category !== selectedCategory) return false;
        if (showOnlyBookmarks && !bookmarkedIds.includes(shop.id)) return false;
        return true;
    });

    const geojson: any = {
        type: 'FeatureCollection',
        features: filteredShops.map(shop => ({
            type: 'Feature',
            properties: { ...shop },
            geometry: { type: 'Point', coordinates: [shop.lng, shop.lat] }
        }))
    };

    const source = map.current.getSource('shops');
    if (source) {
        (source as any).setData(geojson);
    } else {
        map.current.addSource('shops', {
            type: 'geojson',
            data: geojson,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50
        });
        map.current.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'shops',
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
                'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
            }
        });
        map.current.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'shops',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            }
        });
        map.current.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'shops',
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-color': '#FF0000',
                'circle-radius': 8,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
            }
        });
    }
  }, [mapLoaded, allShops, selectedCategory, showOnlyBookmarks, bookmarkedIds]);

  // --- 4. ポップアップ ---
  const showPopup = (coordinates: [number, number], shop: any) => {
      const displayName = language === 'en' ? (shop.name_en || shop.name_ja) : shop.name_ja;
      const displayCategory = language === 'en' ? (shop.category_en || shop.category) : shop.category;
      const isBookmarked = bookmarkedIds.includes(shop.id);
      const bookmarkIcon = isBookmarked ? '★' : '☆';
      const bookmarkColor = isBookmarked ? '#FFD700' : '#ccc'; 
      
      const popupContent = `
        <div style="text-align: left; max-width: 220px;">
          ${shop.photo_url ? `<img src="${shop.photo_url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;">` : ''}
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: bold; width: 80%;">${displayName}</h3>
            <button id="bookmark-btn-${shop.id}" onclick="window.toggleBookmark('${shop.id}')" style="background: none; border: none; cursor: pointer; font-size: 20px; color: ${bookmarkColor}; padding: 0;">${bookmarkIcon}</button>
          </div>
          <p style="margin: 4px 0 0; font-size: 13px; color: #666;">🏷 ${displayCategory}</p>
          ${shop.tiktok_url ? `<div id="tiktok-container-${shop.id}" style="margin-top: 10px;"><button onclick="window.loadTikTok('${shop.id}', '${shop.tiktok_url}')" style="width: 100%; padding: 8px 0; background: #FE2C55; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">🎵 Video</button></div>` : ''}
        </div>
      `;
      new maplibregl.Popup({ maxWidth: '240px' }).setLngLat(coordinates).setHTML(popupContent).addTo(map.current!);
  };

  // --- 5. ログイン (★修正: 手動ログインに戻しました) ---
  const handleLogin = async () => {
    try {
      // DirectusのログインAPIを直接叩く
      const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.errors) throw new Error(data.errors[0].message);

      // トークンをSDKにセット
      await client.setToken(data.data.access_token);
      
      const user = await client.request(readMe());
      setCurrentUser(user);
      await fetchRemoteBookmarks();
      alert('ログイン成功！');
    } catch (e: any) {
      console.error(e);
      alert('ログイン失敗');
    }
  };

  const handleLogout = async () => {
    try { await client.request(logout()); setCurrentUser(null); setBookmarkedIds([]); localStorage.removeItem('gourmet-map-bookmarks'); alert('ログアウトしました'); } catch(e) {}
  };
  const fetchRemoteBookmarks = async () => { try { const result = await client.request(readItems('bookmarks', { fields: ['restaurant_id'], filter: { user_created: { _eq: '$CURRENT_USER' } } })); const ids = result.map((item: any) => item.restaurant_id); if (ids.length > 0) { setBookmarkedIds(ids); localStorage.setItem('gourmet-map-bookmarks', JSON.stringify(ids)); } } catch (e) {} };

  // --- 6. グローバル関数 ---
  useEffect(() => {
    if (!isClient) return;
    (window as any).toggleBookmark = async (shopId: string) => {
        const btn = document.getElementById(`bookmark-btn-${shopId}`);
        if (btn) {
            const isActive = btn.innerHTML === '★';
            btn.style.color = isActive ? '#ccc' : '#FFD700';
            btn.innerHTML = isActive ? '☆' : '★';
        }
        setBookmarkedIds(prev => {
            const exists = prev.includes(shopId);
            const newBookmarks = exists ? prev.filter(id => id !== shopId) : [...prev, shopId];
            localStorage.setItem('gourmet-map-bookmarks', JSON.stringify(newBookmarks));
            if (currentUser && !exists) client.request(createItem('bookmarks', { restaurant_id: shopId })).catch(() => {});
            return newBookmarks;
        });
    };
    (window as any).loadTikTok = (shopId: string, videoUrl: string) => {
        const container = document.getElementById(`tiktok-container-${shopId}`);
        if (!container || !videoUrl) return;
        const videoIdMatch = videoUrl.match(/video\/(\d+)/);
        if (videoIdMatch) {
            container.innerHTML = `<blockquote class="tiktok-embed" cite="${videoUrl}" data-video-id="${videoIdMatch[1]}" style="max-width: 605px;min-width: 325px;"><section></section></blockquote>`;
            const script = document.createElement('script');
            script.src = 'https://www.tiktok.com/embed.js';
            script.async = true;
            document.body.appendChild(script);
        }
    };
  }, [isClient, currentUser]);

  if (!isClient) return <div style={{width:'100vw', height:'100vh', background:'#f0f0f0'}}></div>;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, background: 'white', padding: 10 }}>
        <div style={{ paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
          {currentUser ? (
            <div style={{fontSize: '12px'}}>
              <p style={{margin: '0 0 5px'}}>👤 {currentUser.email}</p>
              <button onClick={handleLogout} style={{width: '100%', padding: '5px', background: '#eee', border: 'none', borderRadius: '4px'}}>ログアウト</button>
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{padding: '5px'}} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Pass" style={{padding: '5px'}} />
              <button onClick={handleLogin} style={{padding: '5px', background: '#333', color: 'white', border: 'none', borderRadius: '4px'}}>ログイン</button>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
          <button onClick={() => setLanguage('ja')} style={{ flex: 1, padding: '5px', background: language === 'ja' ? '#333' : '#fff', color: language === 'ja' ? '#fff' : '#333', border: 'none', cursor: 'pointer' }}>JA</button>
          <button onClick={() => setLanguage('en')} style={{ flex: 1, padding: '5px', background: language === 'en' ? '#333' : '#fff', color: language === 'en' ? '#fff' : '#333', border: 'none', cursor: 'pointer' }}>EN</button>
        </div>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ padding: '5px', fontSize: '14px', width: '100%' }}>
          <option value="すべて">{language === 'en' ? 'All Categories' : 'すべてのカテゴリ'}</option>
          <option value="ラーメン">Ramen (ラーメン)</option>
          <option value="カフェ">Cafe (カフェ)</option>
          <option value="レストラン">Restaurant (レストラン)</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }}>
          <input type="checkbox" checked={showOnlyBookmarks} onChange={(e) => setShowOnlyBookmarks(e.target.checked)} style={{ marginRight: '5px' }} />
          {language === 'en' ? 'Saved only ★' : '保存済みのみ ★'}
        </label>
      </div>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}