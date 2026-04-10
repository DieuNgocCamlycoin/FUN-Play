import { useWalletContext } from '@/contexts/WalletContext';
import { useAuth } from '@/hooks/useAuth';
import { AttesterPanel } from '@/components/Multisig/AttesterPanel';
import { MintProgressTracker } from '@/components/Multisig/MintProgressTracker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowLeft, Bell, Shield, LayoutDashboard, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

function usePendingCount() {
  const [count, setCount] = useState(0);

  const fetch = useCallback(async () => {
    const { count: c } = await supabase
      .from('pplp_mint_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending_sig', 'signing']);
    setCount(c ?? 0);
  }, []);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('gov-sign-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pplp_mint_requests' }, () => {
        fetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  return count;
}

function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    const check = async () => {
      const [{ data: adminData }, { data: ownerData }] = await Promise.all([
        supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
        supabase.rpc('is_owner', { _user_id: user.id }),
      ]);
      setIsAdmin(adminData === true || ownerData === true);
    };
    check();
  }, [user]);

  return isAdmin;
}

export default function GovSignPage() {
  const { isConnected } = useWalletContext();
  const { user } = useAuth();
  const pendingCount = usePendingCount();
  const isLoggedIn = !!user;
  const isAdmin = useIsAdmin();
  
  console.log('[GovSignPage] isConnected:', isConnected, 'isLoggedIn:', isLoggedIn, 'isAdmin:', isAdmin);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">GOV Attester — Ký Multisig</h1>
              {pendingCount > 0 && (
                <Badge variant="destructive" className="animate-pulse flex items-center gap-1 text-xs">
                  <Bell className="w-3 h-3" />
                  {pendingCount} chờ ký
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Kết nối ví GOV để xem và ký các yêu cầu mint FUN Money
            </p>
          </div>
        </div>

        {/* Admin Toolbar - chỉ hiển thị cho admin */}
        {isAdmin && (
          <Card className="p-3 border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">🛡️ Admin Tools</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link to="/admin?tab=multisig-mint">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Multisig Dashboard
                  </Button>
                </Link>
                <Link to="/admin?tab=fun-money">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Quản lý FUN Money
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Realtime banner */}
        {pendingCount > 0 && (
          <Card className="p-3 border-destructive/50 bg-destructive/5 flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
            </span>
            <p className="text-sm font-medium">
              Có <strong>{pendingCount}</strong> yêu cầu mint đang chờ chữ ký từ các nhóm GOV
            </p>
          </Card>
        )}

        {/* Guide */}
        <Card className="p-4 bg-muted/50 border-dashed">
          <h3 className="font-semibold text-sm mb-2">📋 Hướng dẫn nhanh</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Kết nối ví đã được đăng ký trong danh sách GOV Attester</li>
            <li>Xem danh sách yêu cầu mint đang chờ ký</li>
            <li>Nhấn <strong>"Ký xác nhận"</strong> để ký bằng EIP-712</li>
            <li>Cần đủ 3/3 nhóm (WILL + WISDOM + LOVE) mới submit on-chain</li>
          </ol>
        </Card>

        {!isConnected && !isLoggedIn ? (
          <Card className="p-8 text-center space-y-3">
            <Wallet className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="font-semibold text-lg">Chưa kết nối ví</h3>
            <p className="text-muted-foreground text-sm">
              Vui lòng kết nối ví MetaMask hoặc WalletConnect để tiếp tục.
            </p>
            <w3m-button />
          </Card>
        ) : (
          <>
            {!isConnected && isLoggedIn && (
              <Card className="p-3 border-amber-500/50 bg-amber-500/5 text-sm text-amber-600">
                ⚠️ Ví chưa kết nối trực tiếp — đang dùng ví từ hồ sơ. Kết nối ví để ký xác nhận.
              </Card>
            )}
            <AttesterPanel />
          </>
        )}

        {/* Bảng thống kê toàn bộ tiến trình - luôn hiển thị cho tất cả Attester */}
        <div className="border-t pt-6 mt-6">
          <MintProgressTracker />
        </div>
      </div>
    </div>
  );
}
