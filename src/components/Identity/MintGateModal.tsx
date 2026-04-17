/**
 * MintGateModal — shown when user tries to mint but trust permission denies.
 */
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Sparkles } from 'lucide-react';
import type { TrustTier } from '@/lib/identity/trust-tier';
import type { DIDLevel } from '@/lib/identity/did-registry';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
  tier: TrustTier;
  did_level: DIDLevel;
  tc: number;
}

export function MintGateModal({ open, onOpenChange, reason, tier, did_level, tc }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Chưa đủ điều kiện mint full
          </DialogTitle>
          <DialogDescription>
            {reason || 'Tài khoản chưa đạt ngưỡng tin cậy để mint đầy đủ.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between p-3 rounded-md bg-muted">
            <span className="text-muted-foreground">Trạng thái hiện tại</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">{did_level}</Badge>
              <Badge variant="outline" className="font-mono">{tier}</Badge>
              <span className="font-mono text-xs">TC {tc.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p><strong className="text-foreground">Yêu cầu:</strong> DID ≥ L2 · TC ≥ 0.80 · Sybil Risk &lt; 60</p>
            <p>Vẫn có thể mint sandbox (≤ 100 FUN/request) cho đến khi nâng tier.</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:flex-1">
            Đóng
          </Button>
          <Button asChild className="sm:flex-1 gap-2">
            <Link to="/identity">
              <Sparkles className="h-4 w-4" />
              Nâng cấp Trust
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
