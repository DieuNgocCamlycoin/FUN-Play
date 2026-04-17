/**
 * DIBVaultPanel — visualize 7 reputation vaults.
 * Calls computeDIB() client-side using public RLS-readable tables.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Wallet, Database } from 'lucide-react';
import { computeDIB, DIB_VAULT_LABELS, type DIBSnapshot } from '@/lib/identity/dib-vault';

interface Props {
  userId: string;
}

export function DIBVaultPanel({ userId }: Props) {
  const [snap, setSnap] = useState<DIBSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    computeDIB(userId)
      .then((s) => { if (!cancelled) setSnap(s); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4 text-primary" />
          DIB — Distributed Identity Bank
          {snap && (
            <Badge variant="secondary" className="ml-auto">
              {(snap.total * 100).toFixed(1)}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <div className="text-sm text-muted-foreground">Đang tính 7 vault…</div>}
        {!loading && snap && (
          <>
            <p className="text-xs text-muted-foreground">
              Tổng hợp uy tín từ 7 vault. Trọng số đã chuẩn hóa, cộng vào RF của Trust Engine.
            </p>
            <div className="space-y-2">
              {snap.vaults.map((v) => (
                <div key={v.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <Wallet className="h-3 w-3 text-muted-foreground" />
                      {DIB_VAULT_LABELS[v.key]}
                      <span className="text-muted-foreground">·{(v.weight * 100).toFixed(0)}%</span>
                    </span>
                    <span className="font-mono">{(v.score * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={v.score * 100} className="h-1.5" />
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
