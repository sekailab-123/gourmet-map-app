'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Papa from 'papaparse';

type Shop = {
  id: string;
  name_ja: string;
  lat: string;
  lng: string;
  category: string;
  price_min: string;
  price_max: string;
  photo_url: string;
  tiktok_url: string; // ★変更: embedではなくurlを受け取る
};

export default function Home() {
  const mapContainer = useRef(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('すべて');

  useEffect(() => {
    setIsClient(true);

    // ★変更: URLから自動で埋め込みコードを生成して表示する関数
    (window as any).loadTikTok = (shopId: string, videoUrl: string) => {
      const container = document.getElementById(`tiktok-container-${shopId}`);
      if (!container || !videoUrl) return;

      // URLから動画IDを抽出 (例: .../video/12345... -> 12345...)
      const videoIdMatch = videoUrl.match(/video\/(\d+)/);
      if (!videoIdMatch) return;
      const videoId = videoIdMatch[1];

      // 自動で正しい埋め込みコードを作成
      const embedCode = `
        <blockquote class="tiktok-embed" cite="${videoUrl}" data-video-id="${videoId}" style="max-width: 605px;min-width: 325px;">
          <section></section>
        </blockquote>
      `;

      container.innerHTML = embedCode;

      // スクリプトを読み込んで再生
      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
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
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right'
    );

    Papa.parse('/shops.csv', {
      download: true,
      header: true,
      skipEmptyLines: true, // 空行を無視
      complete: (results) => {
        const data = results.data as Shop[];
        const validData = data.filter(shop => shop.lat && shop.lng);
        setAllShops(validData);
      }
    });
  }, [isClient]);

  useEffect(() => {
    if (!map.current || allShops.length === 0) return;

    const markers = document.getElementsByClassName('maplibregl-marker');
    while (markers.length > 0) {
      markers[0].remove();
    }

    const filteredShops = allShops.filter(shop => {
      if (selectedCategory === 'すべて') return true;
      return shop.category === selectedCategory;
    });

    filteredShops.forEach((shop) => {
      let tiktokSection = '';
      if (shop.tiktok_url) {
        // ★変更: URLを渡すだけのシンプルなボタン
        tiktokSection = `
          <div id="tiktok-container-${shop.id}" style="margin-top: 10px;">
            <button onclick="window.loadTikTok('${shop.id}', '${shop.tiktok_url}')" style="width: 100%; padding: 8px 0; background: #FE2C55; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
              🎵 動画を見る (TikTok)
            </button>
          </div>
        `;
      }

      const popupContent = `
        <div style="text-align: left; max-width: 220px;">
          <img src="${shop.photo_url}" alt="${shop.name_ja}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${shop.name_ja}</h3>
          <p style="margin: 4px 0 0; font-size: 13px; color: #666;">
            🏷 ${shop.category}<br>
            💰 ¥${shop.price_min}~
          </p>
          ${tiktokSection}
        </div>
      `;

      new maplibregl.Marker({ color: "#FF0000" })
        .setLngLat([parseFloat(shop.lng), parseFloat(shop.lat)])
        .setPopup(new maplibregl.Popup({ maxWidth: '240px' }).setHTML(popupContent))
        .addTo(map.current!);
    });

  }, [allShops, selectedCategory]);

  if (!isClient) return <div style={{ width: '100%', height: '100vh', background: '#f0f0f0' }} />;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div style={{
        position: 'absolute', top: '20px', left: '20px', zIndex: 10, 
        background: 'white', padding: '10px', borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <label style={{ fontWeight: 'bold', marginRight: '5px' }}>カテゴリ:</label>
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: '5px', fontSize: '14px' }}
        >
          <option value="すべて">すべて</option>
          <option value="ラーメン">ラーメン</option>
          <option value="カフェ">カフェ</option>
          <option value="レストラン">レストラン</option>
        </select>
      </div>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}