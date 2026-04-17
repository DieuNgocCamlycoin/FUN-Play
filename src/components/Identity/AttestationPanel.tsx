import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AttestationModal } from './AttestationModal';

interface Attestation {
  id: string;
  attestation_type: string;
  weight: number;
  comment: string | null;
  status: string;
  created_at: string;
  from_user_id: string;
  to_user_id: string;
}

interface Props {
  userId: string;
}

export function AttestationPanel({ userId }: Props) {
  const [received, setReceived] = useState<Attestation[]>([]);
  const [given, setGiven] = useState<Attestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: r }, { data: g }] = await Promise.all([
      supabase.from('attestation_log').select('*').eq('to_user_id', userId).eq('status', 'active').order('created_at', { ascending: false }).limit(10),
      supabase.from('attestation_log').select('*').eq('from_user_id', userId).order('created_at', { ascending: false }).limit(10),
    ]);
    setReceived((r as unknown as Attestation[]) ?? []);
    setGiven((g as unknown as Attestation[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  if (loading) {
    return <Card><CardContent className="p-6"><div className="h-32 animate-pulse bg-muted rounded" /></CardContent></Card>;
  }

  const totalWeight = received.reduce((s, a) => s + (a.weight || 0), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Attestations
        </CardTitle>
        <Badge variant="secondary">+{totalWeight.toFixed(1)} weight</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Đã nhận ({received.length})</h4>
          {received.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Chưa có ai chứng nhận bạn</p>
          ) : (
            <ul className="space-y-1.5">
              {received.slice(0, 5).map(a => (
                <li key={a.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/40">
                  <span>{a.attestation_type}</span>
                  <Badge variant="outline" className="font-mono text-[10px]">+{a.weight}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Đã trao ({given.length})</h4>
          {given.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Bạn chưa chứng nhận ai</p>
          ) : (
            <ul className="space-y-1.5">
              {given.slice(0, 3).map(a => (
                <li key={a.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/20">
                  <span>{a.attestation_type}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={() => setModalOpen(true)}>
          Trao attestation
        </Button>
      </CardContent>
      <AttestationModal open={modalOpen} onOpenChange={setModalOpen} onIssued={load} />
    </Card>
  );
}
