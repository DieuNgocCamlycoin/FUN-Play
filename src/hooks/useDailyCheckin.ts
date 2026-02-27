import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type CheckinMood = 'peaceful' | 'grateful' | 'joyful' | 'reflective' | 'hopeful' | 'compassionate';

export interface CheckinRecord {
  id: string;
  checkin_date: string;
  mood: CheckinMood | null;
  intention: string | null;
  streak_count: number;
  light_score_snapshot: number;
  light_level_snapshot: string;
  created_at: string;
}

export interface UseDailyCheckinReturn {
  todayCheckin: CheckinRecord | null;
  recentCheckins: CheckinRecord[];
  currentStreak: number;
  loading: boolean;
  submitting: boolean;
  checkin: (mood: CheckinMood, intention?: string) => Promise<boolean>;
  hasCheckedInToday: boolean;
}

export function useDailyCheckin(): UseDailyCheckinReturn {
  const { user } = useAuth();
  const [todayCheckin, setTodayCheckin] = useState<CheckinRecord | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<CheckinRecord[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchCheckins = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('checkin_date', { ascending: false })
        .limit(30);

      if (error) throw error;

      const records = (data || []) as CheckinRecord[];
      setRecentCheckins(records);
      
      const todayRecord = records.find(r => r.checkin_date === today) || null;
      setTodayCheckin(todayRecord);
      setCurrentStreak(todayRecord?.streak_count || records[0]?.streak_count || 0);
    } catch (err) {
      console.error('Error fetching checkins:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchCheckins(); }, [fetchCheckins]);

  const checkin = useCallback(async (mood: CheckinMood, intention?: string): Promise<boolean> => {
    if (!user?.id || submitting) return false;
    
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('daily_checkins')
        .insert({
          user_id: user.id,
          mood,
          intention: intention?.trim() || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Already checked in today
          return false;
        }
        throw error;
      }

      setTodayCheckin(data as CheckinRecord);
      setCurrentStreak((data as CheckinRecord).streak_count);
      setRecentCheckins(prev => [data as CheckinRecord, ...prev]);
      return true;
    } catch (err) {
      console.error('Error checking in:', err);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user?.id, submitting]);

  return {
    todayCheckin,
    recentCheckins,
    currentStreak,
    loading,
    submitting,
    checkin,
    hasCheckedInToday: !!todayCheckin,
  };
}
