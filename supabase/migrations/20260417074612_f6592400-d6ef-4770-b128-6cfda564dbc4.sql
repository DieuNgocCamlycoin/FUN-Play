-- ============================================================
-- Phase 4C-1: Auto-bootstrap DID + Trust Profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_did_id uuid;
BEGIN
  -- Create DID L0 (idempotent)
  INSERT INTO public.did_registry (user_id, entity_type, level, status, metadata)
  VALUES (NEW.id, 'human', 'L0', 'pending', jsonb_build_object('source', 'signup_trigger'))
  ON CONFLICT (user_id) DO NOTHING
  RETURNING did_id INTO v_did_id;

  -- If insert was skipped (already exists), fetch existing did_id
  IF v_did_id IS NULL THEN
    SELECT did_id INTO v_did_id FROM public.did_registry WHERE user_id = NEW.id;
  END IF;

  -- Create trust_profile (idempotent)
  INSERT INTO public.trust_profile (user_id, did_id, tc, tier)
  VALUES (NEW.id, v_did_id, 0.5000, 'T0')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block signup on identity bootstrap failure
  RAISE WARNING 'handle_new_user_identity failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_identity ON auth.users;
CREATE TRIGGER on_auth_user_created_identity
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_identity();

-- ============================================================
-- Phase 4C-2: Backfill DID + trust_profile for existing users
-- ============================================================

INSERT INTO public.did_registry (user_id, entity_type, level, status, metadata)
SELECT u.id, 'human'::did_entity_type, 'L0'::did_level, 'pending'::did_status,
       jsonb_build_object('source', 'backfill_4c')
FROM auth.users u
LEFT JOIN public.did_registry d ON d.user_id = u.id
WHERE d.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.trust_profile (user_id, did_id, tc, tier)
SELECT d.user_id, d.did_id, 0.5000, 'T0'::trust_tier
FROM public.did_registry d
LEFT JOIN public.trust_profile t ON t.user_id = d.user_id
WHERE t.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- Phase 4C-3: Seed 6 SBT issuance rules
-- ============================================================

INSERT INTO public.sbt_issuance_rules (category, sbt_type, display_name, description, issue_mode, trust_weight, conditions, is_active)
VALUES
  ('identity', 'identity_verified', 'Định Danh Xác Thực',
   'Người dùng đã hoàn tất xác thực ví + email + signup ≥ 7 ngày.',
   'auto', 0.10,
   '{"min_did_level": "L1", "min_account_age_days": 7, "wallet_required": true}'::jsonb, true),

  ('trust', 'trust_verified', 'Tin Cậy Xác Thực',
   'Đạt Trust Tier T2+ (TC ≥ 0.80) trong ít nhất 1 epoch.',
   'auto', 0.15,
   '{"min_tier": "T2", "min_tc": 0.80, "min_epochs": 1}'::jsonb, true),

  ('contribution', 'active_contributor', 'Người Đóng Góp Tích Cực',
   'Có ≥ 30 PPLP events validated trong 30 ngày gần nhất.',
   'auto', 0.10,
   '{"min_validated_events": 30, "window_days": 30}'::jsonb, true),

  ('credential', 'pplp_charter_holder', 'Người Giữ Hiến Chương PPLP',
   'Đã chấp nhận PPLP Charter (5 nguyên tắc).',
   'auto', 0.05,
   '{"requires_charter_acceptance": true}'::jsonb, true),

  ('milestone', 'first_mint', 'Lần Mint Đầu Tiên',
   'Hoàn tất mint FUN lần đầu thành công on-chain.',
   'auto', 0.05,
   '{"min_successful_mints": 1}'::jsonb, true),

  ('legacy', 'founder_legacy', 'Di Sản Người Sáng Lập',
   'Trao tay bởi quản trị — dành cho thành viên sáng lập / cố vấn.',
   'governance', 0.25,
   '{"governance_only": true}'::jsonb, true)
ON CONFLICT (sbt_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  trust_weight = EXCLUDED.trust_weight,
  conditions = EXCLUDED.conditions,
  is_active = EXCLUDED.is_active;