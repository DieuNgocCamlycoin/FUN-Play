-- ============ ZK COMMITMENTS ============
CREATE TABLE public.zk_commitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  did_id UUID REFERENCES public.did_registry(did_id) ON DELETE CASCADE,
  commitment_type TEXT NOT NULL CHECK (commitment_type IN ('tier', 'did_level', 'sbt_ownership', 'tc_range', 'custom')),
  commitment_hash TEXT NOT NULL,
  salt_hash TEXT NOT NULL,
  merkle_root_id UUID,
  merkle_leaf_index INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_zk_commitments_user ON public.zk_commitments(user_id);
CREATE INDEX idx_zk_commitments_type ON public.zk_commitments(commitment_type) WHERE is_active = true;
CREATE INDEX idx_zk_commitments_root ON public.zk_commitments(merkle_root_id);

ALTER TABLE public.zk_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own commitments" ON public.zk_commitments
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages commitments" ON public.zk_commitments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ MERKLE ROOTS ============
CREATE TABLE public.zk_merkle_roots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commitment_type TEXT NOT NULL,
  epoch_id TEXT,
  root_hash TEXT NOT NULL,
  leaf_count INTEGER NOT NULL DEFAULT 0,
  tree_depth INTEGER NOT NULL DEFAULT 20,
  algorithm TEXT NOT NULL DEFAULT 'sha256',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  anchor_tx_hash TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_merkle_roots_type_epoch ON public.zk_merkle_roots(commitment_type, epoch_id);
CREATE INDEX idx_merkle_roots_active ON public.zk_merkle_roots(commitment_type) WHERE is_active = true;

ALTER TABLE public.zk_merkle_roots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merkle roots are public" ON public.zk_merkle_roots
  FOR SELECT USING (true);

CREATE POLICY "Admins manage merkle roots" ON public.zk_merkle_roots
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.zk_commitments
  ADD CONSTRAINT zk_commitments_merkle_root_fk
  FOREIGN KEY (merkle_root_id) REFERENCES public.zk_merkle_roots(id) ON DELETE SET NULL;

-- ============ ORG MEMBERS ============
CREATE TABLE public.org_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_did_id UUID NOT NULL REFERENCES public.did_registry(did_id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'sbt_issuer', 'member')),
  invited_by UUID,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE (org_did_id, user_id)
);

CREATE INDEX idx_org_members_org ON public.org_members(org_did_id) WHERE is_active = true;
CREATE INDEX idx_org_members_user ON public.org_members(user_id) WHERE is_active = true;

ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own org memberships" ON public.org_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Org members visible to fellow members" ON public.org_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.org_members m2
      WHERE m2.org_did_id = org_members.org_did_id
        AND m2.user_id = auth.uid()
        AND m2.is_active = true
    )
  );

CREATE POLICY "Org owners manage members" ON public.org_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.org_members m2
      WHERE m2.org_did_id = org_members.org_did_id
        AND m2.user_id = auth.uid()
        AND m2.role IN ('owner', 'admin')
        AND m2.is_active = true
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- ============ AI OPERATORS ============
CREATE TABLE public.ai_operators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_did_id UUID NOT NULL REFERENCES public.did_registry(did_id) ON DELETE CASCADE,
  operator_user_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  agent_purpose TEXT,
  responsibility_level TEXT NOT NULL DEFAULT 'standard' CHECK (responsibility_level IN ('standard', 'elevated', 'critical')),
  attestation_weight_cap NUMERIC NOT NULL DEFAULT 0.05,
  is_active BOOLEAN NOT NULL DEFAULT true,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE (agent_did_id)
);

CREATE INDEX idx_ai_operators_operator ON public.ai_operators(operator_user_id) WHERE is_active = true;
CREATE INDEX idx_ai_operators_agent ON public.ai_operators(agent_did_id);

ALTER TABLE public.ai_operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators view own agents" ON public.ai_operators
  FOR SELECT USING (auth.uid() = operator_user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "AI operators publicly readable" ON public.ai_operators
  FOR SELECT USING (true);

CREATE POLICY "Operators manage own agents" ON public.ai_operators
  FOR ALL USING (auth.uid() = operator_user_id OR public.has_role(auth.uid(), 'admin'));

-- ============ EXTEND did_registry ============
ALTER TABLE public.did_registry
  ADD COLUMN IF NOT EXISTS verified_org_badge BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID,
  ADD COLUMN IF NOT EXISTS operator_user_id UUID;

CREATE INDEX IF NOT EXISTS idx_did_registry_entity_type ON public.did_registry(entity_type);
CREATE INDEX IF NOT EXISTS idx_did_registry_org_verified ON public.did_registry(verified_org_badge) WHERE verified_org_badge = true;

-- ============ EXTEND attestation_log ============
ALTER TABLE public.attestation_log
  ADD COLUMN IF NOT EXISTS ai_origin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS agent_did_id UUID REFERENCES public.did_registry(did_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_attestation_log_ai ON public.attestation_log(ai_origin) WHERE ai_origin = true;

-- Trigger: cap weight at 0.05 if ai_origin
CREATE OR REPLACE FUNCTION public.cap_ai_attestation_weight()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.ai_origin = true AND NEW.weight > 0.05 THEN
    NEW.weight := 0.05;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cap_ai_attestation_weight ON public.attestation_log;
CREATE TRIGGER trg_cap_ai_attestation_weight
  BEFORE INSERT OR UPDATE ON public.attestation_log
  FOR EACH ROW EXECUTE FUNCTION public.cap_ai_attestation_weight();

-- ============ EXTEND identity_events ============
ALTER TABLE public.identity_events
  ADD COLUMN IF NOT EXISTS ai_origin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS agent_did_id UUID REFERENCES public.did_registry(did_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_identity_events_ai ON public.identity_events(ai_origin) WHERE ai_origin = true;