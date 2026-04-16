/**
 * ParameterTuningPanel — Admin panel for viewing all PPLP v2.5 parameters
 * Read-only visualization of parameter tables from light-score-params-v1.ts
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  EVENT_BASE_VALUES,
  QUALITY_LEVELS,
  TRUST_LEVELS,
  IIS_PATTERNS,
  IMPACT_LEVELS,
  AAF_LEVELS,
  EGO_RISK_PATTERNS,
  CONSISTENCY_TABLE,
  RELIABILITY_TABLE,
  NETWORK_QUALITY_TABLE,
  NETWORK_TRUST_TABLE,
  NETWORK_DIVERSITY_TABLE,
  ACTIVATION_THRESHOLDS,
} from '@/lib/fun-money/light-score-params-v1';

interface ParameterTuningPanelProps {
  className?: string;
}

const RangeRow = ({ label, min, max, id }: { label: string; min: number; max: number; id?: string }) => (
  <div className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
    <div className="flex items-center gap-2">
      {id && <Badge variant="outline" className="text-[9px] px-1">{id}</Badge>}
      <span className="text-xs">{label}</span>
    </div>
    <span className="text-xs font-mono text-muted-foreground">
      {min === max ? min.toString() : `${min} – ${max}`}
    </span>
  </div>
);

export const ParameterTuningPanel = ({ className }: ParameterTuningPanelProps) => {
  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">📊 Parameter Table v1.0</CardTitle>
        <p className="text-xs text-muted-foreground">Tất cả tham số PPLP v2.5 — chỉ đọc</p>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="base" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-8">
            <TabsTrigger value="base" className="text-[10px]">Base Values</TabsTrigger>
            <TabsTrigger value="multipliers" className="text-[10px]">Multipliers</TabsTrigger>
            <TabsTrigger value="personal" className="text-[10px]">Personal</TabsTrigger>
            <TabsTrigger value="activation" className="text-[10px]">Activation</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[320px] mt-2">
            {/* Base Values */}
            <TabsContent value="base" className="mt-0">
              <h4 className="text-xs font-semibold mb-2">EVENT BASE VALUES (B_e)</h4>
              {Object.values(EVENT_BASE_VALUES).map(ev => (
                <RangeRow key={ev.code} label={ev.label} min={ev.min} max={ev.max} id={ev.code} />
              ))}
            </TabsContent>

            {/* Multipliers */}
            <TabsContent value="multipliers" className="mt-0 space-y-4">
              <div>
                <h4 className="text-xs font-semibold mb-1">QUALITY (Q_e)</h4>
                {QUALITY_LEVELS.map(l => <RangeRow key={l.id} label={l.label} min={l.min} max={l.max} id={l.id} />)}
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-1">TRUST (TC_e)</h4>
                {TRUST_LEVELS.map(l => <RangeRow key={l.id} label={l.label} min={l.min} max={l.max} id={l.id} />)}
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-1">INTENTION (IIS_e)</h4>
                {IIS_PATTERNS.map(l => <RangeRow key={l.id} label={l.label} min={l.min} max={l.max} id={l.id} />)}
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-1">IMPACT (IM_e)</h4>
                {IMPACT_LEVELS.map(l => <RangeRow key={l.id} label={l.label} min={l.min} max={l.max} id={l.id} />)}
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-1">ANTI-ABUSE (AAF)</h4>
                {AAF_LEVELS.map(l => <RangeRow key={l.id} label={l.label} min={l.min} max={l.max} id={l.id} />)}
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-1">EGO RISK (ERP)</h4>
                {EGO_RISK_PATTERNS.map(l => <RangeRow key={l.id} label={l.label} min={l.min} max={l.max} id={l.id} />)}
              </div>
            </TabsContent>

            {/* Personal */}
            <TabsContent value="personal" className="mt-0 space-y-4">
              <div>
                <h4 className="text-xs font-semibold mb-1">CONSISTENCY (C_t)</h4>
                {CONSISTENCY_TABLE.map((band, i) => (
                  <RangeRow key={i} label={`${band.minDays}–${band.maxDays > 9999 ? '∞' : band.maxDays} ngày`} min={band.multiplier} max={band.multiplier} />
                ))}
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-1">RELIABILITY (R_t)</h4>
                {RELIABILITY_TABLE.map(l => <RangeRow key={l.id} label={l.label} min={l.min} max={l.max} id={l.id} />)}
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-1">NETWORK QUALITY (QN)</h4>
                {NETWORK_QUALITY_TABLE.map(l => <RangeRow key={l.id} label={l.label} min={l.min} max={l.max} id={l.id} />)}
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-1">NETWORK TRUST (TN)</h4>
                {NETWORK_TRUST_TABLE.map(l => <RangeRow key={l.id} label={l.label} min={l.min} max={l.max} id={l.id} />)}
              </div>
              <div>
                <h4 className="text-xs font-semibold mb-1">NETWORK DIVERSITY (DN)</h4>
                {NETWORK_DIVERSITY_TABLE.map(l => <RangeRow key={l.id} label={l.label} min={l.min} max={l.max} id={l.id} />)}
              </div>
            </TabsContent>

            {/* Activation */}
            <TabsContent value="activation" className="mt-0">
              <h4 className="text-xs font-semibold mb-2">ACTIVATION THRESHOLDS</h4>
              {ACTIVATION_THRESHOLDS.map(t => (
                <div key={t.feature} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-xs">{t.label}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px]">LS ≥ {t.minDisplayLS}</Badge>
                    {t.minTC && <Badge variant="outline" className="text-[9px]">TC ≥ {t.minTC}</Badge>}
                  </div>
                </div>
              ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};
