import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Clock, Sparkles } from "lucide-react";

interface VestingSchedule {
  epoch_id: string;
  total_amount: number;
  instant_amount: number;
  locked_amount: number;
  unlocked_amount: number;
  claimed_amount: number;
  token_state: string;
  next_unlock_at: string | null;
  contribution_unlock: number;
  usage_unlock: number;
  consistency_unlock: number;
}

interface VestingProgressCardProps {
  schedules: VestingSchedule[];
}

const STATE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Đang xử lý", color: "bg-yellow-500/20 text-yellow-300", icon: Clock },
  minted_locked: { label: "Đang khóa", color: "bg-orange-500/20 text-orange-300", icon: Lock },
  vesting_unlockable: { label: "Đang mở dần", color: "bg-blue-500/20 text-blue-300", icon: Unlock },
  claimable: { label: "Sẵn sàng sử dụng", color: "bg-green-500/20 text-green-300", icon: Sparkles },
};

export function VestingProgressCard({ schedules }: VestingProgressCardProps) {
  if (!schedules.length) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Phần thưởng Ánh Sáng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Chưa có phần thưởng nào</p>
        </CardContent>
      </Card>
    );
  }

  const totals = schedules.reduce(
    (acc, s) => ({
      total: acc.total + s.total_amount,
      instant: acc.instant + s.instant_amount,
      unlocked: acc.unlocked + s.unlocked_amount,
      claimed: acc.claimed + s.claimed_amount,
      locked: acc.locked + (s.locked_amount - s.unlocked_amount),
    }),
    { total: 0, instant: 0, unlocked: 0, claimed: 0, locked: 0 }
  );

  const claimable = totals.instant + totals.unlocked - totals.claimed;
  const progressPct = totals.total > 0 ? ((totals.instant + totals.unlocked) / totals.total) * 100 : 0;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/30">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Phần thưởng Ánh Sáng
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-xs text-muted-foreground">Sẵn sàng sử dụng</p>
            <p className="text-lg font-bold text-green-400">
              {Math.round(claimable).toLocaleString()} FUN
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-muted-foreground">Đang mở dần</p>
            <p className="text-lg font-bold text-blue-400">
              {Math.round(totals.locked).toLocaleString()} FUN
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Tiến độ mở khóa</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

        {/* Per-epoch breakdown */}
        {schedules.slice(0, 3).map((s) => {
          const stateInfo = STATE_LABELS[s.token_state] || STATE_LABELS.pending;
          const Icon = stateInfo.icon;
          const epochPct = s.total_amount > 0 ? ((s.instant_amount + s.unlocked_amount) / s.total_amount) * 100 : 0;

          return (
            <div key={s.epoch_id} className="p-3 rounded-lg bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.epoch_id.replace("mint_", "")}</span>
                <Badge className={`text-[10px] ${stateInfo.color}`}>
                  <Icon className="w-3 h-3 mr-1" />
                  {stateInfo.label}
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span>{Math.round(s.instant_amount + s.unlocked_amount).toLocaleString()} / {Math.round(s.total_amount).toLocaleString()} FUN</span>
                <span>{Math.round(epochPct)}%</span>
              </div>
              <Progress value={epochPct} className="h-1.5" />

              {/* Unlock bonuses */}
              {(s.contribution_unlock > 0 || s.usage_unlock > 0 || s.consistency_unlock > 0) && (
                <div className="flex gap-2 text-[10px] text-muted-foreground">
                  {s.contribution_unlock > 0 && (
                    <span className="text-green-400">+{Math.round(s.contribution_unlock)} đóng góp</span>
                  )}
                  {s.usage_unlock > 0 && (
                    <span className="text-blue-400">+{Math.round(s.usage_unlock)} sử dụng</span>
                  )}
                  {s.consistency_unlock > 0 && (
                    <span className="text-purple-400">+{Math.round(s.consistency_unlock)} đều đặn</span>
                  )}
                </div>
              )}

              {s.next_unlock_at && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Mở thêm: {new Date(s.next_unlock_at).toLocaleDateString("vi-VN")}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
