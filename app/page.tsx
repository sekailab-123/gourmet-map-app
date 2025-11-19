// app/page.tsx に貼り付けるコード
import React from 'react';

// Home コンポーネントを定義します
const Home = () => {
  // 画面に表示する内容を返します
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh', 
      fontSize: '48px',
      fontWeight: 'bold',
      fontFamily: 'sans-serif'
    }}>
      Hello Gourmet Map!
    </div>
  );
};

// Home コンポーネントをエクスポート（利用可能に）します
export default Home;