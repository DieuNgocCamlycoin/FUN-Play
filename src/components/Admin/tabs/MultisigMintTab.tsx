import { AttesterPanel } from '@/components/Multisig/AttesterPanel';
import { AdminMintPanel } from '@/components/Multisig/AdminMintPanel';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExternalLink, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MultisigMintTab() {
  return (
    <div className="space-y-8">
      {/* Quick link to /gov-sign */}
      <Card className="p-4 border-primary/30 bg-primary/5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">GOV Attester — Ký Multisig</p>
              <p className="text-xs text-muted-foreground">
                Mở trang ký multisig đầy đủ để xem tiến trình và ký xác nhận
              </p>
            </div>
          </div>
          <Link to="/gov-sign" target="_blank">
            <Button size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Mở trang GOV Sign
            </Button>
          </Link>
        </div>
      </Card>

      {/* Attester Signing Section */}
      <section>
        <AttesterPanel />
      </section>

      <Separator />

      {/* Admin Submit Section */}
      <section>
        <AdminMintPanel />
      </section>
    </div>
  );
}
