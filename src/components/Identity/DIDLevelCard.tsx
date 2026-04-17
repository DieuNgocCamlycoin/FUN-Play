import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Shield, Sparkles } from 'lucide-react';
import { DID_LEVEL_LABELS, DID_LEVEL_DESCRIPTIONS, type DIDRecord, type DIDLevel } from '@/lib/identity/did-registry';

const LEVEL_ORDER: DIDLevel[] = ['L0', 'L1', 'L2', 'L3', 'L4'];

interface Props {
  did: DIDRecord | null;
  loading?: boolean;
}

export function DIDLevelCard({ did, loading }: Props) {
  if (loading) {
    return (
      <Card><CardContent className="p-6"><div className="h-32 animate-pulse bg-muted rounded" /></CardContent></Card>
    );
  }

  const currentLevel = (did?.level ?? 'L0') as DIDLevel;
  const currentIdx = LEVEL_ORDER.indexOf(currentLevel);
  const progressPct = ((currentIdx + 1) / LEVEL_ORDER.length) * 100;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          DID Identity Level
        </CardTitle>
        <Badge variant="secondary" className="font-mono">{currentLevel}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-2xl font-bold">{DID_LEVEL_LABELS[currentLevel]}</span>
            <span className="text-xs text-muted-foreground">{currentIdx + 1}/{LEVEL_ORDER.length}</span>
          </div>
          <p className="text-sm text-muted-foreground">{DID_LEVEL_DESCRIPTIONS[currentLevel]}</p>
        </div>
        <Progress value={progressPct} className="h-2" />
        <div className="grid grid-cols-5 gap-1">
          {LEVEL_ORDER.map((lvl, i) => (
            <div key={lvl} className={`text-center text-xs py-1 rounded ${
              i <= currentIdx ? 'bg-primary/10 text-primary font-medium' : 'bg-muted text-muted-foreground'
            }`}>
              {lvl}
            </div>
          ))}
        </div>
        {did?.status && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Status: <span className="font-medium text-foreground">{did.status}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
