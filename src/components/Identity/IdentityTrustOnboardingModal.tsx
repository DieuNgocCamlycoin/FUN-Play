/**
 * IdentityTrustOnboardingModal — popup giới thiệu Identity & Trust lần đầu user vào trang chủ.
 * Lưu dismissed vào localStorage. Tự ẩn khi user đã có ≥2 guardian.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, Lock, Vote, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTrustCompletion } from '@/hooks/useTrustCompletion';

const STORAGE_KEY = 'identity_trust_onboarding_dismissed_v2';

export function IdentityTrustOnboardingModal() {
  const { user } = useAuth();
  const { loading, isComplete } = useTrustCompletion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || loading || isComplete) return;
    const dismissed = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
    console.log('[IdentityTrust] modal check', { userId: user.id, isComplete, dismissed });
    if (!dismissed) {
      const t = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(t);
    }
  }, [user, loading, isComplete]);

  const handleDismiss = () => {
    if (user) localStorage.setItem(`${STORAGE_KEY}_${user.id}`, new Date().toISOString());
    setOpen(false);
  };

  if (!user || isComplete) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-amber-500/40">
        <div className="relative bg-gradient-to-br from-amber-500/20 via-primary/10 to-accent/15 p-6">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground rounded-full p-1 hover:bg-background/50"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-amber-500/30 blur-xl animate-pulse" />
              <div className="relative rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-4 shadow-xl">
                <ShieldCheck className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold mb-2">
              <Sparkles className="h-3 w-3" /> TÍNH NĂNG MỚI
            </div>
            <h2 className="text-xl font-bold mb-2">
              Định danh số & Trust Layer
            </h2>
            <p className="text-sm text-muted-foreground">
              Xác minh danh tính phi tập trung (DID) để mở khoá toàn bộ quyền lợi trong hệ FUN.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/15 p-2 shrink-0">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Mở khoá full mint FUN</p>
              <p className="text-xs text-muted-foreground">Tránh sandbox cap, nhận đủ thưởng PPLP</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/15 p-2 shrink-0">
              <Vote className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Quyền vote governance</p>
              <p className="text-xs text-muted-foreground">Tham gia quyết định hướng đi hệ sinh thái</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/15 p-2 shrink-0">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Recovery an toàn</p>
              <p className="text-xs text-muted-foreground">Khôi phục tài khoản qua guardian khi mất quyền truy cập</p>
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <Button variant="outline" onClick={handleDismiss} className="flex-1">
              Để sau
            </Button>
            <Button asChild className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              <Link to="/identity" onClick={handleDismiss}>
                Hoàn tất ngay
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
