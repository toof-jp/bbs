# bbs-mcp-server

掲示板検索のMCPサーバー。search-backend の REST API を MCP ツールとして公開する。

- エンドポイント: `POST /mcp` (Streamable HTTP、ステートレス、認証なし)
- ヘルスチェック: `GET /healthz`

## Tools

- `search_posts` — 本文・投稿者ID・名前/トリップ・期間などでレスを検索 (カーソルページング)
- `count_posts` — 検索条件に一致するレス総数とユニークID数
- `get_ranking` — 投稿者IDランキング (投稿数順 / 直近活動順)
- `get_oekaki_image` — `oekaki_id` を指定してお絵かき画像を取得

## Environment Variables

- `BACKEND_BASE_URL` — search-backend のベースURL (デフォルト `http://localhost:3000`)
- `IMAGE_BASE_URL` — お絵かき画像のベースURL (デフォルト `${BACKEND_BASE_URL}/images`)
- `PORT` — リッスンポート (デフォルト `8080`)

## Development

```sh
npm ci
npm run build
BACKEND_BASE_URL=https://bbs.toof.jp npm start
```
