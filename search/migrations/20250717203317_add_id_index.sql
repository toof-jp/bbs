CREATE EXTENSION IF NOT EXISTS pg_bigm;

CREATE INDEX IF NOT EXISTS idx_main_text ON res USING gin (main_text gin_bigm_ops);

-- Add index on id column for ranking performance
CREATE INDEX IF NOT EXISTS idx_res_id ON res(id) WHERE id IS NOT NULL AND id != '';

-- Add composite index for id and datetime (optional, for better performance)
CREATE INDEX IF NOT EXISTS idx_res_id_datetime ON res(id, datetime) WHERE id IS NOT NULL AND id != '';
