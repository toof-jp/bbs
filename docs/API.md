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