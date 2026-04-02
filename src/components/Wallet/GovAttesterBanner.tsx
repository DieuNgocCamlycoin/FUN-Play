import { useWalletContext } from "@/contexts/WalletContext";
import { useGovAttesters } from "@/hooks/useGovAttesters";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, Bell } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function GovAttesterBanner() {
  const { isConnected, address } = useWalletContext();
  const { attesters, loading } = useGovAttesters();
  const [pendingCount, setPendingCount] = useState(0);

  const isAttester = isConnected && address && attesters.some(
    (a) => a.wallet_address.toLowerCase() === address.toLowerCase() && a.is_active
  );

  const attesterInfo = isAttester
    ? attesters.find((a) => a.wallet_address.toLowerCase() === address!.toLowerCase())
    : null;

  const fetchPending = useCallback(async () => {
    const { count } = await supabase
      .from("pplp_mint_requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending_sig", "signing"]);
    setPendingCount(count ?? 0);
  }, []);

  useEffect(() => {
    if (!isAttester) return;
    fetchPending();
    const channel = supabase
      .channel("gov-banner-pending")
      .on("postgres_changes", { event: "*", schema: "public", table: "pplp_mint_requests" }, () => {
        fetchPending();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAttester, fetchPending]);

  if (loading || !isAttester) return null;

  const groupEmoji: Record<string, string> = { will: "💪", wisdom: "🌟", love: "❤️" };

  return (
    <Card className="p-4 border-primary/30 bg-primary/5 mb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary truncate">
              {groupEmoji[attesterInfo?.gov_group || ""] || "🔑"} GOV Attester — {attesterInfo?.name}
            </p>
            <p className="text-xs text-muted-foreground">
              Nhóm {attesterInfo?.gov_group?.toUpperCase()} • Bạn có quyền ký multisig
            </p>
          </div>
        </div>
        <Link to="/gov-sign" className="flex-shrink-0">
          <Button size="sm" className="gap-2 relative">
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
                {pendingCount}
              </span>
            )}
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Ký Multisig</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
