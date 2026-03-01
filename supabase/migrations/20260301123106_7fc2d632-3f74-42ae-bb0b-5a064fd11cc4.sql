
-- Drop partial index and create a proper unique constraint
DROP INDEX IF EXISTS idx_pplp_events_ingest_hash;
ALTER TABLE pplp_events ADD CONSTRAINT uq_pplp_events_ingest_hash UNIQUE (ingest_hash);
