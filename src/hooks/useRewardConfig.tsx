import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RewardConfig {
  id: string;
  config_key: string;
  config_value: number;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface RewardConfigHistory {
  id: string;
  config_id: string;
  config_key: string;
  old_value: number | null;
  new_value: number;
  changed_by: string | null;
  changed_at: string;
}

export const useRewardConfig = () => {
  const [configs, setConfigs] = useState<RewardConfig[]>([]);
  const [history, setHistory] = useState<RewardConfigHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('reward_config')
        .select('*')
        .order('config_key');

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching reward configs:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('reward_config_history')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(50);

      if (error) {
        // User might not be admin, so history fetch might fail
        console.log('Could not fetch history (may require admin role)');
        return;
      }
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchConfigs(), fetchHistory()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const updateConfig = async (configKey: string, newValue: number): Promise<boolean> => {
    setUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng đăng nhập để thực hiện thao tác này',
          variant: 'destructive'
        });
        return false;
      }

      const response = await supabase.functions.invoke('update-reward-config', {
        body: { config_key: configKey, config_value: newValue }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Thành công',
        description: response.data.message || 'Đã cập nhật cấu hình',
      });

      // Refresh data
      await Promise.all([fetchConfigs(), fetchHistory()]);
      return true;

    } catch (error: any) {
      console.error('Error updating config:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể cập nhật cấu hình',
        variant: 'destructive'
      });
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const getConfigValue = (key: string): number => {
    const config = configs.find(c => c.config_key === key);
    return config?.config_value || 0;
  };

  return {
    configs,
    history,
    loading,
    updating,
    updateConfig,
    getConfigValue,
    refreshConfigs: fetchConfigs
  };
};

// Config key constants for type safety
export const CONFIG_KEYS = {
  VIEW_REWARD: 'VIEW_REWARD',
  COMMENT_REWARD: 'COMMENT_REWARD',
  UPLOAD_REWARD: 'UPLOAD_REWARD',
  LIKE_REWARD: 'LIKE_REWARD',
  SHARE_REWARD: 'SHARE_REWARD',
  FIRST_UPLOAD_REWARD: 'FIRST_UPLOAD_REWARD',
  SIGNUP_REWARD: 'SIGNUP_REWARD',
  WALLET_CONNECT_REWARD: 'WALLET_CONNECT_REWARD',
  CREATOR_VIEW_REWARD: 'CREATOR_VIEW_REWARD',
  DAILY_VIEW_LIMIT: 'DAILY_VIEW_LIMIT',
  DAILY_COMMENT_LIMIT: 'DAILY_COMMENT_LIMIT',
  DAILY_UPLOAD_LIMIT: 'DAILY_UPLOAD_LIMIT',
  MIN_WATCH_PERCENTAGE: 'MIN_WATCH_PERCENTAGE',
  MIN_COMMENT_LENGTH: 'MIN_COMMENT_LENGTH',
  MAX_COMMENTS_PER_VIDEO: 'MAX_COMMENTS_PER_VIDEO',
  LOW_POOL_THRESHOLD: 'LOW_POOL_THRESHOLD',
  SHORT_VIDEO_VIEW_REWARD: 'SHORT_VIDEO_VIEW_REWARD',
  LONG_VIDEO_VIEW_REWARD: 'LONG_VIDEO_VIEW_REWARD',
  SHORT_VIDEO_MIN_WATCH_PERCENT: 'SHORT_VIDEO_MIN_WATCH_PERCENT',
  LONG_VIDEO_MIN_WATCH_SECONDS: 'LONG_VIDEO_MIN_WATCH_SECONDS',
  SHORT_VIDEO_MAX_DURATION: 'SHORT_VIDEO_MAX_DURATION',
} as const;
