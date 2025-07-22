-- Add index on id column for ranking performance
CREATE INDEX IF NOT EXISTS idx_res_id ON res(id) WHERE id IS NOT NULL AND id != '';

-- Add composite index for id and datetime (optional, for better performance)
CREATE INDEX IF NOT EXISTS idx_res_id_datetime ON res(id, datetime) WHERE id IS NOT NULL AND id != '';