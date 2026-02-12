import { Eye, ThumbsUp, MessageSquare, Share2, Upload, Gift, Award, HandCoins } from "lucide-react";

export interface RewardBreakdown {
  view_rewards: number;
  like_rewards: number;
  comment_rewards: number;
  share_rewards: number;
  upload_rewards: number;
  signup_rewards: number;
  bounty_rewards: number;
  manual_rewards?: number;
}

const REWARD_ITEMS: { key: keyof RewardBreakdown; icon: any; label: string; colorClass: string }[] = [
  { key: "view_rewards", icon: Eye, label: "Xem video", colorClass: "text-blue-500" },
  { key: "like_rewards", icon: ThumbsUp, label: "Thích", colorClass: "text-pink-500" },
  { key: "comment_rewards", icon: MessageSquare, label: "Bình luận", colorClass: "text-green-500" },
  { key: "share_rewards", icon: Share2, label: "Chia sẻ", colorClass: "text-purple-500" },
  { key: "upload_rewards", icon: Upload, label: "Upload", colorClass: "text-orange-500" },
  { key: "signup_rewards", icon: Gift, label: "Đăng ký", colorClass: "text-cyan-500" },
  { key: "bounty_rewards", icon: Award, label: "Bounty", colorClass: "text-indigo-500" },
  { key: "manual_rewards", icon: HandCoins, label: "Thưởng tay", colorClass: "text-rose-500" },
];

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

interface Props {
  breakdown: RewardBreakdown;
  totalCamly?: number;
  compact?: boolean;
}

export function RewardBreakdownGrid({ breakdown, totalCamly, compact = false }: Props) {
  const items = REWARD_ITEMS.filter(item => (breakdown[item.key] ?? 0) > 0);
  
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Chưa có phần thưởng nào</p>;
  }

  const maxVal = Math.max(...items.map(i => breakdown[i.key] ?? 0));

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      {items.map(({ key, icon: Icon, label, colorClass }) => {
        const val = breakdown[key] ?? 0;
        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
        return (
          <div key={key} className="flex items-center gap-2">
            <Icon className={`h-3.5 w-3.5 shrink-0 ${colorClass}`} />
            <span className={`text-xs text-muted-foreground ${compact ? "w-14" : "w-16"} shrink-0`}>{label}</span>
            <div className="flex-1 h-4 bg-muted/50 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-500 ${colorClass.replace("text-", "bg-")}/30`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-semibold text-foreground">
                {fmt(val)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ThreeSegmentProgress({
  claimed,
  approved,
  pending,
  total,
}: {
  claimed: number;
  approved: number;
  pending: number;
  total: number;
}) {
  if (total <= 0) return null;
  const claimedPct = (claimed / total) * 100;
  const approvedPct = (approved / total) * 100;
  const pendingPct = (pending / total) * 100;

  return (
    <div className="space-y-1.5">
      <div className="h-2.5 w-full rounded-full bg-muted/50 overflow-hidden flex">
        {claimedPct > 0 && (
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${claimedPct}%` }} title={`Đã nhận: ${fmt(claimed)}`} />
        )}
        {approvedPct > 0 && (
          <div className="h-full bg-cyan-500 transition-all" style={{ width: `${approvedPct}%` }} title={`Có thể claim: ${fmt(approved)}`} />
        )}
        {pendingPct > 0 && (
          <div className="h-full bg-amber-500 transition-all" style={{ width: `${pendingPct}%` }} title={`Chờ duyệt: ${fmt(pending)}`} />
        )}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Đã nhận: {fmt(claimed)}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" /> Claim: {fmt(approved)}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Chờ: {fmt(pending)}
        </span>
      </div>
    </div>
  );
}
