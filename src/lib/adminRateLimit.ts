import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Check admin rate limit before performing a refresh action.
 * Returns true if allowed, false if rate limited.
 */
export async function checkAdminRateLimit(
  adminId: string,
  action: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("check_admin_rate_limit" as any, {
      p_admin_id: adminId,
      p_action: action,
      p_max_requests: 10,
    });

    if (error) {
      console.error("Rate limit check error:", error);
      return true; // Allow on error to not block admin
    }

    const result = data as { allowed: boolean; retry_after?: number; reason?: string };
    
    if (!result.allowed) {
      toast.error(`Vui lòng chờ ${result.retry_after || 60} giây trước khi refresh lại`, {
        description: "Giới hạn 10 lần refresh/phút để bảo vệ database",
      });
      return false;
    }

    return true;
  } catch {
    return true; // Allow on error
  }
}
