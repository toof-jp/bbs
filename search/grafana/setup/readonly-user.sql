-- Grafana からの接続用の読み取り専用ユーザー。
-- 匿名公開する Grafana は Postgres データソース経由で任意の SELECT を
-- 実行できてしまう可能性があるため、必ずこの専用ユーザーを使うこと。
-- パスワードを変更してから実行する:
--   psql "$DATABASE_URL" -f readonly-user.sql

CREATE ROLE grafana_reader LOGIN PASSWORD 'CHANGE_ME';

GRANT USAGE ON SCHEMA public TO grafana_reader;
GRANT SELECT ON res, oekaki TO grafana_reader;
