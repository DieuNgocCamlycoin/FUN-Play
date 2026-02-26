/**
 * Activity Summary
 * Quick overview of user's platform activities with FUN rewards breakdown
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  Upload, 
  Coins,
  TrendingUp
} from 'lucide-react';
import type { LightActivity } from '@/hooks/useLightActivity';

interface ActivitySummaryProps {
  activity: LightActivity | null;
}

interface StatItem {
  icon: React.ElementType;
  label: string;
  activityKey: keyof LightActivity['activityCounts'];
  funPerAction: number;
  color: string;
}

const STATS: StatItem[] = [
  {
    icon: Eye,
    label: 'Views',
    activityKey: 'views',
    funPerAction: 10,
    color: 'text-blue-500 bg-blue-500/10'
  },
  {
    icon: Heart,
    label: 'Likes',
    activityKey: 'likes',
    funPerAction: 5,
    color: 'text-pink-500 bg-pink-500/10'
  },
  {
    icon: MessageCircle,
    label: 'Comments',
    activityKey: 'comments',
    funPerAction: 15,
    color: 'text-green-500 bg-green-500/10'
  },
  {
    icon: Share2,
    label: 'Shares',
    activityKey: 'shares',
    funPerAction: 20,
    color: 'text-purple-500 bg-purple-500/10'
  },
  {
    icon: Upload,
    label: 'Uploads',
    activityKey: 'uploads',
    funPerAction: 100,
    color: 'text-orange-500 bg-orange-500/10'
  }
];

export function ActivitySummary({ activity }: ActivitySummaryProps) {
  if (!activity) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-primary" />
          Activity Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Activity + FUN Reward table */}
        <div className="space-y-2">
          {STATS.map((stat) => {
            const count = activity.activityCounts[stat.activityKey];
            const funReward = activity.funBreakdown?.[stat.activityKey] ?? (count * stat.funPerAction);
            return (
              <div 
                key={stat.label}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color.split(' ')[1]}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color.split(' ')[0]}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{stat.label}</p>
                    <p className="text-xs text-muted-foreground">×{stat.funPerAction} FUN</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{count.toLocaleString()}</p>
                  <p className="text-xs text-primary font-medium">→ {funReward.toLocaleString()} FUN</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* FUN Totals */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
          <div className="p-3 rounded-lg bg-primary/10 text-center">
            <p className="text-xs text-muted-foreground">Tổng FUN</p>
            <p className="text-lg font-bold text-primary">
              {(activity.totalFunReward ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10 text-center">
            <p className="text-xs text-muted-foreground">Đã Mint</p>
            <p className="text-lg font-bold text-yellow-500">
              {(activity.alreadyMintedFun ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-xs text-muted-foreground">Còn lại</p>
            <p className="text-lg font-bold text-green-500">
              {Math.max(0, (activity.totalFunReward ?? 0) - (activity.alreadyMintedFun ?? 0)).toLocaleString()}
            </p>
          </div>
        </div>

        {/* CAMLY Breakdown */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
          <div className="p-3 rounded-lg bg-green-500/10">
            <p className="text-sm text-muted-foreground">CAMLY Approved</p>
            <p className="text-lg font-bold text-green-500">
              {activity.camlyEarned.approved.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10">
            <p className="text-sm text-muted-foreground">CAMLY Pending</p>
            <p className="text-lg font-bold text-yellow-500">
              {activity.camlyEarned.pending.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Unity Signals */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm font-medium mb-2">Unity Signals</p>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'collaboration', label: 'Collaboration', check: activity.unitySignals.collaboration },
              { key: 'beneficiaryConfirmed', label: 'Active Commenter', check: activity.unitySignals.beneficiaryConfirmed },
              { key: 'communityEndorsement', label: 'Community Support', check: activity.unitySignals.communityEndorsement },
              { key: 'bridgeValue', label: 'Content Sharer', check: activity.unitySignals.bridgeValue }
            ].map((signal) => (
              <div 
                key={signal.key}
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  signal.check 
                    ? 'bg-green-500/20 text-green-600' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {signal.check ? '✓ ' : ''}{signal.label}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
