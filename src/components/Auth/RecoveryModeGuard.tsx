import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function RecoveryModeGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Kiểm tra URL hash ngay lập tức
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const recoveryType = hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    
    // Nếu đây là link recovery VÀ không ở /auth → redirect về /auth
    if (recoveryType === 'recovery' && accessToken && location.pathname !== '/auth') {
      console.log("[RecoveryGuard] Recovery link detected, redirecting to /auth");
      // Giữ hash để Auth.tsx xử lý
      navigate(`/auth${window.location.hash}`, { replace: true });
      return;
    }

    // Lắng nghe PASSWORD_RECOVERY event từ Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && location.pathname !== '/auth') {
        console.log("[RecoveryGuard] PASSWORD_RECOVERY event, redirecting to /auth");
        navigate('/auth', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return <>{children}</>;
}
