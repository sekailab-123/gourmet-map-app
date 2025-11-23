'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Papa from 'papaparse';

// データの型定義を更新（カテゴリと予算を追加）
type Shop = {
  id: string;
  name_ja: string;
  lat: string;
  lng: string;
  category: string;
  price_min: string;
  price_max: string;
};

export default function Home() {
  const mapContainer = useRef(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // ★追加: 全データと、絞り込み後のデータを管理
  const [allShops, setAllShops] = useState<Shop[]>([]);
  
  // ★追加: 絞り込み条件（カテゴリ）
  const [selectedCategory, setSelectedCategory] = useState('すべて');

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 1. 地図の初期化とデータ読み込み
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

    // CSV読み込み
    Papa.parse('/shops.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data as Shop[];
        // 有効なデータだけを保存
        const validData = data.filter(shop => shop.lat && shop.lng);
        setAllShops(validData); // ここで全データを保存
      }
    });
  }, [isClient]);

  // 2. 絞り込み条件が変わったら、ピンを立て直す
  useEffect(() => {
    if (!map.current || allShops.length === 0) return;

    // いったん今あるマーカーを全削除（簡易的な方法としてDOM要素を削除）
    const markers = document.getElementsByClassName('maplibregl-marker');
    while (markers.length > 0) {
      markers[0].remove();
    }

    // 条件に合うお店だけを探す
    const filteredShops = allShops.filter(shop => {
      if (selectedCategory === 'すべて') return true;
      return shop.category === selectedCategory;
    });

    // 絞り込んだお店だけピンを立てる
    filteredShops.forEach((shop) => {
      new maplibregl.Marker({ color: "#FF0000" })
        .setLngLat([parseFloat(shop.lng), parseFloat(shop.lat)])
        .setPopup(
          new maplibregl.Popup().setHTML(
            `<b>${shop.name_ja}</b><br>ジャンル: ${shop.category}<br>予算: ¥${shop.price_min}~`
          )
        )
        .addTo(map.current!);
    });

  }, [allShops, selectedCategory]); // データかカテゴリが変わるたびに実行

  if (!isClient) return <div />;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      
      {/* ★追加: 地図の上に浮かぶ絞り込みボタン */}
      <div style={{
        position: 'absolute', 
        top: '20px', 
        left: '20px', 
        zIndex: 10, 
        background: 'white', 
        padding: '10px', 
        borderRadius: '8px',
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