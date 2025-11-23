'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Papa from 'papaparse'; // ★追加: CSVを読むための道具

// ★追加: CSVデータの形を定義（これがないとエラーになる）
type Shop = {
  id: string;
  name_ja: string;
  lat: string;
  lng: string;
};

export default function Home() {
  const mapContainer = useRef(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || map.current) return;

    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    if (!apiKey) {
        console.error("APIキーが見つかりません");
        return;
    }

    // 1. 地図を作成
    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`,
      center: [139.767, 35.681], // 東京駅
      zoom: 15 // 少し拡大
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right'
    );

    // ★追加: CSVデータを読み込んでピンを立てる処理
    Papa.parse('/shops.csv', { // publicフォルダのshops.csvを読む
      download: true,
      header: true,
      complete: (results) => {
        const shops = results.data as Shop[]; // 読み込んだデータをShop型として扱う
        
        shops.forEach((shop) => {
          // 緯度経度があるデータだけ処理する
          if (shop.lat && shop.lng) {
            // マーカーを作成して地図に追加
            new maplibregl.Marker({ color: "#FF0000" }) // 赤色のピン
              .setLngLat([parseFloat(shop.lng), parseFloat(shop.lat)]) // 文字列を数字に変換
              .setPopup(new maplibregl.Popup().setText(shop.name_ja)) // クリックで店名表示
              .addTo(map.current!);
          }
        });
      }
    });

  }, [isClient]);

  if (!isClient) {
    return <div style={{ width: '100%', height: '100vh', background: '#eee' }} />;
  }

  return (
    <div 
      ref={mapContainer} 
      style={{ width: '100%', height: '100vh' }} 
    />
  );
}