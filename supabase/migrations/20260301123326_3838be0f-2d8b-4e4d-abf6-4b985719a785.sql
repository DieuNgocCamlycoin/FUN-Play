
-- Update source check to include db_trigger and backfill
ALTER TABLE pplp_events DROP CONSTRAINT pplp_events_source_check;
ALTER TABLE pplp_events ADD CONSTRAINT pplp_events_source_check 
  CHECK (source = ANY (ARRAY['web', 'mobile', 'api', 'system', 'db_trigger', 'backfill']));

-- Update target_type check to include actual types used by triggers
ALTER TABLE pplp_events DROP CONSTRAINT pplp_events_target_type_check;
ALTER TABLE pplp_events ADD CONSTRAINT pplp_events_target_type_check 
  CHECK (target_type = ANY (ARRAY['user', 'content', 'wallet', 'system', 'post', 'comment', 'post_comment', 'video', 'checkin', 'donation']));
