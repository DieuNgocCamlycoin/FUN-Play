/**
 * Light Activity Breakdown
 * Displays the 6 pillars + multipliers + Light Level badge
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { BarChart3, Info, Shield, Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LightActivity } from '@/hooks/useLightActivity';
import { getLightLevelLabel, getLightLevelEmoji } from '@/lib/fun-money/pplp-engine';

interface LightActivityBreakdownProps {
  activity: LightActivity | null;
}

interface PillarInfo {
  key: 'S' | 'T' | 'H' | 'C' | 'U' | 'SEQ';
  name: string;
  emoji: string;
  max: number;
  description: string;
  getDetail: (activity: LightActivity) => string;
  color: string;
}

const PILLARS: PillarInfo[] = [
  {
    key: 'T',
    name: 'Truth',
    emoji: '💎',
    max: 20,
    description: 'Hồ sơ, xác minh, ví, hiện diện hàng ngày',
    getDetail: (a) => `${a.isVerified ? 'Verified ✓' : 'Not verified'}, Age: ${a.accountAgeDays}d`,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    key: 'U',
    name: 'Trust',
    emoji: '🔒',
    max: 15,
    description: 'Thời gian đóng góp và ổn định',
    getDetail: (a) => `Account age: ${a.accountAgeDays} ngày`,
    color: 'from-indigo-500 to-blue-500'
  },
  {
    key: 'S',
    name: 'Service',
    emoji: '🙏',
    max: 20,
    description: 'Video approved, bài viết, bounty contributions',
    getDetail: (a) => `Uploads: ${a.activityCounts.uploads}, Comments: ${a.activityCounts.comments}`,
    color: 'from-rose-500 to-pink-500'
  },
  {
    key: 'H',
    name: 'Healing',
    emoji: '💚',
    max: 20,
    description: 'Tương tác tích cực: likes, shares, donations',
    getDetail: (a) => `Views: ${a.activityCounts.views}, Likes: ${a.activityCounts.likes}`,
    color: 'from-green-500 to-emerald-500'
  },
  {
    key: 'C',
    name: 'Community',
    emoji: '🤝',
    max: 15,
    description: 'Subscribers, social links, mint & claims on-chain',
    getDetail: (a) => `Total: ${a.totalActivities} activities`,
    color: 'from-purple-500 to-violet-500'
  },
  {
    key: 'SEQ',
    name: 'Sequence Bonus',
    emoji: '🔗',
    max: 10,
    description: 'Chuỗi hành động: Light Growth + Economic Integrity',
    getDetail: () => 'Video→Likes→Reply + Earn→Donate',
    color: 'from-orange-500 to-amber-500'
  }
];

export function LightActivityBreakdown({ activity }: LightActivityBreakdownProps) {
  if (!activity) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Không có dữ liệu hoạt động
        </CardContent>
      </Card>
    );
  }

  const lightLevel = activity.lightLevel || 'presence';
  const levelLabel = getLightLevelLabel(lightLevel);
  const levelEmoji = getLightLevelEmoji(lightLevel);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Phân tích Hoạt động Ánh Sáng
          </CardTitle>
          <Badge variant="outline" className="text-sm font-bold gap-1 px-3 py-1">
            {levelEmoji} {levelLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Multipliers Section */}
        <div className="grid grid-cols-2 gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Shield className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Reputation Weight</p>
              <p className="text-sm font-bold">×{activity.reputationWeight?.toFixed(2) || '1.00'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Zap className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Consistency</p>
              <p className="text-sm font-bold">×{activity.consistencyMultiplier?.toFixed(1) || '1.0'} <span className="text-xs text-muted-foreground">({activity.consistencyDays || 0}d)</span></p>
            </div>
          </div>
        </div>

        {PILLARS.map((pillar) => {
          const score = pillar.key === 'SEQ' 
            ? (activity.sequenceBonus || 0)
            : (activity.pillars[pillar.key as keyof typeof activity.pillars] || 0);
          const pct = Math.min(100, (score / pillar.max) * 100);
          const isGood = pct >= 70;
          const isMedium = pct >= 50 && pct < 70;
          
          return (
            <div key={pillar.key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{pillar.emoji}</span>
                  <span className="font-medium">{pillar.name}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="font-medium">{pillar.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {pillar.getDetail(activity)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className={cn(
                  "font-bold tabular-nums",
                  isGood && "text-green-500",
                  isMedium && "text-yellow-500",
                  !isGood && !isMedium && "text-red-500"
                )}>
                  {score}/{pillar.max}
                </span>
              </div>
              <div className="relative">
                <Progress value={pct} className="h-2.5" />
                <div 
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r opacity-90",
                    pillar.color
                  )}
                  style={{ width: `${pct}%`, height: '100%' }}
                />
              </div>
            </div>
          );
        })}

        {/* Total Light Score */}
        <div className="pt-4 mt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <span className="font-bold">Tổng Điểm Ánh Sáng</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-2xl font-black",
                activity.lightScore >= 70 && "text-green-500",
                activity.lightScore >= 50 && activity.lightScore < 70 && "text-yellow-500",
                activity.lightScore < 50 && "text-red-500"
              )}>
                {activity.lightScore}
              </span>
            </div>
          </div>
          <Progress 
            value={activity.lightScore} 
            className={cn(
              "h-3 mt-2",
              activity.lightScore >= 60 && "[&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:via-purple-500 [&>div]:to-pink-500"
            )}
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">
              {activity.lightScore >= 60 
                ? '✅ Đủ điều kiện mint FUN' 
                : `❌ Cần tối thiểu 60 để mint (còn thiếu ${60 - activity.lightScore})`
              }
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>Raw: {activity.rawScore || 0}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
