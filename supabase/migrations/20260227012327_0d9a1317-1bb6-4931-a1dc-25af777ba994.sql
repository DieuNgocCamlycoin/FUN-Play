
-- =============================================
-- PPLP EVENT-SOURCING MODEL
-- Core tables for event-based scoring pipeline
-- =============================================

-- 1) EVENT TYPES ENUM
CREATE TYPE public.pplp_event_type AS ENUM (
  'LOGIN', 'LIGHT_CHECKIN',
  'PROFILE_COMPLETED', 'PPLP_ACCEPTED', 'MANTRA_ACK',
  'POST_CREATED', 'COMMENT_CREATED', 'VIDEO_UPLOADED', 'COURSE_PUBLISHED',
  'LIKE_GIVEN', 'SHARE_GIVEN', 'BOOKMARK_GIVEN',
  'HELP_NEWBIE', 'ANSWER_QUESTION', 'MENTOR_SESSION',
  'REPORT_SUBMITTED', 'MEDIATION_JOINED', 'RESOLUTION_ACCEPTED',
  'DONATION_MADE', 'REWARD_SENT',
  'GOV_VOTE_CAST',
  'BUG_REPORTED', 'PR_MERGED', 'PROPOSAL_SUBMITTED',
  'ONCHAIN_TX_VERIFIED',
  'PPLP_RATING_SUBMITTED'
);

-- 2) PPLP_EVENTS - append-only event store (trái tim hệ thống)
CREATE TABLE public.pplp_events (
  event_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type public.pplp_event_type NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT CHECK (target_type IN ('user', 'content', 'wallet', 'system')),
  target_id TEXT,
  context_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT CHECK (source IN ('web', 'mobile', 'api', 'system')) DEFAULT 'web',
  payload_json JSONB DEFAULT '{}'::jsonb,
  scoring_tags TEXT[] DEFAULT '{}',
  risk_flags TEXT[] DEFAULT '{}',
  ingest_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pplp_events_actor ON public.pplp_events (actor_user_id, occurred_at DESC);
CREATE INDEX idx_pplp_events_type ON public.pplp_events (event_type, occurred_at DESC);
CREATE INDEX idx_pplp_events_target ON public.pplp_events (target_type, target_id);

ALTER TABLE public.pplp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON public.pplp_events FOR SELECT
  USING (auth.uid() = actor_user_id);

CREATE POLICY "Users can insert own events"
  ON public.pplp_events FOR INSERT
  WITH CHECK (auth.uid() = actor_user_id);

CREATE POLICY "Admins can view all events"
  ON public.pplp_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) PPLP_RATINGS - community peer ratings on content
CREATE TABLE public.pplp_ratings (
  rating_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'post', 'comment', 'course')),
  rater_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL,
  pillar_truth SMALLINT NOT NULL DEFAULT 0 CHECK (pillar_truth BETWEEN 0 AND 2),
  pillar_sustain SMALLINT NOT NULL DEFAULT 0 CHECK (pillar_sustain BETWEEN 0 AND 2),
  pillar_heal_love SMALLINT NOT NULL DEFAULT 0 CHECK (pillar_heal_love BETWEEN 0 AND 2),
  pillar_life_service SMALLINT NOT NULL DEFAULT 0 CHECK (pillar_life_service BETWEEN 0 AND 2),
  pillar_unity_source SMALLINT NOT NULL DEFAULT 0 CHECK (pillar_unity_source BETWEEN 0 AND 2),
  comment TEXT,
  weight_applied NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_id, rater_user_id)
);

CREATE INDEX idx_pplp_ratings_author ON public.pplp_ratings (author_user_id, created_at DESC);
CREATE INDEX idx_pplp_ratings_content ON public.pplp_ratings (content_id);

ALTER TABLE public.pplp_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ratings on own content"
  ON public.pplp_ratings FOR SELECT
  USING (auth.uid() = author_user_id OR auth.uid() = rater_user_id);

CREATE POLICY "Users can insert own ratings"
  ON public.pplp_ratings FOR INSERT
  WITH CHECK (auth.uid() = rater_user_id AND auth.uid() != author_user_id);

CREATE POLICY "Admins can view all ratings"
  ON public.pplp_ratings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 4) SIGNALS_ANTI_FARM - fraud detection signals
CREATE TABLE public.signals_anti_farm (
  signal_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'burst_like', 'ring_rating', 'duplicate_text', 'bot_pattern',
    'temporal_anomaly', 'sybil_cluster', 'fake_engagement', 'wallet_funnel'
  )),
  severity NUMERIC NOT NULL DEFAULT 0 CHECK (severity BETWEEN 0 AND 1),
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,
  evidence_json JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'confirmed', 'cleared')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_signals_user ON public.signals_anti_farm (user_id, created_at DESC);
CREATE INDEX idx_signals_status ON public.signals_anti_farm (status, signal_type);

ALTER TABLE public.signals_anti_farm ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage signals"
  ON public.signals_anti_farm FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 5) LIGHT_SCORE_LEDGER - historical score records
CREATE TABLE public.light_score_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('day', 'week', 'month')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_score NUMERIC NOT NULL DEFAULT 0,
  reputation_weight NUMERIC NOT NULL DEFAULT 1.0,
  consistency_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  sequence_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  integrity_penalty NUMERIC NOT NULL DEFAULT 0,
  final_light_score INTEGER NOT NULL DEFAULT 0,
  level TEXT NOT NULL DEFAULT 'presence',
  explain_ref UUID,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, period, period_start)
);

CREATE INDEX idx_ledger_user_period ON public.light_score_ledger (user_id, period, period_start DESC);

ALTER TABLE public.light_score_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ledger"
  ON public.light_score_ledger FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage ledger"
  ON public.light_score_ledger FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 6) SCORE_EXPLANATIONS - audit trail for scoring decisions
CREATE TABLE public.score_explanations (
  explain_ref UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  top_contributors_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  penalties_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  scoring_version TEXT NOT NULL DEFAULT 'v2.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.score_explanations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own explanations"
  ON public.score_explanations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage explanations"
  ON public.score_explanations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 7) SEQUENCES - tracking behavioral chains for bonus scoring
CREATE TABLE public.sequences (
  sequence_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_type TEXT NOT NULL CHECK (sequence_type IN (
    'mentor_chain', 'value_loop', 'conflict_harmony',
    'light_growth', 'economic_integrity', 'community_builder'
  )),
  start_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_at TIMESTAMPTZ,
  state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'complete', 'invalid')),
  evidence_event_ids UUID[] DEFAULT '{}',
  score_bonus NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sequences_user ON public.sequences (user_id, state, created_at DESC);

ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sequences"
  ON public.sequences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage sequences"
  ON public.sequences FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
