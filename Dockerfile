# ベースイメージ
FROM node:18

# 作業ディレクトリ
WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm install

# アプリケーションのコピー
COPY . .

# ポート開放
EXPOSE 3000

# 開発サーバー起動
CMD ["npm", "run", "dev"] 