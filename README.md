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

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、為替レートAPIキーを設定してください：

```bash
# .env.local
NEXT_PUBLIC_EXCHANGE_RATE_API_KEY=your_api_key_here
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

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

## セキュリティ

- APIキーは環境変数で管理
- `.env.local`ファイルはGitにコミットされません
- 為替レートはローカルストレージにキャッシュ（1時間有効）

## ライセンス

MIT License
