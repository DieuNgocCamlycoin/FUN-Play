import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Default fallback sound if no custom sound is configured
const DEFAULT_CLAIM_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2058/2058-preview.mp3';

export const useClaimNotificationSound = () => {
  const [soundUrl, setSoundUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSoundUrl = async () => {
      try {
        const { data, error } = await supabase
          .from('reward_config')
          .select('config_text')
          .eq('config_key', 'CLAIM_NOTIFICATION_SOUND')
          .single();

        if (error) {
          console.log('Could not fetch claim notification sound:', error);
          return;
        }

        if (data?.config_text) {
          setSoundUrl(data.config_text);
        }
      } catch (error) {
        console.error('Error fetching claim notification sound:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSoundUrl();
  }, []);

  const playClaimSound = useCallback((options?: { volume?: number; loop?: boolean }) => {
    const url = soundUrl || DEFAULT_CLAIM_SOUND;
    const audio = new Audio(url);
    audio.volume = options?.volume ?? 0.6;
    audio.loop = options?.loop ?? false;
    
    audio.play().catch(err => {
      console.error("Error playing claim notification sound:", err);
    });

    return audio;
  }, [soundUrl]);

  const getClaimSoundUrl = useCallback(() => {
    return soundUrl || DEFAULT_CLAIM_SOUND;
  }, [soundUrl]);

  return { 
    playClaimSound, 
    soundUrl, 
    loading,
    getClaimSoundUrl 
  };
};

// Hook to update the claim notification sound (admin only)
export const useUpdateClaimSound = () => {
  const [updating, setUpdating] = useState(false);

  const updateClaimSound = async (newUrl: string): Promise<boolean> => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('reward_config')
        .update({ 
          config_text: newUrl,
          updated_at: new Date().toISOString()
        })
        .eq('config_key', 'CLAIM_NOTIFICATION_SOUND');

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating claim sound:', error);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return { updateClaimSound, updating };
};
