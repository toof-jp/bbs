# Search Post Discord Bot

BBS（掲示板）の投稿を検索してDiscordに表示するボットです。メンションで呼び出して、様々な条件で投稿を検索できます。

## 機能

- メンションによる検索クエリの受付
- 複数の検索条件のサポート
  - ID検索
  - 本文検索
  - 名前・トリップ検索
  - お絵描き投稿フィルタ
  - 日付範囲指定
  - 並び順指定
  - 表示件数指定
- 検索結果の表示（デフォルト5件、環境変数で変更可能）
- お絵描き投稿の画像表示

## 使い方

Discordでボットをメンションして検索クエリを送信します：

```
@search-bot 検索ワード
```

### 検索オプション

- `id:abc123` - 特定のIDで検索
- `name_and_trip:名前` - 名前・トリップで検索
- `oekaki:true` - お絵描き投稿のみ検索
- `since:2024-01-01` - 開始日指定（YYYY-MM-DD形式）
- `until:2024-12-31` - 終了日指定（YYYY-MM-DD形式）
- `ascending:true` - 昇順で表示（デフォルトは降順）
- `limit:10` - 表示件数指定（デフォルトは環境変数DEFAULT_LIMITの値）

### 使用例

```
@search-bot id:abc123 本文検索ワード
@search-bot name_and_trip:太郎 oekaki:true
@search-bot since:2024-01-01 until:2024-12-31 limit:20
```

## セットアップ

1. 依存関係のインストール
   ```bash
   cargo build
   ```

2. 環境変数の設定
   `.env`ファイルを作成し、以下の環境変数を設定：
   ```
   DISCORD_TOKEN=your_discord_bot_token
   API_BASE_URL=http://localhost:3000
   IMAGE_URL_PREFIX=https://example.com/images/
   DEFAULT_LIMIT=5
   RUST_LOG=info
   ```

3. 実行
   ```bash
   cargo run
   ```

## 環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| DISCORD_TOKEN | Discord Botのトークン | BOT_TOKEN_HERE |
| API_BASE_URL | 検索APIのベースURL | http://localhost:3000 |
| IMAGE_URL_PREFIX | お絵描き画像のURLプレフィックス | https://example.com/images/ |
| DEFAULT_LIMIT | デフォルトの表示件数 | 5 |
| RUST_LOG | ログレベル | info |

## 開発

### テストの実行

```bash
cargo test
```

### フォーマット

```bash
cargo fmt
```

### リンターの実行

```bash
cargo clippy
```