import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Reliable fallback notification sounds
const FALLBACK_SOUNDS = [
  'https://cdn.pixabay.com/audio/2024/11/27/audio_c777f82a9d.mp3',
  'https://cdn.pixabay.com/audio/2022/07/26/audio_124bfae5c2.mp3',
];

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

        if (!error && data?.config_text) {
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
    const tryPlay = (url: string): Promise<HTMLAudioElement> => {
      return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        audio.volume = options?.volume ?? 0.6;
        audio.loop = options?.loop ?? false;
        audio.addEventListener('canplaythrough', () => {
          audio.play().then(() => resolve(audio)).catch(reject);
        }, { once: true });
        audio.addEventListener('error', () => reject(new Error(`Failed to load: ${url}`)), { once: true });
        audio.load();
      });
    };

    const urls = [
      ...(soundUrl ? [soundUrl] : []),
      ...FALLBACK_SOUNDS,
    ];

    const attemptPlay = async (): Promise<HTMLAudioElement | null> => {
      for (const url of urls) {
        try {
          return await tryPlay(url);
        } catch {
          console.warn('Sound failed, trying next:', url);
        }
      }
      console.error('All notification sounds failed');
      return null;
    };

    // Return a dummy audio for sync API compatibility; actual play is async
    const dummyAudio = new Audio();
    attemptPlay().then(audio => {
      if (audio) Object.assign(dummyAudio, { src: audio.src });
    });
    return dummyAudio;
  }, [soundUrl]);

  const getClaimSoundUrl = useCallback(() => {
    return soundUrl || FALLBACK_SOUNDS[0];
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
