import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { loadOverrides, clearOverrideCache, type ParameterOverride } from '@/lib/fun-money/parameter-overrides';
import { EVENT_BASE_VALUES, QUALITY_LEVELS, TRUST_LEVELS } from '@/lib/fun-money/light-score-params-v1';
import { Pencil, Trash2, Plus, History } from 'lucide-react';

const PARAM_TYPES = [
  { value: 'event_base', label: 'Event Base Value' },
  { value: 'quality', label: 'Quality' },
  { value: 'trust', label: 'Trust' },
  { value: 'iis', label: 'IIS' },
  { value: 'impact', label: 'Impact' },
  { value: 'aaf', label: 'AAF' },
  { value: 'erp', label: 'Ego Risk' },
  { value: 'consistency', label: 'Consistency' },
  { value: 'reliability', label: 'Reliability' },
  { value: 'phase_weights', label: 'Phase Weights' },
  { value: 'activation_threshold', label: 'Activation Threshold' },
];

interface ChangeLog {
  id: string;
  param_type: string;
  param_key: string;
  action: string;
  old_value: any;
  new_value: any;
  reason: string | null;
  changed_by: string;
  changed_at: string;
}

export const ParameterTuningEditor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [overrides, setOverrides] = useState<ParameterOverride[]>([]);
  const [logs, setLogs] = useState<ChangeLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Partial<ParameterOverride> | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [ovs, logRes] = await Promise.all([
      loadOverrides(true),
      supabase.from('parameter_change_log').select('*').order('changed_at', { ascending: false }).limit(50),
    ]);
    setOverrides(ovs);
    setLogs((logRes.data ?? []) as ChangeLog[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const save = async () => {
    if (!editing || !user) return;
    if (!editing.param_type || !editing.param_key) {
      toast({ title: 'Thiếu thông tin', description: 'Cần param_type + param_key', variant: 'destructive' });
      return;
    }
    const payload = {
      param_type: editing.param_type,
      param_key: editing.param_key,
      override_min: editing.override_min ?? null,
      override_max: editing.override_max ?? null,
      override_default: editing.override_default ?? null,
      reason: editing.reason ?? null,
      is_active: true,
      created_by: user.id,
    };
    const res = editing.id
      ? await supabase.from('parameter_overrides').update(payload).eq('id', editing.id)
      : await supabase.from('parameter_overrides').insert(payload);
    if (res.error) {
      toast({ title: 'Lỗi', description: res.error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '✅ Đã lưu', description: `${editing.param_type}.${editing.param_key}` });
    clearOverrideCache();
    setEditing(null);
    fetchData();
  };

  const remove = async (id: string) => {
    if (!confirm('Xoá override này?')) return;
    const { error } = await supabase.from('parameter_overrides').delete().eq('id', id);
    if (error) { toast({ title: 'Lỗi', description: error.message, variant: 'destructive' }); return; }
    clearOverrideCache();
    fetchData();
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">⚙️ Parameter Tuning Editor</CardTitle>
          <p className="text-xs text-muted-foreground">Owner/Admin chỉnh tham số scoring realtime — cache 60s</p>
        </div>
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditing({})}><Plus className="h-3 w-3 mr-1" /> Thêm Override</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing?.id ? 'Sửa' : 'Tạo'} Override</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Param Type</Label>
                <Select value={editing?.param_type ?? ''} onValueChange={(v) => setEditing({ ...editing, param_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                  <SelectContent>{PARAM_TYPES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Param Key (vd: daily_checkin, low, unknown, early...)</Label>
                <Input value={editing?.param_key ?? ''} onChange={(e) => setEditing({ ...editing, param_key: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Min</Label><Input type="number" step="0.01" value={editing?.override_min ?? ''} onChange={(e) => setEditing({ ...editing, override_min: e.target.value === '' ? null : Number(e.target.value) })} /></div>
                <div><Label>Max</Label><Input type="number" step="0.01" value={editing?.override_max ?? ''} onChange={(e) => setEditing({ ...editing, override_max: e.target.value === '' ? null : Number(e.target.value) })} /></div>
                <div><Label>Default</Label><Input type="number" step="0.01" value={editing?.override_default ?? ''} onChange={(e) => setEditing({ ...editing, override_default: e.target.value === '' ? null : Number(e.target.value) })} /></div>
              </div>
              <div>
                <Label>Lý do (bắt buộc cho audit)</Label>
                <Textarea value={editing?.reason ?? ''} onChange={(e) => setEditing({ ...editing, reason: e.target.value })} placeholder="VD: Giảm reward daily_checkin do nghi farm hàng loạt..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Huỷ</Button>
              <Button onClick={save}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="active">
          <TabsList className="grid grid-cols-2 h-8">
            <TabsTrigger value="active" className="text-xs">Active Overrides ({overrides.length})</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs"><History className="h-3 w-3 mr-1" /> Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <ScrollArea className="h-[280px]">
              {loading ? <p className="text-xs text-muted-foreground p-4">Loading...</p> :
                overrides.length === 0 ? <p className="text-xs text-muted-foreground p-4">Chưa có override nào — đang dùng spec defaults.</p> :
                overrides.map(o => (
                  <div key={o.id} className="flex items-center justify-between border-b border-border/30 py-2 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px]">{o.param_type}</Badge>
                        <span className="text-xs font-mono">{o.param_key}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        {o.override_min !== null && `min=${o.override_min} `}
                        {o.override_max !== null && `max=${o.override_max} `}
                        {o.override_default !== null && `default=${o.override_default}`}
                      </div>
                      {o.reason && <p className="text-[10px] text-muted-foreground italic mt-0.5 truncate">{o.reason}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(o)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => remove(o.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))
              }
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs">
            <ScrollArea className="h-[280px]">
              {logs.map(l => (
                <div key={l.id} className="border-b border-border/30 py-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={l.action === 'delete' ? 'destructive' : l.action === 'create' ? 'default' : 'secondary'} className="text-[9px]">{l.action}</Badge>
                    <span className="text-xs font-mono">{l.param_type}.{l.param_key}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{new Date(l.changed_at).toLocaleString('vi-VN')}</span>
                  </div>
                  {l.reason && <p className="text-[10px] text-muted-foreground italic mt-0.5">{l.reason}</p>}
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    {l.old_value && <span className="text-destructive">– {JSON.stringify(l.old_value)}</span>}
                    {l.new_value && <span className="text-emerald-600 ml-2">+ {JSON.stringify(l.new_value)}</span>}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
