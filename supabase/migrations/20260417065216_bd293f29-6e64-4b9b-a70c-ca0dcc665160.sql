-- ============================================================
-- Identity + Trust Layer Spec v1.0 — DB Schema
-- 9 tables: did_registry, identity_links, trust_profile,
-- sbt_registry, sbt_issuance_rules, attestation_log,
-- identity_events, identity_epoch_snapshot, recovery_log
-- ============================================================

-- ENUMS
DO $$ BEGIN
  CREATE TYPE public.did_level AS ENUM ('L0','L1','L2','L3','L4');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.did_entity_type AS ENUM ('human','organization','ai_agent','validator','merchant');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.did_status AS ENUM ('pending','basic','verified','trusted','restricted','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.trust_tier AS ENUM ('T0','T1','T2','T3','T4');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.sbt_category AS ENUM ('identity','trust','contribution','credential','milestone','legacy');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.sbt_status AS ENUM ('active','frozen','revoked','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.sbt_issue_mode AS ENUM ('auto','semi_auto','governance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.identity_link_type AS ENUM ('wallet','social','device','organization','referrer','mentor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 1. did_registry — gốc DID
-- ============================================================
CREATE TABLE IF NOT EXISTS public.did_registry (
  did_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  entity_type did_entity_type NOT NULL DEFAULT 'human',
  level did_level NOT NULL DEFAULT 'L0',
  status did_status NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  anchor_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_did_registry_user ON public.did_registry(user_id);
CREATE INDEX IF NOT EXISTS idx_did_registry_level ON public.did_registry(level);
ALTER TABLE public.did_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DID public read" ON public.did_registry FOR SELECT USING (true);
CREATE POLICY "Users update own DID" ON public.did_registry FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own DID" ON public.did_registry FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all DIDs" ON public.did_registry FOR ALL USING (has_role(auth.uid(),'admin'));

-- ============================================================
-- 2. identity_links — wallet/social/device linking
-- ============================================================
CREATE TABLE IF NOT EXISTS public.identity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  did_id UUID NOT NULL REFERENCES public.did_registry(did_id) ON DELETE CASCADE,
  link_type identity_link_type NOT NULL,
  link_value TEXT NOT NULL,
  verification_state TEXT NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (did_id, link_type, link_value)
);
CREATE INDEX IF NOT EXISTS idx_identity_links_did ON public.identity_links(did_id);
CREATE INDEX IF NOT EXISTS idx_identity_links_value ON public.identity_links(link_type, link_value);
ALTER TABLE public.identity_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Identity links readable by owner" ON public.identity_links FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.did_registry d WHERE d.did_id = identity_links.did_id AND d.user_id = auth.uid()));
CREATE POLICY "Identity links manageable by owner" ON public.identity_links FOR ALL
  USING (EXISTS (SELECT 1 FROM public.did_registry d WHERE d.did_id = identity_links.did_id AND d.user_id = auth.uid()));
CREATE POLICY "Admins manage all links" ON public.identity_links FOR ALL USING (has_role(auth.uid(),'admin'));

-- ============================================================
-- 3. trust_profile — TC, tier, risk
-- ============================================================
CREATE TABLE IF NOT EXISTS public.trust_profile (
  user_id UUID PRIMARY KEY,
  did_id UUID REFERENCES public.did_registry(did_id) ON DELETE SET NULL,
  tc NUMERIC(5,4) NOT NULL DEFAULT 0.5000,
  tier trust_tier NOT NULL DEFAULT 'T0',
  vs NUMERIC(5,4) DEFAULT 0,
  bs NUMERIC(5,4) DEFAULT 0,
  ss NUMERIC(5,4) DEFAULT 0,
  os NUMERIC(5,4) DEFAULT 0,
  hs NUMERIC(5,4) DEFAULT 0,
  rf NUMERIC(5,4) DEFAULT 1.0,
  sybil_risk INTEGER NOT NULL DEFAULT 0 CHECK (sybil_risk BETWEEN 0 AND 100),
  fraud_risk INTEGER NOT NULL DEFAULT 0 CHECK (fraud_risk BETWEEN 0 AND 100),
  cleanliness NUMERIC(5,4) DEFAULT 1.0,
  permission_flags JSONB DEFAULT '{}'::jsonb,
  last_computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trust_profile_tier ON public.trust_profile(tier);
CREATE INDEX IF NOT EXISTS idx_trust_profile_tc ON public.trust_profile(tc DESC);
ALTER TABLE public.trust_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trust profile public read" ON public.trust_profile FOR SELECT USING (true);
CREATE POLICY "Admins manage trust" ON public.trust_profile FOR ALL USING (has_role(auth.uid(),'admin'));

-- ============================================================
-- 4. sbt_registry — Soulbound badges
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sbt_registry (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  did_id UUID NOT NULL REFERENCES public.did_registry(did_id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category sbt_category NOT NULL,
  sbt_type TEXT NOT NULL,
  issuer TEXT NOT NULL DEFAULT 'system',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status sbt_status NOT NULL DEFAULT 'active',
  evidence_hash TEXT,
  trust_weight NUMERIC(5,4) NOT NULL DEFAULT 0.0,
  privacy_level TEXT NOT NULL DEFAULT 'public',
  upgrade_path TEXT,
  revocation_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  on_chain_token_id TEXT,
  on_chain_tx_hash TEXT
);
CREATE INDEX IF NOT EXISTS idx_sbt_user ON public.sbt_registry(user_id);
CREATE INDEX IF NOT EXISTS idx_sbt_did ON public.sbt_registry(did_id);
CREATE INDEX IF NOT EXISTS idx_sbt_category ON public.sbt_registry(category);
CREATE INDEX IF NOT EXISTS idx_sbt_status ON public.sbt_registry(status);
ALTER TABLE public.sbt_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public SBTs readable" ON public.sbt_registry FOR SELECT
  USING (privacy_level = 'public' OR user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage SBTs" ON public.sbt_registry FOR ALL USING (has_role(auth.uid(),'admin'));

-- ============================================================
-- 5. sbt_issuance_rules — rules for auto/semi/governance
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sbt_issuance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category sbt_category NOT NULL,
  sbt_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  issue_mode sbt_issue_mode NOT NULL DEFAULT 'auto',
  trust_weight NUMERIC(5,4) NOT NULL DEFAULT 0.05,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sbt_issuance_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SBT rules public read" ON public.sbt_issuance_rules FOR SELECT USING (true);
CREATE POLICY "Admins manage SBT rules" ON public.sbt_issuance_rules FOR ALL USING (has_role(auth.uid(),'admin'));

-- ============================================================
-- 6. attestation_log — peer attestations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attestation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_did UUID NOT NULL REFERENCES public.did_registry(did_id) ON DELETE CASCADE,
  to_did UUID NOT NULL REFERENCES public.did_registry(did_id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  attestation_type TEXT NOT NULL,
  weight NUMERIC(5,4) NOT NULL DEFAULT 0.05,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_attest CHECK (from_did <> to_did)
);
CREATE INDEX IF NOT EXISTS idx_attest_to ON public.attestation_log(to_did);
CREATE INDEX IF NOT EXISTS idx_attest_from ON public.attestation_log(from_did);
ALTER TABLE public.attestation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attestations public read" ON public.attestation_log FOR SELECT USING (true);
CREATE POLICY "Users issue attestations" ON public.attestation_log FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users revoke own attestations" ON public.attestation_log FOR UPDATE
  USING (auth.uid() = from_user_id);

-- ============================================================
-- 7. identity_events — event sourcing for TC delta
-- ============================================================
CREATE TABLE IF NOT EXISTS public.identity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  did_id UUID REFERENCES public.did_registry(did_id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_ref TEXT,
  tc_delta NUMERIC(5,4) DEFAULT 0,
  risk_delta INTEGER DEFAULT 0,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_identity_events_user ON public.identity_events(user_id, created_at DESC);
ALTER TABLE public.identity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own events" ON public.identity_events FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage events" ON public.identity_events FOR ALL USING (has_role(auth.uid(),'admin'));

-- ============================================================
-- 8. identity_epoch_snapshot
-- ============================================================
CREATE TABLE IF NOT EXISTS public.identity_epoch_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  did_id UUID REFERENCES public.did_registry(did_id) ON DELETE SET NULL,
  epoch_id TEXT NOT NULL,
  did_level did_level NOT NULL,
  tc NUMERIC(5,4) NOT NULL,
  tier trust_tier NOT NULL,
  sybil_risk INTEGER NOT NULL DEFAULT 0,
  active_sbts JSONB DEFAULT '[]'::jsonb,
  governance_eligible BOOLEAN DEFAULT false,
  mint_eligible BOOLEAN DEFAULT false,
  state_root_hash TEXT,
  snapshotted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, epoch_id)
);
CREATE INDEX IF NOT EXISTS idx_identity_snapshot_epoch ON public.identity_epoch_snapshot(epoch_id);
ALTER TABLE public.identity_epoch_snapshot ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Snapshot public read" ON public.identity_epoch_snapshot FOR SELECT USING (true);
CREATE POLICY "Admins manage snapshots" ON public.identity_epoch_snapshot FOR ALL USING (has_role(auth.uid(),'admin'));

-- ============================================================
-- 9. recovery_log — 4-layer recovery events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.recovery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  did_id UUID REFERENCES public.did_registry(did_id) ON DELETE SET NULL,
  recovery_layer TEXT NOT NULL,
  initiated_by UUID,
  guardians UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'initiated',
  cooldown_until TIMESTAMPTZ,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_recovery_user ON public.recovery_log(user_id, created_at DESC);
ALTER TABLE public.recovery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own recovery" ON public.recovery_log FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage recovery" ON public.recovery_log FOR ALL USING (has_role(auth.uid(),'admin'));

-- ============================================================
-- Triggers: updated_at
-- ============================================================
CREATE TRIGGER trg_did_registry_updated BEFORE UPDATE ON public.did_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_trust_profile_updated BEFORE UPDATE ON public.trust_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Seed: SBT issuance rules
-- ============================================================
INSERT INTO public.sbt_issuance_rules (category, sbt_type, display_name, description, issue_mode, trust_weight, conditions) VALUES
  ('identity','verified_human','Verified Human','DID L1+ với email/phone verified','auto',0.10,'{"min_did_level":"L1"}'::jsonb),
  ('identity','verified_wallet','Verified Wallet','Đã link và xác minh ví on-chain','auto',0.08,'{"requires_wallet":true}'::jsonb),
  ('identity','pplp_member','PPLP Member','Đã chấp nhận Hiến chương PPLP','auto',0.12,'{"requires_pplp_accepted":true}'::jsonb),
  ('trust','clean_history_30d','Clean History 30d','Sạch hành vi 30 ngày','auto',0.06,'{"days_clean":30}'::jsonb),
  ('trust','clean_history_90d','Clean History 90d','Sạch hành vi 90 ngày','auto',0.10,'{"days_clean":90}'::jsonb),
  ('trust','anti_sybil_passed','Anti-Sybil Passed','Vượt qua kiểm tra sybil','auto',0.10,'{"max_sybil_risk":20}'::jsonb),
  ('contribution','builder','Builder','Đóng góp code/feature','semi_auto',0.15,'{"min_contributions":3}'::jsonb),
  ('contribution','community_guide','Community Guide','Hướng dẫn cộng đồng','semi_auto',0.12,'{}'::jsonb),
  ('contribution','validator','Validator','Validator được duyệt','governance',0.20,'{}'::jsonb),
  ('credential','certified_mentor','Certified Mentor','Mentor được chứng nhận','governance',0.18,'{}'::jsonb),
  ('milestone','consistency_100d','100-day Consistency','100 ngày streak','auto',0.10,'{"min_streak":100}'::jsonb),
  ('milestone','first_proposal','First Proposal Adopted','Proposal đầu tiên được chấp thuận','auto',0.08,'{}'::jsonb),
  ('legacy','foundational_builder','Foundational Builder','Builder nền móng','governance',0.30,'{}'::jsonb),
  ('legacy','system_guardian','System Guardian','Guardian của hệ thống','governance',0.30,'{}'::jsonb)
ON CONFLICT (sbt_type) DO NOTHING;