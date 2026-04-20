import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, HeartOff, Network, Users } from 'lucide-react';
import { useTrustGraph } from '@/hooks/useTrustGraph';
import { vouchForUser, unvouchUser } from '@/lib/identity/trust-graph';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Props {
  userId: string;
}

export function TrustGraphPanel({ userId }: Props) {
  const { stats, vouched, loading, reload, isOwn } = useTrustGraph(userId);
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const handleVouch = async () => {
    setBusy(true);
    try {
      if (vouched) {
        await unvouchUser(userId);
        toast({ title: 'Đã rút vouch', description: 'Bạn không còn bảo chứng cho người này.' });
      } else {
        await vouchForUser(userId, 0.7, 'Bảo chứng từ trang hồ sơ');
        toast({ title: '🤝 Đã vouch', description: 'Bạn đã thêm họ vào Trust Graph của mình.' });
      }
      await reload();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e?.message || 'Không thực hiện được', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" />
          Trust Graph — Web of Trust
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-2xl font-bold text-primary">{stats?.incoming_count ?? 0}</div>
                <div className="text-xs text-muted-foreground">Người tin bạn</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-2xl font-bold">{stats?.outgoing_count ?? 0}</div>
                <div className="text-xs text-muted-foreground">Bạn đang vouch</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <div className="text-2xl font-bold">{((stats?.avg_incoming_weight ?? 0) * 100).toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">Sức nặng TB</div>
              </div>
            </div>

            {!isOwn && (
              <Button
                onClick={handleVouch}
                disabled={busy}
                variant={vouched ? 'outline' : 'default'}
                className="w-full"
              >
                {vouched ? <HeartOff className="h-4 w-4 mr-2" /> : <Heart className="h-4 w-4 mr-2" />}
                {vouched ? 'Đã vouch — bấm để rút' : 'Vouch người này'}
              </Button>
            )}

            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Users className="h-3 w-3" /> Top vouchers
              </div>
              {(!stats?.top_vouchers || stats.top_vouchers.length === 0) ? (
                <p className="text-xs text-muted-foreground italic">Chưa có ai vouch.</p>
              ) : (
                <div className="space-y-2">
                  {stats.top_vouchers.map((v) => (
                    <Link
                      key={v.user_id}
                      to={v.username ? `/${v.username}` : `/profile/${v.user_id}`}
                      className="flex items-center gap-2 rounded-md p-2 hover:bg-muted/50 transition"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={v.avatar_url || undefined} />
                        <AvatarFallback>{(v.display_name || v.username || '?').slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{v.display_name || v.username || 'Ẩn danh'}</div>
                        {v.reason && <div className="text-xs text-muted-foreground truncate">{v.reason}</div>}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {(v.weight * 100).toFixed(0)}%
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
