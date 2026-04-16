/**
 * Cross-Platform Summary
 * Shows breakdown of FUN minted from each platform
 */

import { Badge } from '@/components/ui/badge';
import { Globe, Sparkles, Heart } from 'lucide-react';

interface PlatformBreakdown {
  FUN_PLAY: { count: number; totalFun: number };
  FUN_ANGEL: { count: number; totalFun: number };
  FUN_MAIN: { count: number; totalFun: number };
  FUN_PROFILE: { count: number; totalFun: number };
}

interface CrossPlatformSummaryProps {
  platformBreakdown?: PlatformBreakdown;
  totalMintedFun?: number;
}

const PLATFORM_CONFIG = [
  { key: 'FUN_PLAY', label: 'play.fun.rich', icon: Sparkles, color: 'text-cyan-500' },
  { key: 'FUN_ANGEL', label: 'angel.fun.rich', icon: Heart, color: 'text-pink-500' },
  { key: 'FUN_MAIN', label: 'fun.rich', icon: Globe, color: 'text-purple-500' },
  { key: 'FUN_PROFILE', label: 'fun.rich (profile)', icon: Globe, color: 'text-purple-400' },
];

export function CrossPlatformSummary({ platformBreakdown, totalMintedFun }: CrossPlatformSummaryProps) {
  if (!platformBreakdown) return null;

  const activePlatforms = PLATFORM_CONFIG.filter(
    p => (platformBreakdown as any)[p.key]?.count > 0
  );

  if (activePlatforms.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Nguồn FUN đã mint
      </p>
      <div className="flex flex-wrap gap-2">
        {activePlatforms.map(platform => {
          const data = (platformBreakdown as any)[platform.key];
          const Icon = platform.icon;
          return (
            <Badge key={platform.key} variant="outline" className="gap-1 text-xs">
              <Icon className={`w-3 h-3 ${platform.color}`} />
              <span>{platform.label}</span>
              <span className="font-bold">{data.totalFun.toFixed(1)}</span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
