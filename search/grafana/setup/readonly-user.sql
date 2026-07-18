-- Grafana からの接続用の読み取り専用ユーザー。
-- 匿名公開する Grafana は Postgres データソース経由で任意の SELECT を
-- 実行できてしまう可能性があるため、必ずこの専用ユーザーを使うこと。
-- パスワードを変更してから実行する:
--   psql "$DATABASE_URL" -f readonly-user.sql

CREATE ROLE grafana_reader LOGIN PASSWORD 'CHANGE_ME' CONNECTION LIMIT 10;

GRANT USAGE ON SCHEMA public TO grafana_reader;
GRANT SELECT ON res, oekaki TO grafana_reader;

-- 匿名ユーザーは任意の SELECT を投げられるため、重いクエリ
-- (pg_sleep や巨大な JOIN など)で DB を占有されないように制限する。
ALTER ROLE grafana_reader SET statement_timeout = '10s';
ALTER ROLE grafana_reader SET idle_in_transaction_session_timeout = '10s';
