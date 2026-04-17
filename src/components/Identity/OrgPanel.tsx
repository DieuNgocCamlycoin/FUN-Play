import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Plus, ShieldCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';
import type { DIDLevel } from '@/lib/identity/did-registry';

interface OrgRow {
  id: string;
  org_did_id: string;
  role: string;
  joined_at: string;
}

export function OrgPanel({ didLevel }: { didLevel?: DIDLevel | null } = {}) {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const canCreate = didLevel === 'L2' || didLevel === 'L3' || didLevel === 'L4';

  const reload = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase.from('org_members')
      .select('id, org_did_id, role, joined_at')
      .eq('user_id', user.id).eq('is_active', true);
    setOrgs((data ?? []) as OrgRow[]);
    setLoading(false);
  };

  useEffect(() => { reload(); }, [user?.id]);

  const handleCreate = async () => {
    if (!canCreate) {
      toast.error('Cần DID L2+ để tạo organization');
      return;
    }
    if (!name.trim()) {
      toast.error('Tên tổ chức bắt buộc');
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke('org-identity-engine', {
      body: { action: 'create_org', name, description },
    });
    setCreating(false);
    if (error || !data?.success) {
      toast.error(error?.message || data?.error || 'Tạo org thất bại');
      return;
    }
    toast.success('Đã tạo organization');
    setShowForm(false);
    setName(''); setDescription('');
    reload();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Building2 className="w-5 h-5" /> Tổ chức của tôi
        </CardTitle>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => canCreate && setShowForm(v => !v)}
                  disabled={!canCreate}
                  aria-disabled={!canCreate}
                >
                  {canCreate ? <Plus className="w-4 h-4 mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
                  Tạo Org
                </Button>
              </span>
            </TooltipTrigger>
            {!canCreate && (
              <TooltipContent>
                Cần DID L2+ để tạo organization (hiện tại: {didLevel ?? 'L0'}).
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && canCreate && (
          <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/30">
            <div>
              <Label htmlFor="org-name">Tên tổ chức</Label>
              <Input id="org-name" value={name} onChange={e => setName(e.target.value)}
                placeholder="Love House Saigon" />
            </div>
            <div>
              <Label htmlFor="org-desc">Mô tả</Label>
              <Textarea id="org-desc" value={description}
                onChange={e => setDescription(e.target.value)} rows={2} />
            </div>
            <Button size="sm" onClick={handleCreate} disabled={creating}>
              {creating ? 'Đang tạo...' : 'Tạo'}
            </Button>
            <p className="text-xs text-muted-foreground">Yêu cầu DID L2+ để tạo organization.</p>
          </div>
        )}

        {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
        {!loading && orgs.length === 0 && (
          <p className="text-sm text-muted-foreground">Chưa thuộc tổ chức nào.</p>
        )}
        {orgs.map(o => (
          <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <code className="text-xs truncate">{o.org_did_id.slice(0, 8)}...</code>
            </div>
            <Badge variant="outline" className="shrink-0">{o.role}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
