/**
 * Activity Summary
 * Quick overview of user's platform activities
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
  getValue: (a: LightActivity) => number | string;
  color: string;
}

const STATS: StatItem[] = [
  {
    icon: Eye,
    label: 'Views',
    getValue: (a) => a.activityCounts.views,
    color: 'text-blue-500 bg-blue-500/10'
  },
  {
    icon: Heart,
    label: 'Likes',
    getValue: (a) => a.activityCounts.likes,
    color: 'text-pink-500 bg-pink-500/10'
  },
  {
    icon: MessageCircle,
    label: 'Comments',
    getValue: (a) => a.activityCounts.comments,
    color: 'text-green-500 bg-green-500/10'
  },
  {
    icon: Share2,
    label: 'Shares',
    getValue: (a) => a.activityCounts.shares,
    color: 'text-purple-500 bg-purple-500/10'
  },
  {
    icon: Upload,
    label: 'Uploads',
    getValue: (a) => a.activityCounts.uploads,
    color: 'text-orange-500 bg-orange-500/10'
  },
  {
    icon: Coins,
    label: 'CAMLY Earned',
    getValue: (a) => a.camlyEarned.total.toLocaleString(),
    color: 'text-yellow-500 bg-yellow-500/10'
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {STATS.map((stat) => (
            <div 
              key={stat.label}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className={`p-2 rounded-lg ${stat.color.split(' ')[1]}`}>
                <stat.icon className={`w-5 h-5 ${stat.color.split(' ')[0]}`} />
              </div>
              <div>
                <p className="text-lg font-bold">{stat.getValue(activity)}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CAMLY Breakdown */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
          <div className="p-3 rounded-lg bg-green-500/10">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-lg font-bold text-green-500">
              {activity.camlyEarned.approved.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10">
            <p className="text-sm text-muted-foreground">Pending</p>
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
