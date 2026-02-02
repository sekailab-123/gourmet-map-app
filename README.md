# グルメマップアプリ（Gourmet Map App） プロジェクト仕様書

## 📋 目次
1. [プロジェクト概要](#プロジェクト概要)
2. [システム構成図](#システム構成図)
3. [技術スタック](#技術スタック)
4. [ディレクトリ構成と主要ファイル](#ディレクトリ構成と主要ファイル)
5. [データベース設計](#データベース設計)
6. [環境変数](#環境変数)
7. [開発フローとデプロイ・同期手順](#開発フローとデプロイ同期手順)
8. [実装済み機能の仕様詳細](#実装済み機能の仕様詳細)
9. [アカウント・クレデンシャル情報一覧](#アカウントクレデンシャル情報一覧)

---

## プロジェクト概要

位置情報を活用したグルメスポット検索・共有アプリケーションです。  
ユーザーは地図上で店舗を検索し、カテゴリによるフィルタリング、お気に入り登録（ブックマーク）、店舗情報の閲覧が可能です。

### 主な機能
- 🗺️ **インタラクティブマップ**: MapTiler（OpenStreetMapベース）を使用した地図表示
- 🔍 **カテゴリフィルタリング**: ラーメン、カフェ、レストランなどのカテゴリ別検索
- ⭐ **ブックマーク機能**: ユーザーごとにお気に入り店舗を保存
- 🌐 **多言語対応**: 日本語・英語の切り替え
- 🎵 **TikTok動画連携**: 店舗詳細内でTikTok動画の表示
- 📍 **位置情報サービス**: ユーザーの現在地を地図上に表示
- 🔐 **認証機能**: Directus認証によるユーザーログイン

---

## システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                        ユーザー                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                        │
│              Vercel でホスティング                           │
│  - App Router (React 19, TypeScript)                        │
│  - MapLibre GL JS (地図描画)                                 │
│  - Tailwind CSS (スタイリング)                              │
│  - @directus/sdk (API通信)                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓ HTTPS API
┌─────────────────────────────────────────────────────────────┐
│              Backend (Directus CMS)                         │
│              Railway でホスティング                          │
│  - Directus v11 (Headless CMS)                              │
│  - RESTful API + 認証機能                                    │
│  - データ管理GUI（管理画面）                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                        │
│              Railway (Directus 内包)                         │
│  - restaurants (店舗情報)                                    │
│  - categories (カテゴリマスタ)                               │
│  - bookmarks (ブックマーク)                                  │
│  - tags (タグマスタ)                                         │
│  - inquiries (問い合わせ)                                    │
└─────────────────────────────────────────────────────────────┘
```

### 外部サービス
- **MapTiler**: 地図タイルデータの提供
- **Xserver**: ドメイン・DNS管理
- **GitHub**: ソースコード管理
- **Vercel**: フロントエンドの自動デプロイ
- **Railway**: バックエンドとデータベースのホスティング

---

## 技術スタック

### フロントエンド
| 項目 | 技術 | バージョン | 用途 |
|------|------|-----------|------|
| Framework | Next.js | 16.x | App Router、TypeScript |
| Runtime | React | 19.x | UI構築 |
| UI Library | Tailwind CSS | 4.x | スタイリング |
| Map Library | MapLibre GL JS | 5.13.x | 地図描画・クラスタリング |
| HTTP Client | @directus/sdk | 20.x | Directus APIとの通信 |
| Data Parser | PapaParse | 5.5.x | CSVデータ処理 |
| Language | TypeScript | 5.x | 型安全性 |

### バックエンド
| 項目 | 技術 | バージョン | 用途 |
|------|------|-----------|------|
| CMS | Directus | 11.13.4 | Headless CMS |
| Database | PostgreSQL | - | データ永続化 |
| Infrastructure | Railway | - | PaaS（Platform as a Service） |
| Auth Method | JWT | - | JSON Web Token認証 |

### 開発ツール
- **ESLint**: コード品質チェック
- **PostCSS**: CSSトランスパイル

---

## ディレクトリ構成と主要ファイル

### 全体構造
```
/Users/riku/Desktop/味酒乱/ミシュランガイド/
├── gourmet-map-app/        # フロントエンドプロジェクト
├── gourmet-cms/            # バックエンド設定・スキーマ管理
└── map_test.html           # プロトタイプ・テストファイル
```

---

### フロントエンド (`/gourmet-map-app`)

```
gourmet-map-app/
├── app/                        # Next.js App Routerのルート
│   ├── page.tsx                # ★★ メインロジック（最重要ファイル）
│   ├── layout.tsx              # 全ページ共通レイアウト
│   └── globals.css             # グローバルスタイル（Tailwind設定含む）
├── public/                     # 静的ファイル
│   └── shops.csv               # CSVデータ（開発時のサンプルデータ）
├── .env.local                  # 環境変数（Git管理外・ローカル開発用）
├── .gitignore                  # Git除外設定
├── next.config.ts              # Next.js設定ファイル
├── tsconfig.json               # TypeScript設定
├── tailwind.config.ts          # Tailwind CSS設定（※未使用のデフォルトファイル）
├── postcss.config.mjs          # PostCSS設定
├── eslint.config.mjs           # ESLint設定
├── package.json                # 依存パッケージ管理
└── README.md                   # プロジェクト説明（デフォルト）
```

#### 📌 重要なファイル解説

##### **`app/page.tsx`** ⭐⭐⭐（最重要）
現在のプロジェクトでは、全ての機能が**このファイルに集約**されています。

**含まれる機能:**
- MapLibre GL JSによる地図の初期化と描画
- Directus APIからの店舗データ取得（`restaurants`コレクション）
- GeoJSON形式への変換とクラスタリング設定
- ユーザー認証（ログイン・ログアウト）
- ブックマーク機能（追加・削除・同期）
- カテゴリフィルタリング
- 言語切り替え（日本語⇔英語）
- ポップアップ表示（店舗詳細）
- TikTok動画埋め込み

**コード構造:**
```typescript
// 1. Directus クライアント設定
const client = createDirectus(DIRECTUS_URL).with(authentication('json')).with(rest());

// 2. 型定義
type Shop = { id, name_ja, name_en, lat, lng, ... }

// 3. メインコンポーネント
export default function Home() {
  // State管理
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [currentUser, setCurrentUser] = useState(null);
  // ...

  // 4. 初期化・データ取得
  useEffect(() => { ... });

  // 5. 地図初期化
  useEffect(() => { ... });

  // 6. データ反映（フィルタリング + GeoJSON変換）
  useEffect(() => { ... });

  // 7. イベントハンドラ（ログイン、ブックマーク等）
  const handleLogin = async () => { ... };

  // 8. JSXレンダリング
  return <div>...</div>;
}
```

**⚠️ 開発者向け注意:**
- 現在はプロトタイプ段階のため、コンポーネント分割されていません
- 改修時は、まず [app/page.tsx](gourmet-map-app/app/page.tsx) の全体を理解してから作業してください
- 将来的にはコンポーネント分割を推奨（例: `MapView.tsx`, `AuthPanel.tsx`, `ShopPopup.tsx`など）

##### **`app/layout.tsx`**
全ページ共通のレイアウトを定義。現在はデフォルト設定のまま。

**メタデータの変更推奨箇所:**
```typescript
export const metadata: Metadata = {
  title: "Create Next App",       // → "グルメマップ | Gourmet Map" など
  description: "Generated by create next app", // → 適切な説明文に変更
};
```

##### **`app/globals.css`**
Tailwind CSSのディレクティブを含むグローバルスタイルシート。  
現在は標準的な設定のみ。

##### **`package.json`**
プロジェクトの依存関係とスクリプト定義。

**主要なスクリプト:**
```json
{
  "scripts": {
    "dev": "next dev",           // ローカル開発サーバー起動 (http://localhost:3000)
    "build": "next build",       // 本番ビルド
    "start": "next start",       // 本番モードで起動
    "lint": "eslint"             // ESLintチェック
  }
}
```

**依存パッケージ:**
- `next`: Next.jsフレームワーク
- `react`, `react-dom`: React本体
- `@directus/sdk`: Directus API通信
- `maplibre-gl`: 地図描画ライブラリ
- `papaparse`: CSVパース用（現在は未使用の可能性）
- `tailwindcss`: CSSフレームワーク

##### **`.env.local`**
環境変数ファイル（Git管理外）。**必須の設定:**
```bash
# MapTilerのAPIキー（地図タイル取得用）
NEXT_PUBLIC_MAPTILER_KEY=xxxxxxxxxxxxxxx

# DirectusバックエンドのURL
# 本番環境: https://directus-production-xxxx.up.railway.app
# ローカル開発: http://127.0.0.1:8055 (ローカルDirectus使用時)
NEXT_PUBLIC_API_URL=https://directus-production-xxxx.up.railway.app
```

---

### バックエンド設定・スキーマ管理 (`/gourmet-cms`)

```
gourmet-cms/
├── snapshot.yaml               # ★★ Directusスキーマ定義（DB構造の設計図）
├── .env                        # ローカルDirectus用環境変数（Git管理外）
├── package.json                # Directusパッケージ管理
├── data.db                     # ローカル開発用SQLiteデータベース
├── uploads/                    # アップロード画像の保存先（Git管理外）
└── backup_v1/                  # バックアップディレクトリ
    ├── snapshot.yaml           # 過去のスキーマスナップショット
    └── uploads/                # 過去のアップロード画像
```

#### 📌 重要なファイル解説

##### **`snapshot.yaml`** ⭐⭐⭐（スキーマ管理の要）
Directusのデータベース構造を定義したYAMLファイル。

**用途:**
- データベースの「設計図」として機能
- バージョン管理可能（Git管理推奨）
- 本番環境へのスキーマ適用に使用

**構造:**
```yaml
version: 1
directus: 11.13.4
vendor: sqlite              # ローカル開発時はSQLite、本番はPostgreSQL

collections:                # テーブル定義
  - collection: restaurants
  - collection: categories
  - collection: bookmarks
  # ...

fields:                     # フィールド（カラム）定義
  - collection: restaurants
    field: name_ja
    type: string
  # ...

relations:                  # リレーション定義
  - many_collection: restaurants_categories
    many_field: restaurants_id
    one_collection: restaurants
  # ...
```

**スキーマの同期方法:**
1. **ローカルで変更を加える**:
   ```bash
   cd gourmet-cms
   npx directus start        # ローカルDirectus起動
   # 管理画面でスキーマを変更
   ```

2. **スナップショット作成**:
   ```bash
   npx directus schema snapshot ./snapshot.yaml
   ```

3. **本番環境に適用**:
   ```bash
   # Railway管理画面でAdmin Tokenを取得
   npx directus schema apply ./snapshot.yaml \
     --url https://directus-production-xxxx.up.railway.app \
     --token <YOUR_ADMIN_TOKEN>
   ```

##### **`.env`**（ローカルDirectus用）
ローカル開発時の環境変数。本番環境の設定とは異なります。

**例:**
```bash
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password
DB_CLIENT=sqlite3
DB_FILENAME=./data.db
```

---

## データベース設計

Railway上のPostgreSQLで稼働している全コレクション（テーブル）の詳細仕様。

---

### 1. `restaurants` (店舗情報) ⭐ メインテーブル

店舗の基本情報を格納するコアテーブル。

| フィールド名 | データ型 | 必須 | 説明 | 備考 |
|------------|---------|------|------|------|
| `id` | Integer | ✅ | プライマリキー | 自動増分 |
| `name_ja` | String (255) | - | 店舗名（日本語） | 例: "一蘭 渋谷店" |
| `name_en` | String (255) | - | 店舗名（英語） | 例: "Ichiran Shibuya" |
| `description_ja` | Text | - | 店舗説明（日本語） | 長文可 |
| `description_en` | Text | - | 店舗説明（英語） | 長文可 |
| `lat` | Float | - | 緯度 | 例: 35.6581 |
| `lng` | Float | - | 経度 | 例: 139.6981 |
| `price_min` | Integer | - | 最低予算（円） | 例: 1000 |
| `price_max` | Integer | - | 最高予算（円） | 例: 3000 |
| `photo` | UUID | - | 画像ファイルID | `directus_files`への外部キー |
| `tiktok_url` | String (255) | - | TikTok動画URL | 例: "https://www.tiktok.com/@user/video/123..." |
| `categories` | Alias (M2M) | - | カテゴリリレーション | Many-to-Manyリレーション |
| `tags` | Alias (M2M) | - | タグリレーション | Many-to-Manyリレーション |
| `user_created` | String (36) | - | 作成ユーザーID | Directusシステムフィールド |
| `date_created` | Timestamp | - | 作成日時 | 自動設定 |
| `user_updated` | String (36) | - | 更新ユーザーID | Directusシステムフィールド |
| `date_updated` | Timestamp | - | 更新日時 | 自動更新 |

**リレーション:**
- `categories` ← M2M → `restaurants_categories` → `categories`
- `tags` ← M2M → `restaurants_tags` → `tags`

**画像アクセスURL:**
```
https://directus-production-xxxx.up.railway.app/assets/{photo_uuid}
```

---

### 2. `categories` (カテゴリマスタ)

店舗のカテゴリ分類を管理。

| フィールド名 | データ型 | 必須 | 説明 | 備考 |
|------------|---------|------|------|------|
| `id` | Integer | ✅ | プライマリキー | 自動増分 |
| `name_ja` | String (255) | - | カテゴリ名（日本語） | 例: "ラーメン" |
| `name_en` | String (255) | - | カテゴリ名（英語） | 例: "Ramen" |
| `slug` | String (255) | - | URLスラッグ | 例: "ramen" |
| `sort` | Integer | - | 表示順序 | 小さい順に表示 |

**デフォルトカテゴリ（推奨）:**
```
| ID | name_ja     | name_en     | slug        |
|----|-------------|-------------|-------------|
| 1  | ラーメン     | Ramen       | ramen       |
| 2  | カフェ       | Cafe        | cafe        |
| 3  | レストラン   | Restaurant  | restaurant  |
| 4  | その他       | Other       | other       |
```

---

### 3. `bookmarks` (ブックマーク)

ユーザーごとのお気に入り店舗を記録。

| フィールド名 | データ型 | 必須 | 説明 | 備考 |
|------------|---------|------|------|------|
| `id` | Integer | ✅ | プライマリキー | 自動増分 |
| `restaurant_id` | Integer | - | 店舗ID | `restaurants.id`への外部キー |
| `user_created` | String (36) | - | ユーザーID | Directusシステムフィールド |
| `date_created` | Timestamp | - | 作成日時 | 自動設定 |

**権限設定（重要）:**
- **読み取り**: ユーザーは自分が作成したレコードのみ閲覧可能
- **作成**: 認証済みユーザーのみ可能
- **削除**: ユーザーは自分が作成したレコードのみ削除可能

**Directus権限フィルタ例:**
```json
{
  "user_created": {
    "_eq": "$CURRENT_USER"
  }
}
```

---

### 4. `tags` (タグマスタ)

将来的な拡張用のタグシステム（現在は未使用の可能性あり）。

| フィールド名 | データ型 | 必須 | 説明 | 備考 |
|------------|---------|------|------|------|
| `id` | Integer | ✅ | プライマリキー | 自動増分 |
| `name_ja` | String (255) | - | タグ名（日本語） | 例: "深夜営業" |
| `name_en` | String (255) | - | タグ名（英語） | 例: "Late Night" |

**利用例:**
- "深夜営業" / "Late Night"
- "テイクアウト可" / "Takeout Available"
- "ペット可" / "Pet Friendly"

---

### 5. `inquiries` (問い合わせ)

ユーザーからの問い合わせを記録。

| フィールド名 | データ型 | 必須 | 説明 | 備考 |
|------------|---------|------|------|------|
| `id` | Integer | ✅ | プライマリキー | 自動増分 |
| `name` | String (255) | - | 問い合わせ者名 | - |
| `email` | String (255) | - | メールアドレス | - |
| `message` | Text | - | 問い合わせ内容 | 長文可 |
| `date_created` | Timestamp | - | 作成日時 | 自動設定 |

**用途:**
- フロントエンドに問い合わせフォームを実装する際に使用
- Directusの管理画面で問い合わせ内容を確認

---

### 6. 中間テーブル（Many-to-Many リレーション用）

#### `restaurants_categories`
| フィールド名 | データ型 | 説明 |
|------------|---------|------|
| `id` | Integer | プライマリキー |
| `restaurants_id` | Integer | `restaurants.id`への外部キー |
| `categories_id` | Integer | `categories.id`への外部キー |

#### `restaurants_tags`
| フィールド名 | データ型 | 説明 |
|------------|---------|------|
| `id` | Integer | プライマリキー |
| `restaurants_id` | Integer | `restaurants.id`への外部キー |
| `tags_id` | Integer | `tags.id`への外部キー |

**注意:** これらのテーブルはDirectusが自動管理します。直接操作する必要はありません。

---

### ER図（Entity Relationship Diagram）

```
┌──────────────┐
│ directus_    │
│   users      │◀───┐
└──────────────┘    │
                    │ user_created
┌──────────────┐    │
│ restaurants  │◀───┤
│──────────────│    │
│ id (PK)      │    │
│ name_ja      │    │
│ name_en      │    │
│ lat, lng     │    │
│ price_min/max│    │
│ photo (FK)   │◀─┐ │
│ tiktok_url   │  │ │
└──────────────┘  │ │
       │          │ │
       │ M2M      │ │
       ├──────────┼─┼─────────┐
       │          │ │         │
       ↓          │ │         ↓
┌──────────────┐  │ │  ┌──────────────┐
│ restaurants_ │  │ │  │ restaurants_ │
│ categories   │  │ │  │    tags      │
└──────────────┘  │ │  └──────────────┘
       │          │ │         │
       ↓          │ │         ↓
┌──────────────┐  │ │  ┌──────────────┐
│ categories   │  │ │  │    tags      │
│──────────────│  │ │  │──────────────│
│ id (PK)      │  │ │  │ id (PK)      │
│ name_ja      │  │ │  │ name_ja      │
│ name_en      │  │ │  │ name_en      │
│ slug         │  │ │  └──────────────┘
└──────────────┘  │ │
                  │ │
┌──────────────┐  │ │  ┌──────────────┐
│ directus_    │  │ │  │ bookmarks    │
│   files      │──┘ │  │──────────────│
│──────────────│    │  │ id (PK)      │
│ id (PK)      │    │  │ restaurant_id│
│ filename_disk│    └──│ user_created │
│ type, size   │       └──────────────┘
└──────────────┘

┌──────────────┐
│ inquiries    │
│──────────────│
│ id (PK)      │
│ name         │
│ email        │
│ message      │
└──────────────┘
```

---

## 環境変数

環境変数は、フロントエンドとバックエンドでそれぞれ異なる場所に設定します。

### フロントエンド環境変数

#### ローカル開発環境
ファイル: `/gourmet-map-app/.env.local`（Git管理外）

```bash
# MapTiler APIキー（必須）
# 取得方法: https://www.maptiler.com/ でアカウント作成後、ダッシュボードから取得
NEXT_PUBLIC_MAPTILER_KEY=your_maptiler_api_key_here

# Directus APIのベースURL（必須）
# ローカル開発時: http://127.0.0.1:8055
# 本番環境時: Railway上のDirectus URL
NEXT_PUBLIC_API_URL=http://127.0.0.1:8055
```

#### Vercel本番環境
Vercel管理画面で設定:
1. Vercelダッシュボード → プロジェクト選択
2. "Settings" → "Environment Variables"
3. 以下を追加:

```
Name: NEXT_PUBLIC_MAPTILER_KEY
Value: your_maptiler_api_key_here

Name: NEXT_PUBLIC_API_URL
Value: https://directus-production-xxxx.up.railway.app
```

**⚠️ 注意:**
- `NEXT_PUBLIC_` プレフィックスが付いた変数はクライアントサイドで公開されます
- APIキーは漏洩しても問題ないレベルのもののみを使用してください

---

### バックエンド環境変数

#### ローカル開発環境（Directus）
ファイル: `/gourmet-cms/.env`（Git管理外）

```bash
# 管理者アカウント
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password

# データベース（ローカル開発時はSQLite）
DB_CLIENT=sqlite3
DB_FILENAME=./data.db

# セキュリティ
KEY=replace-with-random-string
SECRET=replace-with-another-random-string

# CORS設定（開発時）
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:3000
```

**KEY/SECRETの生成方法:**
```bash
# macOSまたはLinux
openssl rand -base64 32
```

#### Railway本番環境
Railway管理画面で設定済み:
1. Railwayダッシュボード → Directusサービス選択
2. "Variables"タブで設定

**主な環境変数:**
```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=***************
DATABASE_URL=postgresql://user:pass@host:port/db  # Railwayが自動設定
CORS_ENABLED=true
CORS_ORIGIN=true                                  # すべてのオリジンを許可
KEY=***************                               # ランダム文字列
SECRET=***************                            # ランダム文字列
PUBLIC_URL=https://directus-production-xxxx.up.railway.app
```

**⚠️ セキュリティ注意:**
- 本番環境では`CORS_ORIGIN`を特定のドメインに制限することを推奨
  ```
  CORS_ORIGIN=https://your-app.vercel.app
  ```
- `ADMIN_PASSWORD`は強固なものに変更してください

---

## 開発フローとデプロイ・同期手順

### A. フロントエンドの開発フロー

#### 1. ローカル開発
```bash
# プロジェクトディレクトリに移動
cd gourmet-map-app

# 依存パッケージのインストール（初回のみ）
npm install

# 環境変数の設定（初回のみ）
cp .env.example .env.local    # .env.exampleがある場合
# または直接 .env.local を作成して以下を記述:
# NEXT_PUBLIC_MAPTILER_KEY=xxx
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8055

# 開発サーバー起動
npm run dev

# ブラウザで http://localhost:3000 にアクセス
```

**開発時のホットリロード:**
- `app/page.tsx` などを編集すると、自動的にブラウザがリロードされます

#### 2. ビルド確認（本番ビルドのテスト）
```bash
# 本番用にビルド
npm run build

# ビルド成果物を使って起動
npm run start
```

#### 3. デプロイ（Vercel）
**自動デプロイ（推奨）:**
```bash
# GitHubにプッシュ
git add .
git commit -m "Update: your changes"
git push origin main

# → Vercelが自動検知してビルド・デプロイ
```

**Vercelの設定:**
- Build Command: `next build`（デフォルト）
- Output Directory: `.next`（デフォルト）
- Install Command: `npm install`（デフォルト）
- Root Directory: `gourmet-map-app`（サブディレクトリの場合のみ指定）

**デプロイ確認:**
1. Vercelダッシュボードで"Deployments"タブを確認
2. ビルドログをチェック
3. デプロイされたURLにアクセスして動作確認

---

### B. バックエンド（Directus）の管理・同期

#### 1. データの追加・編集（日常運用）
基本的には**本番環境のDirectus管理画面**で直接操作します。

```
URL: https://directus-production-xxxx.up.railway.app/admin
Email: admin@example.com
Password: （設定したパスワード）
```

**手順:**
1. 管理画面にログイン
2. 左サイドバーから`restaurants`を選択
3. 「Create Item」で新規店舗を追加
4. 必要に応じて`categories`や`tags`も追加

**画像アップロード:**
1. `restaurants`の編集画面で`photo`フィールドをクリック
2. ファイルを選択してアップロード
3. Directusが自動的に`directus_files`に保存

---

#### 2. スキーマ（DB構造）の変更

**推奨フロー:** ローカル→スナップショット→本番適用

**Step 1: ローカルで変更**
```bash
cd gourmet-cms

# 依存パッケージのインストール（初回のみ）
npm install

# ローカルDirectusを起動
npx directus start

# 管理画面にアクセス（通常は http://127.0.0.1:8055/admin）
# 新しいフィールドやコレクションを追加
```

**Step 2: スナップショット作成**
```bash
# スキーマをYAMLファイルに保存
npx directus schema snapshot ./snapshot.yaml

# 確認
git diff snapshot.yaml

# Gitにコミット（スキーマのバージョン管理）
git add snapshot.yaml
git commit -m "Schema: Add new field to restaurants"
git push
```

**Step 3: 本番環境に適用**
```bash
# RailwayのDirectus管理画面から Admin Token を取得
# Settings → Access Tokens → 新規作成

# スキーマを本番に適用
npx directus schema apply ./snapshot.yaml \
  --url https://directus-production-xxxx.up.railway.app \
  --token YOUR_ADMIN_TOKEN_HERE

# 確認: 本番管理画面で変更が反映されているか確認
```

**⚠️ 注意事項:**
- スキーマ適用は**破壊的変更の可能性**があります（フィールド削除など）
- 事前に`snapshot.yaml`の差分を確認してください
- 本番環境に適用する前に、ローカルで十分にテストしてください

**トラブルシューティング:**
- `schema apply`が失敗する場合は、本番管理画面で手動設定することも可能です
- Railwayのデータベースバックアップを事前に取得しておくことを推奨

---

#### 3. Railwayへのデプロイ（初回セットアップ）

既に構築済みの場合はスキップ可能。参考として手順を記載します。

**Step 1: Railwayプロジェクト作成**
1. Railway.app にログイン
2. "New Project" → "Deploy Directus"を選択（テンプレート利用）
3. PostgreSQLとDirectusが自動的にセットアップされる

**Step 2: 環境変数の設定**
- Railway管理画面の"Variables"タブで必要な環境変数を設定（上記参照）

**Step 3: カスタムドメインの設定（オプション）**
- Railway管理画面で"Settings" → "Domains"
- Xserverで取得したドメインのCNAMEレコードを設定

---

### C. CSVによる大量データインポート

大量の店舗データがある場合、CSVインポートが効率的です。

#### CSVファイルのフォーマット例
```csv
name_ja,name_en,lat,lng,price_min,price_max,tiktok_url
一蘭 渋谷店,Ichiran Shibuya,35.6581,139.6981,1000,2000,https://www.tiktok.com/...
すし ざんまい,Sushi Zanmai,35.6654,139.7707,3000,10000,
...
```

#### インポート手順
1. Directus管理画面にログイン
2. 左サイドバーから`restaurants`を選択
3. 右上の「...」メニュー → "Import/Export" → "Import from CSV"
4. CSVファイルをアップロード
5. フィールドのマッピングを確認
6. "Import"を実行

**⚠️ リレーションフィールドの注意点:**
- M2Mリレーション（`categories`, `tags`）はCSVインポートでは直接設定できません
- 基本情報のみインポート後、リレーションは管理画面で手動設定するか、
- APIを使った一括更新スクリプトを作成してください

**例: APIでカテゴリを一括設定**
```typescript
// 別途スクリプトを作成する例
const updateCategories = async () => {
  const shops = await client.request(readItems('restaurants'));
  for (const shop of shops) {
    // ロジックに基づいてカテゴリIDを決定
    const categoryId = determineCategoryId(shop.name_ja);
    await client.request(
      updateItem('restaurants', shop.id, {
        categories: [{ categories_id: categoryId }]
      })
    );
  }
};
```

---

## 実装済み機能の仕様詳細

### 1. 認証 (Authentication)

#### 認証方式
- **プロバイダー**: Directus Auth
- **トークン方式**: JWT (JSON Web Token)
- **セッション管理**: メモリ上（ページリロードで再ログイン必要）

#### 認証フロー
```
1. ユーザーがメール/パスワードを入力
    ↓
2. フロントエンドが Directus API に POST /auth/login
    ↓
3. Directusがトークンを返却 { access_token, refresh_token }
    ↓
4. フロントエンドがトークンをSDKにセット client.setToken(access_token)
    ↓
5. client.request(readMe()) でユーザー情報を取得
    ↓
6. Stateに保存 setCurrentUser(user)
    ↓
7. ブックマークデータを取得 fetchRemoteBookmarks()
```

#### コード実装（[app/page.tsx](gourmet-map-app/app/page.tsx#L210-L228)）
```typescript
const handleLogin = async () => {
  try {
    // Directus APIに直接ログインリクエスト
    const response = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    
    if (data.errors) throw new Error(data.errors[0].message);

    // トークンをSDKにセット
    await client.setToken(data.data.access_token);
    
    // ユーザー情報取得
    const user = await client.request(readMe());
    setCurrentUser(user);
    
    // リモートブックマークを取得
    await fetchRemoteBookmarks();
    alert('ログイン成功！');
  } catch (e: any) {
    console.error(e);
    alert('ログイン失敗');
  }
};
```

#### ログアウト処理
```typescript
const handleLogout = async () => {
  try {
    await client.request(logout());
    setCurrentUser(null);
    setBookmarkedIds([]);
    localStorage.removeItem('gourmet-map-bookmarks');
    alert('ログアウトしました');
  } catch(e) {}
};
```

#### ユーザー情報の活用
- `currentUser.email`: ユーザーのメールアドレス
- `currentUser.id`: ユーザーのUUID（ブックマーク機能で使用）

#### 今後の改善案
- [ ] トークンをlocalStorageに保存してセッション永続化
- [ ] リフレッシュトークンの自動更新
- [ ] ユーザー登録機能の実装
- [ ] ソーシャルログイン（Google, Facebook等）の導入

---

### 2. 地図表示とクラスタリング

#### 使用ライブラリ
- **MapLibre GL JS** v5.13.x
- **地図タイル**: MapTiler (OpenStreetMapベース)

#### 地図の初期化（[app/page.tsx](gourmet-map-app/app/page.tsx#L93-L122)）
```typescript
useEffect(() => {
  if (!isClient || map.current) return;
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (!apiKey) return;

  map.current = new maplibregl.Map({
    container: mapContainer.current!,
    style: `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`,
    center: [139.767, 35.681],  // 東京（経度, 緯度）
    zoom: 13                    // ズームレベル
  });

  // ナビゲーションコントロール（ズーム±ボタン）
  map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

  // 位置情報コントロール（現在地表示）
  map.current.addControl(
    new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true
    }),
    'top-right'
  );

  // 地図ロード完了イベント
  map.current.on('load', () => setMapLoaded(true));
}, [isClient]);
```

#### GeoJSONデータソースの作成
店舗データをGeoJSON形式に変換し、地図に追加します。

```typescript
const geojson: any = {
  type: 'FeatureCollection',
  features: filteredShops.map(shop => ({
    type: 'Feature',
    properties: { ...shop },  // 店舗の全情報をプロパティとして保持
    geometry: {
      type: 'Point',
      coordinates: [shop.lng, shop.lat]  // [経度, 緯度]
    }
  }))
};
```

#### クラスタリング設定
```typescript
map.current.addSource('shops', {
  type: 'geojson',
  data: geojson,
  cluster: true,           // クラスタリング有効化
  clusterMaxZoom: 14,      // ズーム14まではクラスタリング
  clusterRadius: 50        // クラスタの半径（ピクセル）
});
```

#### レイヤー構成
**1. クラスタ円（`clusters`レイヤー）**
```typescript
map.current.addLayer({
  id: 'clusters',
  type: 'circle',
  source: 'shops',
  filter: ['has', 'point_count'],  // クラスタのみ表示
  paint: {
    'circle-color': [
      'step',
      ['get', 'point_count'],
      '#51bbd6',   // 1-99店舗: 青
      100,
      '#f1f075',   // 100-749店舗: 黄
      750,
      '#f28cb1'    // 750店舗以上: ピンク
    ],
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      20,   // 1-99店舗: 半径20px
      100,
      30,   // 100-749店舗: 半径30px
      750,
      40    // 750店舗以上: 半径40px
    ]
  }
});
```

**2. クラスタ内店舗数（`cluster-count`レイヤー）**
```typescript
map.current.addLayer({
  id: 'cluster-count',
  type: 'symbol',
  source: 'shops',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',  // 店舗数を表示
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': 12
  }
});
```

**3. 個別ピン（`unclustered-point`レイヤー）**
```typescript
map.current.addLayer({
  id: 'unclustered-point',
  type: 'circle',
  source: 'shops',
  filter: ['!', ['has', 'point_count']],  // クラスタでないもののみ
  paint: {
    'circle-color': '#FF0000',   // 赤色
    'circle-radius': 8,          // 半径8px
    'circle-stroke-width': 1,
    'circle-stroke-color': '#fff'
  }
});
```

#### インタラクション
**クラスタクリック → ズームイン**
```typescript
map.current.on('click', 'clusters', async (e) => {
  const features = map.current?.queryRenderedFeatures(e.point, { layers: ['clusters'] });
  const clusterId = features?.[0].properties.cluster_id;
  const source: any = map.current?.getSource('shops');
  const zoom = await source.getClusterExpansionZoom(clusterId);
  map.current?.easeTo({ center: (features?.[0].geometry as any).coordinates, zoom });
});
```

**個別ピンクリック → ポップアップ表示**
```typescript
map.current.on('click', 'unclustered-point', (e) => {
  const props = e.features?.[0].properties;
  const coordinates = (e.features?.[0].geometry as any).coordinates.slice();
  showPopup(coordinates, props);
});
```

**カーソル変更（ホバー時）**
```typescript
map.current.on('mouseenter', 'clusters', () => setCursor('pointer'));
map.current.on('mouseleave', 'clusters', () => setCursor(''));
```

---

### 3. ブックマーク機能

#### データの保存場所
1. **ローカルストレージ**: ログイン前の一時保存
2. **Directus DB**: ログイン後の永続化

#### ブックマークの状態管理
```typescript
const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

// ローカルストレージから復元
useEffect(() => {
  const saved = localStorage.getItem('gourmet-map-bookmarks');
  if (saved) setBookmarkedIds(JSON.parse(saved));
}, []);
```

#### リモートブックマークの取得
```typescript
const fetchRemoteBookmarks = async () => {
  try {
    const result = await client.request(
      readItems('bookmarks', {
        fields: ['restaurant_id'],
        filter: { user_created: { _eq: '$CURRENT_USER' } }
      })
    );
    const ids = result.map((item: any) => item.restaurant_id);
    if (ids.length > 0) {
      setBookmarkedIds(ids);
      localStorage.setItem('gourmet-map-bookmarks', JSON.stringify(ids));
    }
  } catch (e) {}
};
```

#### ブックマークのトグル（追加・削除）
グローバル関数として実装（ポップアップのボタンから呼び出し）

```typescript
(window as any).toggleBookmark = async (shopId: string) => {
  // UIの即座更新
  const btn = document.getElementById(`bookmark-btn-${shopId}`);
  if (btn) {
    const isActive = btn.innerHTML === '★';
    btn.style.color = isActive ? '#ccc' : '#FFD700';
    btn.innerHTML = isActive ? '☆' : '★';
  }

  // 状態更新
  setBookmarkedIds(prev => {
    const exists = prev.includes(shopId);
    const newBookmarks = exists
      ? prev.filter(id => id !== shopId)   // 削除
      : [...prev, shopId];                 // 追加
    
    // ローカルストレージに保存
    localStorage.setItem('gourmet-map-bookmarks', JSON.stringify(newBookmarks));
    
    // ログイン済みの場合、DBに保存
    if (currentUser && !exists) {
      client.request(createItem('bookmarks', { restaurant_id: shopId }))
        .catch(() => {});
    }
    
    return newBookmarks;
  });
};
```

#### ブックマークフィルタ
```typescript
const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);

// フィルタリング処理
const filteredShops = allShops.filter(shop => {
  if (selectedCategory !== 'すべて' && shop.category !== selectedCategory) return false;
  if (showOnlyBookmarks && !bookmarkedIds.includes(shop.id)) return false;
  return true;
});
```

#### UIコンポーネント
```tsx
<label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', cursor: 'pointer' }}>
  <input
    type="checkbox"
    checked={showOnlyBookmarks}
    onChange={(e) => setShowOnlyBookmarks(e.target.checked)}
    style={{ marginRight: '5px' }}
  />
  {language === 'en' ? 'Saved only ★' : '保存済みのみ ★'}
</label>
```

#### 今後の改善案
- [ ] Directusのブックマーク削除API実装
- [ ] ブックマークの同期状態表示（クラウド同期済み等）
- [ ] ブックマーク一覧ページの作成

---

### 4. 多言語対応

#### 言語の状態管理
```typescript
const [language, setLanguage] = useState<'ja' | 'en'>('ja');
```

#### データベース側の設計
```
restaurants:
  - name_ja: "一蘭 渋谷店"
  - name_en: "Ichiran Shibuya"
  - description_ja: "豚骨ラーメンの専門店"
  - description_en: "Tonkotsu ramen specialty shop"

categories:
  - name_ja: "ラーメン"
  - name_en: "Ramen"
```

#### 表示切り替えロジック
```typescript
const displayName = language === 'en'
  ? (shop.name_en || shop.name_ja)
  : shop.name_ja;

const displayCategory = language === 'en'
  ? (shop.category_en || shop.category)
  : shop.category;
```

#### UI切り替えボタン
```tsx
<div style={{ display: 'flex', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
  <button
    onClick={() => setLanguage('ja')}
    style={{
      flex: 1,
      padding: '5px',
      background: language === 'ja' ? '#333' : '#fff',
      color: language === 'ja' ? '#fff' : '#333',
      border: 'none',
      cursor: 'pointer'
    }}
  >
    JA
  </button>
  <button
    onClick={() => setLanguage('en')}
    style={{
      flex: 1,
      padding: '5px',
      background: language === 'en' ? '#333' : '#fff',
      color: language === 'en' ? '#fff' : '#333',
      border: 'none',
      cursor: 'pointer'
    }}
  >
    EN
  </button>
</div>
```

#### カテゴリ選択の多言語対応
```tsx
<select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
  <option value="すべて">{language === 'en' ? 'All Categories' : 'すべてのカテゴリ'}</option>
  <option value="ラーメン">{language === 'en' ? 'Ramen' : 'ラーメン'}</option>
  <option value="カフェ">{language === 'en' ? 'Cafe' : 'カフェ'}</option>
  <option value="レストラン">{language === 'en' ? 'Restaurant' : 'レストラン'}</option>
</select>
```

#### 今後の改善案
- [ ] i18nライブラリ（`next-i18next`等）の導入
- [ ] URLパスによる言語切り替え（`/ja/`, `/en/`）
- [ ] ユーザー設定の保存（localStorage）
- [ ] ブラウザ言語の自動検出

---

### 5. ポップアップ表示（店舗詳細）

#### MapLibre Popup API の使用
```typescript
import maplibregl from 'maplibre-gl';

const showPopup = (coordinates: [number, number], shop: any) => {
  new maplibregl.Popup({ maxWidth: '240px' })
    .setLngLat(coordinates)
    .setHTML(popupContent)
    .addTo(map.current!);
};
```

#### ポップアップコンテンツの構築
```typescript
const displayName = language === 'en' ? (shop.name_en || shop.name_ja) : shop.name_ja;
const displayCategory = language === 'en' ? (shop.category_en || shop.category) : shop.category;
const isBookmarked = bookmarkedIds.includes(shop.id);
const bookmarkIcon = isBookmarked ? '★' : '☆';
const bookmarkColor = isBookmarked ? '#FFD700' : '#ccc';

const popupContent = `
  <div style="text-align: left; max-width: 220px;">
    ${shop.photo_url ? `
      <img
        src="${shop.photo_url}"
        style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;"
      >
    ` : ''}
    
    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
      <h3 style="margin: 0; font-size: 16px; font-weight: bold; width: 80%;">
        ${displayName}
      </h3>
      <button
        id="bookmark-btn-${shop.id}"
        onclick="window.toggleBookmark('${shop.id}')"
        style="background: none; border: none; cursor: pointer; font-size: 20px; color: ${bookmarkColor}; padding: 0;"
      >
        ${bookmarkIcon}
      </button>
    </div>
    
    <p style="margin: 4px 0 0; font-size: 13px; color: #666;">
      🏷 ${displayCategory}
    </p>
    
    ${shop.tiktok_url ? `
      <div id="tiktok-container-${shop.id}" style="margin-top: 10px;">
        <button
          onclick="window.loadTikTok('${shop.id}', '${shop.tiktok_url}')"
          style="width: 100%; padding: 8px 0; background: #FE2C55; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;"
        >
          🎵 Video
        </button>
      </div>
    ` : ''}
  </div>
`;
```

#### TikTok動画の埋め込み
```typescript
(window as any).loadTikTok = (shopId: string, videoUrl: string) => {
  const container = document.getElementById(`tiktok-container-${shopId}`);
  if (!container || !videoUrl) return;
  
  const videoIdMatch = videoUrl.match(/video\/(\d+)/);
  if (videoIdMatch) {
    // TikTok公式埋め込みコード
    container.innerHTML = `
      <blockquote
        class="tiktok-embed"
        cite="${videoUrl}"
        data-video-id="${videoIdMatch[1]}"
        style="max-width: 605px; min-width: 325px;"
      >
        <section></section>
      </blockquote>
    `;
    
    // TikTok埋め込みスクリプトを読み込み
    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
  }
};
```

#### 今後の改善案
- [ ] 価格帯の表示（`price_min`, `price_max`）
- [ ] 店舗説明文の表示（`description_ja/en`）
- [ ] 営業時間や住所の追加
- [ ] Google Mapsへのリンク
- [ ] シェア機能（SNS連携）

---

### 6. カテゴリフィルタリング

#### カテゴリの状態管理
```typescript
const [selectedCategory, setSelectedCategory] = useState('すべて');
```

#### フィルタリングロジック
```typescript
const filteredShops = allShops.filter(shop => {
  // カテゴリフィルタ
  if (selectedCategory !== 'すべて' && shop.category !== selectedCategory) {
    return false;
  }
  // ブックマークフィルタ
  if (showOnlyBookmarks && !bookmarkedIds.includes(shop.id)) {
    return false;
  }
  return true;
});
```

#### UIコンポーネント
```tsx
<select
  value={selectedCategory}
  onChange={(e) => setSelectedCategory(e.target.value)}
  style={{ padding: '5px', fontSize: '14px', width: '100%' }}
>
  <option value="すべて">
    {language === 'en' ? 'All Categories' : 'すべてのカテゴリ'}
  </option>
  <option value="ラーメン">
    {language === 'en' ? 'Ramen' : 'ラーメン'}
  </option>
  <option value="カフェ">
    {language === 'en' ? 'Cafe' : 'カフェ'}
  </option>
  <option value="レストラン">
    {language === 'en' ? 'Restaurant' : 'レストラン'}
  </option>
</select>
```

#### ⚠️ 現在の制限事項
- カテゴリは**ハードコード**されています（`page.tsx`内のselectタグ）
- Directusから動的にカテゴリを取得していません

#### 改善案（動的カテゴリ取得）
```typescript
// カテゴリマスタを取得
const [categories, setCategories] = useState<Category[]>([]);

useEffect(() => {
  const fetchCategories = async () => {
    const result = await client.request(
      readItems('categories', {
        sort: ['sort']
      })
    );
    setCategories(result);
  };
  fetchCategories();
}, []);

// UIで動的にレンダリング
<select value={selectedCategory} onChange={...}>
  <option value="すべて">All Categories</option>
  {categories.map(cat => (
    <option key={cat.id} value={cat.name_ja}>
      {language === 'en' ? cat.name_en : cat.name_ja}
    </option>
  ))}
</select>
```

---

## アカウント・クレデンシャル情報一覧

**⚠️ セキュリティ注意:**  
以下の情報は**実際のパスワードやAPIキーを含まない例**です。  
実際の認証情報は、**セキュアな方法**（パスワード管理ツール、チーム内の暗号化ドキュメント等）で共有してください。

### 1. GitHub
- **用途**: ソースコード管理
- **リポジトリURL**: `https://github.com/your-username/gourmet-map`
- **アカウント**: `your-github-username`
- **アクセス権限**: Admin（または適切な権限）
- **ブランチ戦略**: `main`ブランチが本番環境

### 2. Vercel
- **用途**: フロントエンドホスティング
- **プロジェクト名**: `gourmet-map-app`
- **URL**: `https://gourmet-map-app.vercel.app`（例）
- **アカウント**: `your-vercel-account@example.com`
- **連携**: GitHubリポジトリと自動デプロイ設定済み
- **重要設定**:
  - Root Directory: `gourmet-map-app`
  - Build Command: `next build`
  - Environment Variables: `NEXT_PUBLIC_MAPTILER_KEY`, `NEXT_PUBLIC_API_URL`

### 3. Railway
- **用途**: バックエンド（Directus + PostgreSQL）ホスティング
- **プロジェクト名**: `gourmet-cms-production`（例）
- **Directus URL**: `https://directus-production-xxxx.up.railway.app`
- **Database URL**: `postgresql://...`（Railwayが自動生成）
- **アカウント**: `your-railway-account@example.com`
- **サービス構成**:
  - Directus Service
  - PostgreSQL Database（自動プロビジョニング）
- **重要設定**:
  - `ADMIN_EMAIL` / `ADMIN_PASSWORD`: 管理者アカウント
  - `DATABASE_URL`: Railwayが自動設定
  - `CORS_ORIGIN`: Vercelのドメインに設定推奨

### 4. MapTiler
- **用途**: 地図タイルデータ提供
- **ダッシュボード**: `https://cloud.maptiler.com/`
- **APIキー**: `xxxxxxxxxxxxxxxxxxxxxxxx`（`.env.local`に設定）
- **アカウント**: `your-maptiler-account@example.com`
- **プラン**: Free / Pro（使用状況に応じて）
- **月間リクエスト制限**: プランによる

### 5. Xserver
- **用途**: ドメイン・DNS管理
- **ドメイン**: `example.com`（例）
- **アカウント**: `your-xserver-id`
- **管理画面**: `https://www.xserver.ne.jp/`
- **DNS設定**:
  - フロントエンド: `CNAME` → Vercelのドメイン
  - バックエンド: `CNAME` → Railwayのドメイン

---

## 📝 追加情報・備考

### プロジェクトの歴史
このプロジェクトは**プロトタイプ段階**からスタートし、現在は基本機能が実装済みです。  
そのため、以下のような特徴があります:

- **単一ファイル集約**: [app/page.tsx](gourmet-map-app/app/page.tsx) に全機能が集約
- **コンポーネント未分割**: リファクタリング推奨
- **ハードコード部分**: カテゴリ選択など、動的化の余地あり

### リファクタリング推奨事項
将来的な保守性向上のため、以下の改善を推奨します:

1. **コンポーネント分割**
   ```
   app/
   ├── page.tsx                # メイン（ロジック統合）
   ├── components/
   │   ├── Map.tsx             # 地図表示
   │   ├── AuthPanel.tsx       # 認証UI
   │   ├── FilterPanel.tsx     # フィルタUI
   │   └── ShopPopup.tsx       # ポップアップ
   ```

2. **状態管理ライブラリの導入**
   - Zustand / Jotai / Redux などの検討

3. **APIクライアントの分離**
   ```typescript
   // lib/directus.ts
   export const directusClient = createDirectus(...);
   export const fetchShops = async () => { ... };
   ```

4. **型定義の整理**
   ```typescript
   // types/index.ts
   export interface Shop { ... }
   export interface Category { ... }
   ```

5. **環境変数のバリデーション**
   ```typescript
   // lib/env.ts
   if (!process.env.NEXT_PUBLIC_MAPTILER_KEY) {
     throw new Error('Missing MAPTILER_KEY');
   }
   ```

### トラブルシューティング

#### 地図が表示されない
- [ ] `NEXT_PUBLIC_MAPTILER_KEY`が正しく設定されているか確認
- [ ] ブラウザのコンソールでエラーを確認
- [ ] MapTilerのAPIキー使用制限を確認

#### データが取得できない
- [ ] `NEXT_PUBLIC_API_URL`が正しいか確認
- [ ] DirectusのCORS設定を確認
- [ ] Directusの権限設定（Public役割の読み取り権限）を確認
- [ ] Network タブで API リクエストのステータスコードを確認

#### ログインできない
- [ ] Directusの管理画面でユーザーが存在するか確認
- [ ] メールアドレス・パスワードが正しいか確認
- [ ] CORSエラーが出ていないか確認

#### ブックマークが保存されない
- [ ] ログインしているか確認
- [ ] Directusの`bookmarks`コレクションの権限設定を確認
- [ ] ブラウザのlocalStorageが有効か確認

---

## 🌿 ブランチ戦略とGitワークフロー

このプロジェクトでは、複数人での開発を想定したブランチ戦略を採用しています。

### ブランチの役割

```
main (本番環境)
  ├── 常に安定したコード
  ├── 本番環境にデプロイされるブランチ
  └── 直接コミット禁止（Pull Requestのみ）

develop (開発統合)
  ├── 日々の開発はここに統合
  ├── 機能ブランチのマージ先
  └── テスト済みの機能がまとまったらmainへマージ

feature/* (機能開発)
  ├── 新機能開発用の個別ブランチ
  ├── developから分岐
  └── 完了後はdevelopにマージ
```

### 開発フロー

#### 1. 新機能を開発する場合

```bash
# 1. developブランチを最新にする
git checkout develop
git pull origin develop

# 2. 機能ブランチを作成（例: ブックマーク一覧機能）
git checkout -b feature/bookmark-list

# 3. 開発作業（コーディング、テスト）
# ファイルを編集...

# 4. コミット
git add .
git commit -m "feat: ブックマーク一覧ページを追加"

# 5. リモートにプッシュ
git push -u origin feature/bookmark-list

# 6. GitHubでPull Requestを作成
# develop ← feature/bookmark-list
```

#### 2. Pull Requestのレビュー・マージ

```bash
# レビュー担当者が確認後、GitHubでマージ

# マージ後、ローカルのdevelopを更新
git checkout develop
git pull origin develop

# 不要になったブランチを削除
git branch -d feature/bookmark-list
git push origin --delete feature/bookmark-list
```

#### 3. 本番リリース（developからmainへ）

```bash
# 1. developが十分にテストされたら
git checkout main
git pull origin main

# 2. developをmainにマージ
git merge develop

# 3. タグを付ける（バージョン管理）
git tag -a v1.0.0 -m "Release version 1.0.0"

# 4. プッシュ
git push origin main
git push origin v1.0.0

# → Vercelが自動的に本番デプロイ
```

### ブランチ命名規則

```
feature/機能名     新機能開発
  例: feature/search-filter
      feature/user-profile

bugfix/バグ名      バグ修正
  例: bugfix/map-crash
      bugfix/login-error

hotfix/緊急修正名  本番の緊急修正（mainから直接分岐）
  例: hotfix/security-patch
      hotfix/critical-bug
```

### コミットメッセージ規約

```
feat: 新機能
  例: feat: カテゴリフィルタ機能を追加

fix: バグ修正
  例: fix: ログイン時のエラーを修正

docs: ドキュメント変更
  例: docs: READMEにAPI仕様を追記

style: コードスタイル変更（動作に影響なし）
  例: style: インデントを修正

refactor: リファクタリング
  例: refactor: Mapコンポーネントを分離

test: テスト追加・修正
  例: test: ブックマーク機能のテストを追加

chore: ビルド設定など
  例: chore: パッケージを更新
```

### Pull Request テンプレート

Pull Requestを作成する際は、以下の内容を記載してください：

```markdown
## 概要
何を変更したか簡潔に説明

## 変更内容
- [ ] 機能A を追加
- [ ] 機能B を修正

## テスト
- [ ] ローカルで動作確認済み
- [ ] ビルドエラーなし

## スクリーンショット
（UIの変更がある場合）

## 関連Issue
#123
```

---

## 📞 サポート・連絡先

プロジェクトに関する質問や問題は、以下の方法で対応してください:

1. **GitHub Issues**: バグ報告や機能要望
2. **Pull Request**: コードレビューと機能追加
3. **チーム内Slack**: 緊急の問題や相談
4. **ドキュメント更新**: この`README.md`を随時更新してください

---

## ライセンス

（プロジェクトのライセンスを記載してください）

---

**最終更新日**: 2026年2月1日  
**ドキュメントバージョン**: 1.0.0

---

このREADMEは、プロジェクトの成長に合わせて継続的に更新してください。  
不明点や誤りがあれば、積極的に修正・改善をお願いします。
