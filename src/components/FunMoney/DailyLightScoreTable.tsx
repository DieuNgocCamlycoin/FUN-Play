import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CalendarDays, TrendingUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDailyLightScore, type DailyScoreEntry } from '@/hooks/useDailyLightScore';
import { useAuth } from '@/hooks/useAuth';

const LEVEL_COLORS: Record<string, string> = {
  presence: 'bg-muted text-muted-foreground',
  spark: 'bg-yellow-500/20 text-yellow-600',
  glow: 'bg-orange-500/20 text-orange-600',
  radiance: 'bg-purple-500/20 text-purple-600',
  brilliance: 'bg-cyan-500/20 text-cyan-600',
};

function ScoreBadge({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tabular-nums">{value.toFixed(1)}</p>
    </div>
  );
}

function DayRow({ entry }: { entry: DailyScoreEntry }) {
  const formattedDate = new Date(entry.date).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  return (
    <AccordionItem value={entry.date} className="border-border/50">
      <AccordionTrigger className="hover:no-underline px-3 py-2.5">
        <div className="flex items-center gap-3 w-full mr-2">
          <span className="text-sm font-mono text-muted-foreground w-24 shrink-0">{formattedDate}</span>
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <ScoreBadge value={entry.B} label="B" />
            <ScoreBadge value={entry.C} label="C" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">L</p>
              <p className={cn(
                "text-lg font-black tabular-nums",
                entry.L >= 80 ? "text-green-500" :
                entry.L >= 50 ? "text-yellow-500" :
                entry.L >= 20 ? "text-orange-500" : "text-red-500"
              )}>
                {entry.L}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[10px] shrink-0", LEVEL_COLORS[entry.level] || LEVEL_COLORS.presence)}>
            {entry.level}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-3">
        {/* Multipliers row */}
        <div className="flex flex-wrap gap-3 text-xs font-mono bg-muted/50 rounded-lg p-2.5 mb-2">
          <span>M_cons: <strong>×{entry.mCons.toFixed(2)}</strong></span>
          <span className="text-muted-foreground">|</span>
          <span>M_seq: <strong>×{entry.mSeq.toFixed(2)}</strong></span>
          <span className="text-muted-foreground">|</span>
          <span>Π: <strong>{entry.penalty.toFixed(2)}</strong></span>
          <span className="text-muted-foreground">|</span>
          <span>w: <strong>{entry.w.toFixed(2)}</strong></span>
        </div>

        {/* Activity counts */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
          {[
            { label: 'Posts', value: entry.countPosts },
            { label: 'Videos', value: entry.countVideos },
            { label: 'Comments', value: entry.countComments },
            { label: 'Likes', value: entry.countLikes },
            { label: 'Shares', value: entry.countShares },
          ].map(item => (
            <div key={item.label} className="p-2 bg-muted rounded text-center">
              <p className="text-muted-foreground">{item.label}</p>
              <p className="font-bold">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Extra info */}
        <div className="flex gap-4 text-xs text-muted-foreground mt-2">
          <span>Streak: <strong className="text-foreground">{entry.streak} ngày</strong></span>
          <span>Sequence: <strong className="text-foreground">{entry.sequenceCount}</strong></span>
          {entry.antiFarmRisk > 0 && (
            <span className="text-destructive">⚠ Anti-farm risk: {entry.antiFarmRisk.toFixed(2)}</span>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function DailyLightScoreTable() {
  const { user } = useAuth();
  const { data, loading } = useDailyLightScore(user?.id);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="w-5 h-5 text-primary" />
            Giải trình Light Score hàng ngày
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Chưa có dữ liệu Light Score. Hãy hoạt động trên nền tảng để bắt đầu!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Summary stats
  const avgL = data.reduce((s, e) => s + e.L, 0) / data.length;
  const maxL = Math.max(...data.map(e => e.L));
  const currentLevel = data[0]?.level || 'presence';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="w-5 h-5 text-primary" />
            Giải trình Light Score hàng ngày
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn(LEVEL_COLORS[currentLevel] || LEVEL_COLORS.presence)}>
              {currentLevel}
            </Badge>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
          <span>TB: <strong className="text-foreground">{avgL.toFixed(1)}</strong></span>
          <span>Max: <strong className="text-foreground">{maxL}</strong></span>
          <span>{data.length} ngày gần nhất</span>
        </div>
      </CardHeader>

      {/* Table header */}
      <div className="px-3 py-1.5 flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground border-t border-b border-border/50 bg-muted/30">
        <span className="w-24 shrink-0">Ngày</span>
        <div className="flex items-center gap-4 flex-1">
          <span className="w-12 text-center">B</span>
          <span className="w-12 text-center">C</span>
          <span className="w-12 text-center">L</span>
        </div>
        <span className="shrink-0">Level</span>
      </div>

      <CardContent className="p-0">
        <Accordion type="multiple">
          {data.map(entry => (
            <DayRow key={entry.date} entry={entry} />
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
