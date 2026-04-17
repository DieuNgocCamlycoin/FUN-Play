import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Bot, Plus, X, Lock } from 'lucide-react';
import { toast } from 'sonner';
import type { DIDLevel } from '@/lib/identity/did-registry';

interface AgentRow {
  id: string;
  agent_did_id: string;
  agent_name: string;
  responsibility_level: string;
  attestation_weight_cap: number;
  is_active: boolean;
}

export function AIAgentPanel({ didLevel }: { didLevel?: DIDLevel | null } = {}) {
  const { user } = useAuth();
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [respLevel, setRespLevel] = useState<'standard'|'elevated'|'critical'>('standard');

  const canRegister = didLevel === 'L1' || didLevel === 'L2' || didLevel === 'L3' || didLevel === 'L4';
  const canCritical = didLevel === 'L3' || didLevel === 'L4';

  const reload = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase.from('ai_operators')
      .select('id, agent_did_id, agent_name, responsibility_level, attestation_weight_cap, is_active')
      .eq('operator_user_id', user.id);
    setAgents((data ?? []) as AgentRow[]);
    setLoading(false);
  };

  useEffect(() => { reload(); }, [user?.id]);

  const handleRegister = async () => {
    if (!canRegister) {
      toast.error('Cần DID L1+ để đăng ký AI agent');
      return;
    }
    if (respLevel === 'critical' && !canCritical) {
      toast.error('Mức Critical cần DID L3+');
      return;
    }
    if (!name.trim()) {
      toast.error('Tên agent bắt buộc');
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke('ai-agent-engine', {
      body: { action: 'register_agent', agent_name: name, agent_purpose: purpose, responsibility_level: respLevel },
    });
    setCreating(false);
    if (error || !data?.success) {
      toast.error(error?.message || data?.error || 'Đăng ký thất bại');
      return;
    }
    toast.success('Đã đăng ký AI agent');
    setShowForm(false);
    setName(''); setPurpose(''); setRespLevel('standard');
    reload();
  };

  const handleRevoke = async (agent_did_id: string) => {
    const reason = prompt('Lý do thu hồi?') ?? 'manual_revoke';
    const { data, error } = await supabase.functions.invoke('ai-agent-engine', {
      body: { action: 'revoke_agent', agent_did_id, reason },
    });
    if (error || !data?.success) {
      toast.error('Thu hồi thất bại');
      return;
    }
    toast.success('Đã thu hồi agent');
    reload();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Bot className="w-5 h-5" /> AI Agents (operator)
        </CardTitle>
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => canRegister && setShowForm(v => !v)}
                  disabled={!canRegister}
                  aria-disabled={!canRegister}
                >
                  {canRegister ? <Plus className="w-4 h-4 mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
                  Đăng ký
                </Button>
              </span>
            </TooltipTrigger>
            {!canRegister && (
              <TooltipContent>
                Cần DID L1+ để đăng ký AI agent (hiện tại: {didLevel ?? 'L0'}).
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && canRegister && (
          <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/30">
            <div>
              <Label htmlFor="agent-name">Tên agent</Label>
              <Input id="agent-name" value={name} onChange={e => setName(e.target.value)}
                placeholder="Angel Bot v1" />
            </div>
            <div>
              <Label htmlFor="agent-purpose">Mục đích</Label>
              <Textarea id="agent-purpose" rows={2} value={purpose}
                onChange={e => setPurpose(e.target.value)} />
            </div>
            <div>
              <Label>Mức trách nhiệm</Label>
              <Select value={respLevel} onValueChange={(v: any) => setRespLevel(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="elevated">Elevated</SelectItem>
                  <SelectItem value="critical" disabled={!canCritical}>
                    Critical {canCritical ? '' : '(cần DID L3+)'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={handleRegister} disabled={creating}>
              {creating ? 'Đang đăng ký...' : 'Đăng ký'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Bạn (operator) chịu trách nhiệm về mọi hành động của agent. Attestation từ AI bị giới hạn weight ≤ 0.05.
            </p>
          </div>
        )}

        {loading && <p className="text-sm text-muted-foreground">Đang tải...</p>}
        {!loading && agents.length === 0 && (
          <p className="text-sm text-muted-foreground">Chưa có agent nào.</p>
        )}
        {agents.map(a => (
          <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Bot className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{a.agent_name}</p>
                <p className="text-xs text-muted-foreground">
                  weight cap: {a.attestation_weight_cap}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={a.is_active ? 'default' : 'secondary'}>
                {a.is_active ? a.responsibility_level : 'revoked'}
              </Badge>
              {a.is_active && (
                <Button size="sm" variant="ghost" onClick={() => handleRevoke(a.agent_did_id)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
