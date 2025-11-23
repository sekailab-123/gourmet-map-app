'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Papa from 'papaparse';

// データの型定義（写真を追加）
type Shop = {
  id: string;
  name_ja: string;
  lat: string;
  lng: string;
  category: string;
  price_min: string;
  price_max: string;
  photo_url: string; // ★追加
};

export default function Home() {
  const mapContainer = useRef(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('すべて');

  useEffect(() => {
    setIsClient(true);
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
      // ★変更: ポップアップの中身をリッチなHTMLにする
      const popupContent = `
        <div style="text-align: left; max-width: 200px;">
          <img src="${shop.photo_url}" alt="${shop.name_ja}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${shop.name_ja}</h3>
          <p style="margin: 4px 0 0; font-size: 13px; color: #666;">
            🏷 ${shop.category}<br>
            💰 ¥${shop.price_min}~
          </p>
        </div>
      `;

      new maplibregl.Marker({ color: "#FF0000" })
        .setLngLat([parseFloat(shop.lng), parseFloat(shop.lat)])
        .setPopup(new maplibregl.Popup({ maxWidth: '220px' }).setHTML(popupContent)) // 写真付きHTMLをセット
        .addTo(map.current!);
    });

  }, [allShops, selectedCategory]);

  // ★エラー対策: 読み込み中の表示をW3の時と同じスタイルに戻しました
  if (!isClient) {
    return <div style={{ width: '100%', height: '100vh', background: '#f0f0f0' }} />;
  }

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