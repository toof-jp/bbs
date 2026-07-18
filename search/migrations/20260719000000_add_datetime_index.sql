-- Grafana ダッシュボードの期間集計クエリ用に datetime のインデックスを追加
CREATE INDEX IF NOT EXISTS idx_res_datetime ON res (datetime);
