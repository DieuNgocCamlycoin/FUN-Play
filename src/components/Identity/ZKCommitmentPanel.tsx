import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface CommitRow {
  id: string;
  commitment_type: string;
  commitment_hash: string;
  is_active: boolean;
  created_at: string;
}

const TYPES = ['tier', 'did_level', 'sbt_ownership', 'tc_range', 'custom'] as const;

export function ZKCommitmentPanel() {
  const { user } = useAuth();
  const [items, setItems] = useState<CommitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<typeof TYPES[number]>('tier');
  const [value, setValue] = useState('');
  const [creating, setCreating] = useState(false);
  const [lastSalt, setLastSalt] = useState<string | null>(null);

  const reload = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase.from('zk_commitments')
      .select('id, commitment_type, commitment_hash, is_active, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    setItems((data ?? []) as CommitRow[]);
    setLoading(false);
  };

  useEffect(() => { reload(); }, [user?.id]);

  const handleCommit = async () => {
    if (!value.trim()) {
      toast.error('Nhập value để commit');
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke('zk-proof-engine', {
      body: { action: 'commit', commitment_type: type, value },
    });
    setCreating(false);
    if (error || !data?.success) {
      toast.error(error?.message || data?.error || 'Commit thất bại');
      return;
    }
    setLastSalt(data.raw_salt);
    toast.success('Đã tạo commitment — lưu salt cẩn thận!');
    setValue('');
    reload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" /> ZK Commitments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/30">
          <div>
            <Label>Loại</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Value (sẽ được hash với salt ngẫu nhiên)</Label>
            <Input value={value} onChange={e => setValue(e.target.value)}
              placeholder="vd: T2 hoặc tc_range:1.0-1.2" />
          </div>
          <Button size="sm" onClick={handleCommit} disabled={creating}>
            <Sparkles className="w-4 h-4 mr-1" />
            {creating ? 'Đang tạo...' : 'Tạo commitment'}
          </Button>
        </div>

        {lastSalt && (
          <div className="p-3 rounded-lg border border-warning/40 bg-warning/5">
            <p className="text-xs font-semibold text-warning mb-1">
              ⚠️ Lưu salt này — không thể khôi phục:
            </p>
            <code className="text-[10px] break-all">{lastSalt}</code>
          </div>
        )}

        <div className="space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
          {!loading && items.length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có commitment nào.</p>
          )}
          {items.map(c => (
            <div key={c.id} className="flex items-center justify-between p-2 rounded border border-border text-xs">
              <div>
                <Badge variant="outline" className="mr-2">{c.commitment_type}</Badge>
                <code className="text-[10px]">{c.commitment_hash.slice(0, 16)}...</code>
              </div>
              <Badge variant={c.is_active ? 'default' : 'secondary'}>
                {c.is_active ? 'active' : 'inactive'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
