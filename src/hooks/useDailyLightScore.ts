import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DailyScoreEntry {
  date: string;
  B: number;       // base_score
  C: number;       // content_pillar_score
  L: number;       // final_light_score
  mCons: number;   // consistency_multiplier
  mSeq: number;    // sequence_multiplier
  penalty: number; // integrity_penalty
  w: number;       // reputation_weight
  level: string;
  // features detail
  countPosts: number;
  countVideos: number;
  countComments: number;
  countLikes: number;
  countShares: number;
  streak: number;
  sequenceCount: number;
  antiFarmRisk: number;
}

export function useDailyLightScore(userId?: string) {
  const [data, setData] = useState<DailyScoreEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Fetch ledger (day period, last 30)
      const { data: ledger, error: e1 } = await supabase
        .from('light_score_ledger')
        .select('period_start, base_score, final_light_score, consistency_multiplier, sequence_multiplier, integrity_penalty, reputation_weight, level')
        .eq('user_id', userId)
        .eq('period', 'day')
        .order('period_start', { ascending: false })
        .limit(30);

      if (e1) throw e1;

      // Fetch features for same dates
      const dates = (ledger || []).map(r => r.period_start);
      let featuresMap: Record<string, any> = {};

      if (dates.length > 0) {
        const { data: features } = await supabase
          .from('features_user_day')
          .select('date, content_pillar_score, count_posts, count_videos, count_comments, count_likes_given, count_shares, consistency_streak, sequence_count, anti_farm_risk')
          .eq('user_id', userId)
          .in('date', dates);

        (features || []).forEach(f => {
          featuresMap[f.date] = f;
        });
      }

      const entries: DailyScoreEntry[] = (ledger || []).map(row => {
        const f = featuresMap[row.period_start] || {};
        return {
          date: row.period_start,
          B: Number(row.base_score) || 0,
          C: Number(f.content_pillar_score) || 0,
          L: Number(row.final_light_score) || 0,
          mCons: Number(row.consistency_multiplier) || 1,
          mSeq: Number(row.sequence_multiplier) || 1,
          penalty: Number(row.integrity_penalty) || 0,
          w: Number(row.reputation_weight) || 1,
          level: row.level || 'presence',
          countPosts: Number(f.count_posts) || 0,
          countVideos: Number(f.count_videos) || 0,
          countComments: Number(f.count_comments) || 0,
          countLikes: Number(f.count_likes_given) || 0,
          countShares: Number(f.count_shares) || 0,
          streak: Number(f.consistency_streak) || 0,
          sequenceCount: Number(f.sequence_count) || 0,
          antiFarmRisk: Number(f.anti_farm_risk) || 0,
        };
      });

      setData(entries);
    } catch (err) {
      console.error('useDailyLightScore error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refetch: fetch };
}
