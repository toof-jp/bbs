-- no-transaction
-- Grafana ダッシュボードの期間集計クエリ用に datetime のインデックスを追加。
-- crawler の INSERT をブロックしないよう CONCURRENTLY でビルドする
-- (そのためトランザクション外で実行する必要がある)。
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_res_datetime ON res (datetime);
