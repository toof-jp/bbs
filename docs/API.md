# Search API 仕様書

## 概要

このAPIは掲示板の投稿を検索するためのRESTful APIです。

## ベースURL

```
http://localhost:3000/api/v1
```

## エンドポイント

### 1. 投稿検索

投稿を検索し、検索結果を返します。

```
GET /api/v1/search
```

#### パラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|---|------|-----------|------|
| id | string | × | "" | 投稿者のID |
| main_text | string | × | "" | 投稿本文のキーワード |
| name_and_trip | string | × | "" | 投稿者の名前とトリップ |
| cursor | integer | × | null | ページネーション用カーソル |
| ascending | boolean | × | false | 昇順/降順の指定 |
| oekaki | boolean | × | false | お絵描き投稿のフィルタ |
| since | string | × | null | 開始日 (YYYY-MM-DD形式) |
| until | string | × | null | 終了日 (YYYY-MM-DD形式) |

#### レスポンス

成功時: 200 OK

```json
[
  {
    "no": 123,
    "name_and_trip": "名無しさん",
    "datetime": "2024-01-01T12:00:00",
    "datetime_text": "2024/01/01(月) 12:00:00",
    "id": "abc123",
    "main_text": "投稿本文",
    "main_text_html": "<p>投稿本文</p>",
    "oekaki_id": 456,
    "oekaki_title": "お絵描きタイトル",
    "original_oekaki_res_no": 100
  }
]
```

#### レスポンスフィールド

| フィールド | 型 | 説明 |
|-----------|---|------|
| no | integer | 投稿番号 |
| name_and_trip | string | 投稿者名とトリップ |
| datetime | string | 投稿日時 (ISO 8601形式) |
| datetime_text | string | 投稿日時 (表示用テキスト) |
| id | string | 投稿者ID |
| main_text | string | 投稿本文 |
| main_text_html | string | 投稿本文 (HTML形式) |
| oekaki_id | integer/null | お絵描きID |
| oekaki_title | string/null | お絵描きタイトル |
| original_oekaki_res_no | integer/null | 元のお絵描き投稿番号 |

### 2. 検索結果カウント

検索条件に一致する投稿の数を返します。

```
GET /api/v1/search/count
```

#### パラメータ

検索エンドポイントと同じパラメータを使用します。

#### レスポンス

成功時: 200 OK

```json
{
  "total_res_count": 1234,
  "unique_id_count": 567
}
```

#### レスポンスフィールド

| フィールド | 型 | 説明 |
|-----------|---|------|
| total_res_count | integer | 総投稿数 |
| unique_id_count | integer | ユニークID数 |

### 3. IDランキング

IDごとの投稿数ランキングを返します。

```
GET /api/v1/ranking
```

#### パラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|---|------|-----------|------|
| id | string | × | null | 投稿者のID（部分一致） |
| main_text | string | × | null | 投稿本文のキーワード（部分一致） |
| name_and_trip | string | × | null | 投稿者の名前とトリップ（部分一致） |
| oekaki | boolean | × | null | お絵描き投稿のフィルタ |
| since | string | × | null | 開始日 (YYYY-MM-DD形式) |
| until | string | × | null | 終了日 (YYYY-MM-DD形式) |
| ranking_type | string | × | "post_count" | ランキングタイプ ("post_count" または "recent_activity") |
| min_posts | integer | × | 1 | 最小投稿数フィルタ |

#### レスポンス

成功時: 200 OK

```json
{
  "ranking": [
    {
      "rank": 1,
      "id": "abc123",
      "post_count": 1234,
      "latest_post_no": 56789,
      "latest_post_datetime": "2024-12-31T23:59:59Z",
      "first_post_no": 100,
      "first_post_datetime": "2024-01-01T00:00:00Z"
    },
    {
      "rank": 2,
      "id": "def456",
      "post_count": 987,
      "latest_post_no": 56788,
      "latest_post_datetime": "2024-12-31T23:30:00Z",
      "first_post_no": 200,
      "first_post_datetime": "2024-01-02T00:00:00Z"
    }
  ],
  "total_unique_ids": 567,
  "search_conditions": {
    "id": null,
    "main_text": null,
    "name_and_trip": null,
    "oekaki": null,
    "since": null,
    "until": null
  }
}
```

#### レスポンスフィールド

| フィールド | 型 | 説明 |
|-----------|---|------|
| ranking | array | ランキング項目の配列 |
| ranking[].rank | integer | 順位 |
| ranking[].id | string | 投稿者ID |
| ranking[].post_count | integer | 投稿数 |
| ranking[].latest_post_no | integer | 最新投稿番号 |
| ranking[].latest_post_datetime | string | 最新投稿日時 (ISO 8601形式) |
| ranking[].first_post_no | integer | 最初の投稿番号 |
| ranking[].first_post_datetime | string | 最初の投稿日時 (ISO 8601形式) |
| total_unique_ids | integer | 条件に一致するユニークID総数 |
| search_conditions | object | 適用された検索条件 |

## エラーレスポンス

エラー時は適切なHTTPステータスコードとエラーメッセージが返されます。

## 使用例

### 基本的な検索

```bash
curl "http://localhost:3000/api/v1/search?main_text=キーワード"
```

### ID指定での検索

```bash
curl "http://localhost:3000/api/v1/search?id=abc123"
```

### 日付範囲を指定した検索

```bash
curl "http://localhost:3000/api/v1/search?since=2024-01-01&until=2024-12-31"
```

### お絵描き投稿のみ検索

```bash
curl "http://localhost:3000/api/v1/search?oekaki=true"
```

### 昇順での検索

```bash
curl "http://localhost:3000/api/v1/search?ascending=true"
```

### IDランキングの取得

```bash
curl "http://localhost:3000/api/v1/ranking"
```

### 検索条件付きランキング

```bash
curl "http://localhost:3000/api/v1/ranking?main_text=キーワード&since=2024-01-01"
```

### 最近の活動順ランキング

```bash
curl "http://localhost:3000/api/v1/ranking?ranking_type=recent_activity"
```

### 最小投稿数を指定したランキング

```bash
curl "http://localhost:3000/api/v1/ranking?min_posts=10"
```