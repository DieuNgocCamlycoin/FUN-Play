-- Thêm các cột mới vào bảng reward_transactions để theo dõi trạng thái duyệt
ALTER TABLE public.reward_transactions 
ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by uuid;

-- Cập nhật function approve_user_reward để đánh dấu tất cả reward_transactions là approved
CREATE OR REPLACE FUNCTION public.approve_user_reward(p_user_id uuid, p_admin_id uuid, p_note text DEFAULT NULL::text)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pending_amount numeric;
BEGIN
  IF NOT public.has_role(p_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve rewards';
  END IF;

  SELECT pending_rewards INTO v_pending_amount FROM profiles WHERE id = p_user_id;
  
  IF v_pending_amount IS NULL OR v_pending_amount <= 0 THEN
    RAISE EXCEPTION 'No pending reward to approve';
  END IF;
  
  -- Reset pending và cộng vào approved
  UPDATE profiles SET 
    pending_rewards = 0,
    approved_reward = COALESCE(approved_reward, 0) + v_pending_amount
  WHERE id = p_user_id;
  
  -- ĐÁNH DẤU TẤT CẢ REWARD TRANSACTIONS CHƯA DUYỆT LÀ ĐÃ DUYỆT
  UPDATE reward_transactions SET 
    approved = true,
    approved_at = now(),
    approved_by = p_admin_id
  WHERE user_id = p_user_id 
    AND approved = false 
    AND claimed = false;
  
  -- Log vào bảng approvals
  INSERT INTO reward_approvals (user_id, amount, status, admin_id, admin_note, reviewed_at)
  VALUES (p_user_id, v_pending_amount, 'approved', p_admin_id, p_note, now());
  
  RETURN v_pending_amount;
END;
$function$;