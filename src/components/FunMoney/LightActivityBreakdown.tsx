/**
 * Light Activity Breakdown
 * Displays the 5 pillars (S, T, H, C, U) with progress bars
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { BarChart3, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LightActivity } from '@/hooks/useLightActivity';

interface LightActivityBreakdownProps {
  activity: LightActivity | null;
}

interface PillarInfo {
  key: 'S' | 'T' | 'H' | 'C' | 'U';
  name: string;
  emoji: string;
  description: string;
  getDetail: (activity: LightActivity) => string;
  color: string;
}

const PILLARS: PillarInfo[] = [
  {
    key: 'S',
    name: 'Service',
    emoji: '🙏',
    description: 'Phục vụ cộng đồng qua uploads và comments hữu ích',
    getDetail: (a) => `Uploads: ${a.activityCounts.uploads}, Comments: ${a.activityCounts.comments}`,
    color: 'from-rose-500 to-pink-500'
  },
  {
    key: 'T',
    name: 'Truth',
    emoji: '💎',
    description: 'Tính xác thực và tuổi tài khoản',
    getDetail: (a) => `${a.isVerified ? 'Verified ✓' : 'Not verified'}, Age: ${a.accountAgeDays}d`,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    key: 'H',
    name: 'Healing',
    emoji: '💚',
    description: 'Tương tác tích cực với cộng đồng',
    getDetail: (a) => `Views: ${a.activityCounts.views}, Likes: ${a.activityCounts.likes}`,
    color: 'from-green-500 to-emerald-500'
  },
  {
    key: 'C',
    name: 'Contribution',
    emoji: '🎁',
    description: 'Đóng góp tổng thể cho nền tảng',
    getDetail: (a) => `Total: ${a.totalActivities} activities, ${a.camlyEarned.total.toLocaleString()} CAMLY`,
    color: 'from-orange-500 to-amber-500'
  },
  {
    key: 'U',
    name: 'Unity',
    emoji: '🤝',
    description: 'Kết nối và hợp tác với người khác',
    getDetail: (a) => `Comments: ${a.activityCounts.comments}, Shares: ${a.activityCounts.shares}`,
    color: 'from-purple-500 to-violet-500'
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

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="w-5 h-5 text-primary" />
          Phân tích Hoạt động Ánh Sáng
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {PILLARS.map((pillar) => {
          const score = activity.pillars[pillar.key];
          const isGood = score >= 70;
          const isMedium = score >= 50 && score < 70;
          
          return (
            <div key={pillar.key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{pillar.emoji}</span>
                  <span className="font-medium">{pillar.name}</span>
                  <span className="text-muted-foreground">({pillar.key})</span>
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
                  {score}
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={score} 
                  className="h-2.5"
                />
                <div 
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r opacity-90",
                    pillar.color
                  )}
                  style={{ width: `${score}%`, height: '100%' }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {pillar.getDetail(activity)}
              </p>
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
            <span className={cn(
              "text-2xl font-black",
              activity.lightScore >= 70 && "text-green-500",
              activity.lightScore >= 50 && activity.lightScore < 70 && "text-yellow-500",
              activity.lightScore < 50 && "text-red-500"
            )}>
              {activity.lightScore}
            </span>
          </div>
          <Progress 
            value={activity.lightScore} 
            className={cn(
              "h-3 mt-2",
              activity.lightScore >= 60 && "[&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:via-purple-500 [&>div]:to-pink-500"
            )}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {activity.lightScore >= 60 
              ? '✅ Đủ điều kiện mint FUN' 
              : `❌ Cần tối thiểu 60 để mint (còn thiếu ${60 - activity.lightScore})`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
