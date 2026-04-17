import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';

const TYPES = [
  { value: 'endorse_skill', label: 'Endorse skill (chuyên môn)' },
  { value: 'endorse_character', label: 'Endorse character (phẩm chất)' },
  { value: 'mentor_validation', label: 'Mentor validation' },
  { value: 'peer_review', label: 'Peer review' },
  { value: 'community_vouch', label: 'Community vouch' },
];

interface UserHit {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultUserId?: string;
  defaultUsername?: string;
  onIssued?: () => void;
}

export function AttestationModal({ open, onOpenChange, defaultUserId, defaultUsername, onIssued }: Props) {
  const { toast } = useToast();
  const [query, setQuery] = useState(defaultUsername ?? '');
  const [hits, setHits] = useState<UserHit[]>([]);
  const [target, setTarget] = useState<UserHit | null>(
    defaultUserId && defaultUsername ? { id: defaultUserId, username: defaultUsername, display_name: null, avatar_url: null } : null,
  );
  const [type, setType] = useState('endorse_character');
  const [weight, setWeight] = useState(0.05);
  const [comment, setComment] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const searchUsers = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) { setHits([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(8);
    setHits((data as UserHit[]) ?? []);
    setSearching(false);
  };

  const submit = async () => {
    if (!target) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('attestation-engine', {
      body: { to_user_id: target.id, attestation_type: type, weight, comment: comment || undefined },
    });
    setSubmitting(false);
    if (error || (data as { error?: string })?.error) {
      toast({
        title: 'Không gửi được',
        description: (data as { error?: string })?.error || error?.message || 'Lỗi không xác định',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Đã trao attestation', description: `+${weight} TC tới @${target.username}` });
    onIssued?.();
    onOpenChange(false);
    setComment('');
    setTarget(null);
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Trao attestation</DialogTitle>
          <DialogDescription>
            Chứng nhận một người bạn tin tưởng. Cần DID L1+. Tối đa 0.10 TC mỗi lần.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Người nhận</Label>
            {target ? (
              <div className="flex items-center justify-between p-2 rounded-md border bg-muted/40">
                <div className="text-sm">
                  <p className="font-medium">{target.display_name ?? target.username}</p>
                  <p className="text-xs text-muted-foreground">@{target.username}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => { setTarget(null); setQuery(''); }}>Đổi</Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Tìm theo username hoặc tên hiển thị"
                  value={query}
                  onChange={(e) => searchUsers(e.target.value)}
                />
                {hits.length > 0 && (
                  <div className="mt-1 border rounded-md max-h-48 overflow-auto bg-popover">
                    {hits.map(h => (
                      <button
                        key={h.id}
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-b-0"
                        onClick={() => { setTarget(h); setHits([]); }}
                      >
                        <p className="font-medium">{h.display_name ?? h.username}</p>
                        <p className="text-xs text-muted-foreground">@{h.username}</p>
                      </button>
                    ))}
                  </div>
                )}
                {searching && <p className="text-xs text-muted-foreground mt-1">Đang tìm…</p>}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Loại attestation</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Trọng số TC</Label>
              <span className="text-sm font-mono">+{weight.toFixed(2)}</span>
            </div>
            <Slider value={[weight]} min={0.01} max={0.10} step={0.01} onValueChange={(v) => setWeight(v[0])} />
          </div>

          <div className="space-y-1.5">
            <Label>Ghi chú (tuỳ chọn)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Vì sao bạn tin tưởng người này?"
              rows={3}
              maxLength={280}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button disabled={!target || submitting} onClick={submit}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Trao attestation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
