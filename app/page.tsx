'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Papa from 'papaparse';

type Shop = {
  id: string;
  name_ja: string;
  name_en: string;
  lat: string;
  lng: string;
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
  
  const [selectedCategory, setSelectedCategory] = useState('すべて');
  const [language, setLanguage] = useState<'ja' | 'en'>('ja');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const savedBookmarks = localStorage.getItem('gourmet-map-bookmarks');
    if (savedBookmarks) {
      setBookmarkedIds(JSON.parse(savedBookmarks));
    }

    (window as any).loadTikTok = (shopId: string, videoUrl: string) => {
      const container = document.getElementById(`tiktok-container-${shopId}`);
      if (!container || !videoUrl) return;
      const videoIdMatch = videoUrl.match(/video\/(\d+)/);
      if (!videoIdMatch) return;
      const videoId = videoIdMatch[1];
      const embedCode = `<blockquote class="tiktok-embed" cite="${videoUrl}" data-video-id="${videoId}" style="max-width: 605px;min-width: 325px;"><section></section></blockquote>`;
      container.innerHTML = embedCode;
      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    };

    // ★変更: 押した瞬間に色を変える処理を追加
    (window as any).toggleBookmark = (shopId: string) => {
      // 1. まず見た目を即座に変える (Reactの再レンダリングを待たない)
      const btn = document.getElementById(`bookmark-btn-${shopId}`);
      if (btn) {
        // 現在の色を見て、反転させる
        const currentColor = btn.style.color;
        // もし今が金色(保存済)ならグレーに、グレーなら金色に
        // (注: ブラウザによって色の表現が違うことがあるので、簡易判定)
        const isActive = currentColor === 'rgb(255, 215, 0)' || currentColor === '#FFD700';
        
        btn.style.color = isActive ? '#ccc' : '#FFD700';
        btn.innerHTML = isActive ? '☆' : '★';
      }

      // 2. その後、裏側のデータを更新する
      setBookmarkedIds((prev) => {
        let newBookmarks;
        if (prev.includes(shopId)) {
          newBookmarks = prev.filter(id => id !== shopId);
        } else {
          newBookmarks = [...prev, shopId];
        }
        localStorage.setItem('gourmet-map-bookmarks', JSON.stringify(newBookmarks));
        return newBookmarks;
      });
    };

  }, []);

  useEffect(() => {
    if (!isClient || map.current) return;

    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    if (!apiKey) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`,
      center: [139.767, 35.681],
      zoom: 15
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(
      new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }),
      'top-right'
    );

    Papa.parse('/shops.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Shop[];
        const validData = data.filter(shop => shop.lat && shop.lng);
        setAllShops(validData);
      }
    });
  }, [isClient]);

  useEffect(() => {
    if (!map.current || allShops.length === 0) return;

    // マーカー更新時にポップアップが開いていたら閉じないように工夫するのは難しいので、
    // ここでは「データが変わったらマーカーを作り直す」という基本動作のままにします。
    // ただし、toggleBookmarkでの即時DOM操作により、ユーザーは違和感を感じにくくなります。

    const markers = document.getElementsByClassName('maplibregl-marker');
    while (markers.length > 0) {
      markers[0].remove();
    }

    const filteredShops = allShops.filter(shop => {
      if (selectedCategory !== 'すべて' && shop.category !== selectedCategory) return false;
      if (showOnlyBookmarks && !bookmarkedIds.includes(shop.id)) return false;
      return true;
    });

    filteredShops.forEach((shop) => {
      const displayName = language === 'en' ? (shop.name_en || shop.name_ja) : shop.name_ja;
      const displayCategory = language === 'en' ? (shop.category_en || shop.category) : shop.category;
      const labelPrice = language === 'en' ? 'Budget' : '予算';
      const labelVideo = language === 'en' ? '🎵 Watch Video (TikTok)' : '🎵 動画を見る (TikTok)';
      
      const isBookmarked = bookmarkedIds.includes(shop.id);
      const bookmarkIcon = isBookmarked ? '★' : '☆';
      const bookmarkColor = isBookmarked ? '#FFD700' : '#ccc'; 

      let tiktokSection = '';
      if (shop.tiktok_url) {
        tiktokSection = `
          <div id="tiktok-container-${shop.id}" style="margin-top: 10px;">
            <button onclick="window.loadTikTok('${shop.id}', '${shop.tiktok_url}')" style="width: 100%; padding: 8px 0; background: #FE2C55; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
              ${labelVideo}
            </button>
          </div>
        `;
      }

      const popupContent = `
        <div style="text-align: left; max-width: 220px;">
          <img src="${shop.photo_url}" alt="${displayName}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;">
          
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: bold; width: 80%;">${displayName}</h3>
            
            <button id="bookmark-btn-${shop.id}" onclick="window.toggleBookmark('${shop.id}')" style="background: none; border: none; cursor: pointer; font-size: 20px; color: ${bookmarkColor}; padding: 0;">
              ${bookmarkIcon}
            </button>
          </div>

          <p style="margin: 4px 0 0; font-size: 13px; color: #666;">
            🏷 ${displayCategory}<br>
            💰 ${labelPrice}: ¥${shop.price_min}~
          </p>
          ${tiktokSection}
        </div>
      `;

      new maplibregl.Marker({ color: "#FF0000" })
        .setLngLat([parseFloat(shop.lng), parseFloat(shop.lat)])
        .setPopup(new maplibregl.Popup({ maxWidth: '240px' }).setHTML(popupContent))
        .addTo(map.current!);
    });

  }, [allShops, selectedCategory, language, bookmarkedIds, showOnlyBookmarks]); 

  if (!isClient) return <div style={{ width: '100%', height: '100vh', background: '#f0f0f0' }} />;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div style={{
        position: 'absolute', top: '20px', left: '20px', zIndex: 10, 
        background: 'white', padding: '10px', borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', gap: '10px'
      }}>
        
        <div style={{ display: 'flex', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
          <button onClick={() => setLanguage('ja')} style={{ flex: 1, padding: '5px', background: language === 'ja' ? '#333' : '#fff', color: language === 'ja' ? '#fff' : '#333', border: 'none', cursor: 'pointer' }}>JA</button>
          <button onClick={() => setLanguage('en')} style={{ flex: 1, padding: '5px', background: language === 'en' ? '#333' : '#fff', color: language === 'en' ? '#fff' : '#333', border: 'none', cursor: 'pointer' }}>EN</button>
        </div>

        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: '5px', fontSize: '14px', width: '100%' }}
        >
          <option value="すべて">{language === 'en' ? 'All Categories' : 'すべてのカテゴリ'}</option>
          <option value="ラーメン">Ramen (ラーメン)</option>
          <option value="カフェ">Cafe (カフェ)</option>
          <option value="レストラン">Restaurant (レストラン)</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showOnlyBookmarks}
            onChange={(e) => setShowOnlyBookmarks(e.target.checked)}
            style={{ marginRight: '5px' }}
          />
          {language === 'en' ? 'Saved only ★' : '保存済みのみ ★'}
        </label>

      </div>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}