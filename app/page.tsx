'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Papa from 'papaparse';

// 型定義に英語項目を追加
type Shop = {
  id: string;
  name_ja: string;
  name_en: string; // ★追加
  lat: string;
  lng: string;
  category: string;
  category_en: string; // ★追加
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
  
  // ★追加: 言語ステート ('ja' = 日本語, 'en' = 英語)
  const [language, setLanguage] = useState<'ja' | 'en'>('ja');

  useEffect(() => {
    setIsClient(true);

    (window as any).loadTikTok = (shopId: string, videoUrl: string) => {
      const container = document.getElementById(`tiktok-container-${shopId}`);
      if (!container || !videoUrl) return;

      const videoIdMatch = videoUrl.match(/video\/(\d+)/);
      if (!videoIdMatch) return;
      const videoId = videoIdMatch[1];

      const embedCode = `
        <blockquote class="tiktok-embed" cite="${videoUrl}" data-video-id="${videoId}" style="max-width: 605px;min-width: 325px;">
          <section></section>
        </blockquote>
      `;

      container.innerHTML = embedCode;

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
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Shop[];
        const validData = data.filter(shop => shop.lat && shop.lng);
        setAllShops(validData);
      }
    });
  }, [isClient]);

  // ★変更: 言語(language)が変わった時もピンを更新する
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
      // ★多言語対応ロジック
      // 英語モードなら英語名を使う。なければ日本語名を使う（フォールバック）
      const displayName = language === 'en' ? (shop.name_en || shop.name_ja) : shop.name_ja;
      const displayCategory = language === 'en' ? (shop.category_en || shop.category) : shop.category;
      
      // ラベルの切り替え
      const labelPrice = language === 'en' ? 'Budget' : '予算';
      const labelVideo = language === 'en' ? '🎵 Watch Video (TikTok)' : '🎵 動画を見る (TikTok)';

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
          <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${displayName}</h3>
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

  }, [allShops, selectedCategory, language]); // ★languageを追加

  if (!isClient) return <div style={{ width: '100%', height: '100vh', background: '#f0f0f0' }} />;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div style={{
        position: 'absolute', top: '20px', left: '20px', zIndex: 10, 
        background: 'white', padding: '10px', borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        display: 'flex', gap: '10px', alignItems: 'center' // 横並びにする
      }}>
        
        {/* ★追加: 言語切り替えボタン */}
        <div style={{ display: 'flex', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
          <button 
            onClick={() => setLanguage('ja')}
            style={{ 
              padding: '5px 10px', 
              background: language === 'ja' ? '#333' : '#fff', 
              color: language === 'ja' ? '#fff' : '#333',
              border: 'none', cursor: 'pointer'
            }}
          >
            JA
          </button>
          <button 
            onClick={() => setLanguage('en')}
            style={{ 
              padding: '5px 10px', 
              background: language === 'en' ? '#333' : '#fff', 
              color: language === 'en' ? '#fff' : '#333',
              border: 'none', cursor: 'pointer'
            }}
          >
            EN
          </button>
        </div>

        {/* 絞り込み (今回は簡易的に日本語のままにしています) */}
        <div>
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

      </div>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}