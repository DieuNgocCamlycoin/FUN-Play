
CREATE UNIQUE INDEX IF NOT EXISTS idx_pplp_events_ingest_hash 
ON pplp_events (ingest_hash) 
WHERE ingest_hash IS NOT NULL;
