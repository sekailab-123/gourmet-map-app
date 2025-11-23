'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function Home() {
  const mapContainer = useRef(null);
  const map = useRef<maplibregl.Map | null>(null);
  // ★追加1: ブラウザで表示されたかどうかを管理するフラグ
  const [isClient, setIsClient] = useState(false);

  // ★追加2: 画面が読み込まれたらフラグをONにする
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // まだブラウザで表示されていない、または既に地図がある場合は中断
    if (!isClient || map.current) return;

    const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
    if (!apiKey) {
        console.error("APIキーが見つかりません");
        return;
    }

    // 地図を作成
    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`,
      center: [139.767, 35.681],
      zoom: 14
    });

    // ズームコントローラー
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // 現在地ボタン
    map.current.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

  }, [isClient]); // ★変更: isClientがtrueになったタイミングで実行

  // ★追加3: サーバー側では「読み込み中...」とだけ返して、エラーを防ぐ
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