# 旅行費用割り勘アプリ

React + TypeScriptで実装された複数通貨対応の旅行費用割り勘アプリです。

## 機能

- 参加者の追加・削除
- 複数通貨での支払い記録（JPY, USD, EUR, GBP, CNY, KRW, THB, SGD）
- リアルタイム為替レート取得
- 支払いの編集・削除
- 自動精算計算
- 通貨別支払い合計表示

## セットアップ

### 方法1: ローカル環境

#### 1. 依存関係のインストール

```bash
npm install
```

#### 2. 環境変数の設定

`.env.local`ファイルを作成し、為替レートAPIキーを設定してください：

```bash
# .env.local
NEXT_PUBLIC_EXCHANGE_RATE_API_KEY=your_api_key_here
```

#### 3. 開発サーバーの起動

```bash
npm run dev
```

**アクセスURL**: http://localhost:3000

### 方法2: Docker環境

#### 1. 環境変数の設定

`.env`ファイルを作成し、為替レートAPIキーを設定してください：

```bash
# .env
NEXT_PUBLIC_EXCHANGE_RATE_API_KEY=your_api_key_here
```

#### 2. Dockerコンテナの起動

**開発環境:**
```bash
npm run docker:dev
```
**アクセスURL**: http://localhost:3001

**本番環境:**
```bash
npm run docker:prod
```
**アクセスURL**: http://localhost:3002

#### 3. その他のDockerコマンド

```bash
# ビルド
npm run docker:build

# コンテナ停止
npm run docker:down

# コンテナとボリュームの完全削除
npm run docker:clean
```

### 方法3: Vercelデプロイ

#### 1. Vercel CLIのインストール

```bash
npm i -g vercel
```

#### 2. Vercelにログイン

```bash
vercel login
```

#### 3. 環境変数の設定

VercelダッシュボードまたはCLIで環境変数を設定：

```bash
vercel env add NEXT_PUBLIC_EXCHANGE_RATE_API_KEY
```

#### 4. デプロイ

```bash
vercel --prod
```

#### 5. 自動デプロイ（GitHub連携）

GitHubリポジトリとVercelを連携すると、プッシュ時に自動デプロイされます。

## 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `NEXT_PUBLIC_EXCHANGE_RATE_API_KEY` | 為替レートAPIキー | はい |

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: React Hooks
- **為替レートAPI**: exchangerate.host
- **コンテナ化**: Docker
- **デプロイ**: Vercel

## Docker構成

### マルチステージビルド
- **development**: 開発環境用
- **production**: 本番環境用
- **builder**: ビルド専用ステージ

### 環境分離
- **開発環境**: ホットリロード対応 (ポート3001)
- **本番環境**: 最適化された実行環境 (ポート3002)

## デプロイ構成

### Vercel
- **自動デプロイ**: GitHub連携でプッシュ時に自動デプロイ
- **環境変数**: Vercelダッシュボードで管理
- **CDN**: グローバルCDNで高速配信
- **SSL**: 自動SSL証明書

## セキュリティ

- APIキーは環境変数で管理
- `.env.local`ファイルはGitにコミットされません
- 為替レートはローカルストレージにキャッシュ（1時間有効）
- Docker環境でのセキュアな実行
- Vercel環境でのセキュアな実行

## ライセンス

MIT License
