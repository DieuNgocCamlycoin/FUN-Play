import { AttesterPanel } from '@/components/Multisig/AttesterPanel';
import { AdminMintPanel } from '@/components/Multisig/AdminMintPanel';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExternalLink, Shield, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function MultisigMintTab() {
  const { toast } = useToast();
  const [notifying, setNotifying] = useState(false);

  const handleNotifyIdleUsers = async () => {
    setNotifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('notify-idle-pplp-users');
      if (error) throw error;
      toast({
        title: '✅ Gửi nhắc nhở thành công',
        description: `Đã gửi ${data?.sent || 0} thông báo cho user chưa mint.`,
      });
    } catch (err: any) {
      toast({
        title: 'Lỗi gửi nhắc nhở',
        description: err.message?.slice(0, 200),
        variant: 'destructive',
      });
    } finally {
      setNotifying(false);
    }
  };

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

      {/* Notify idle PPLP users */}
      <Card className="p-4 border-amber-500/30 bg-amber-500/5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-semibold text-sm">Nhắc nhở user chưa mint</p>
              <p className="text-xs text-muted-foreground">
                Gửi notification cho user đã ký PPLP Charter nhưng chưa tạo mint request
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleNotifyIdleUsers}
            disabled={notifying}
            className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50"
          >
            <Bell className="h-4 w-4" />
            {notifying ? 'Đang gửi...' : 'Gửi nhắc nhở'}
          </Button>
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
