import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  userId: string;
}

interface DidRow { level: string; status: string }
interface SbtRow { sbt_type: string; trust_weight: number; metadata: Record<string, unknown> | null }

const LEVEL_LABEL: Record<string, string> = {
  L0: 'Khách', L1: 'Đã liên kết', L2: 'Xác thực', L3: 'Tin cậy', L4: 'Cốt lõi',
};

export function PublicTrustBadges({ userId }: Props) {
  const [did, setDid] = useState<DidRow | null>(null);
  const [topSbts, setTopSbts] = useState<SbtRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: d }, { data: s }] = await Promise.all([
        supabase.from('did_registry').select('level, status').eq('user_id', userId).maybeSingle(),
        supabase.from('sbt_registry')
          .select('sbt_type, trust_weight, metadata')
          .eq('user_id', userId)
          .eq('status', 'active')
          .eq('privacy_level', 'public')
          .order('trust_weight', { ascending: false })
          .limit(3),
      ]);
      if (cancelled) return;
      setDid((d as DidRow) ?? null);
      setTopSbts((s as SbtRow[]) ?? []);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (!did && topSbts.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {did && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 font-mono text-[11px]">
                <Shield className="h-3 w-3" />
                DID {did.level}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{LEVEL_LABEL[did.level] ?? did.level} · status: {did.status}</p>
            </TooltipContent>
          </Tooltip>
        )}
        {topSbts.map(s => (
          <Tooltip key={s.sbt_type}>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="gap-1 text-[11px]">
                <Award className="h-3 w-3" />
                {(s.metadata as { display_name?: string } | null)?.display_name ?? s.sbt_type.replace(/_/g, ' ')}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">SBT · +{s.trust_weight} TC</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
