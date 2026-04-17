import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Lock } from 'lucide-react';
import { getUserSBTs, getSBTRules, CATEGORY_LABELS, type SBTBadge, type SBTRule, type SBTCategory } from '@/lib/identity/sbt-issuance';

interface Props {
  userId: string;
}

const CATEGORIES: SBTCategory[] = ['identity', 'trust', 'contribution', 'credential', 'milestone', 'legacy'];

export function SBTGallery({ userId }: Props) {
  const [owned, setOwned] = useState<SBTBadge[]>([]);
  const [rules, setRules] = useState<SBTRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getUserSBTs(userId), getSBTRules()]).then(([sbts, r]) => {
      setOwned(sbts);
      setRules(r);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return <Card><CardContent className="p-6"><div className="h-48 animate-pulse bg-muted rounded" /></CardContent></Card>;
  }

  const ownedTypes = new Set(owned.map(s => s.sbt_type));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> SBT Gallery</span>
          <Badge variant="secondary">{owned.length}/{rules.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {CATEGORIES.map(cat => {
          const catRules = rules.filter(r => r.category === cat);
          if (catRules.length === 0) return null;

          return (
            <div key={cat}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {CATEGORY_LABELS[cat]}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {catRules.map(rule => {
                  const has = ownedTypes.has(rule.sbt_type);
                  return (
                    <div key={rule.id} className={`relative p-3 rounded-lg border text-center transition ${
                      has
                        ? 'bg-primary/5 border-primary/30'
                        : 'bg-muted/30 border-border opacity-60'
                    }`}>
                      {!has && <Lock className="absolute top-1.5 right-1.5 h-3 w-3 text-muted-foreground" />}
                      <Award className={`h-6 w-6 mx-auto mb-1 ${has ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className="text-xs font-medium leading-tight">{rule.display_name}</p>
                      {rule.trust_weight > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">+{rule.trust_weight} TC</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
