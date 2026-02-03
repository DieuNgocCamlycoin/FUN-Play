import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RewardResult {
  success: boolean;
  amount?: number;
  newTotal?: number;
  milestone?: number | null;
  reason?: string;
}

export const useAutoReward = () => {
  const { toast } = useToast();
  const processingRef = useRef<Set<string>>(new Set());

  // Award CAMLY through edge function
  const awardCAMLY = useCallback(async (
    type: 'VIEW' | 'LIKE' | 'COMMENT' | 'SHARE' | 'UPLOAD' | 'FIRST_UPLOAD' | 'SIGNUP',
    videoId?: string,
    contentHash?: string
  ): Promise<RewardResult> => {
    const key = `${type}-${videoId || 'no-video'}-${Date.now()}`;
    
    // Prevent duplicate calls
    if (processingRef.current.has(key)) {
      return { success: false, reason: 'Already processing' };
    }
    
    processingRef.current.add(key);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, reason: 'Not authenticated' };
      }

      const { data, error } = await supabase.functions.invoke('award-camly', {
        body: { type, videoId, contentHash }
      });

      if (error) {
        console.error('Award CAMLY error:', error);
        return { success: false, reason: error.message };
      }

      if (data?.success) {
        // No reward notifications - 5D Light Economy spirit
        // Rewards are processed silently in the background

        return {
          success: true,
          amount: data.amount,
          newTotal: data.newTotal,
          milestone: data.milestone
        };
      }

      return { success: false, reason: data?.reason || 'Unknown error' };
    } catch (err: any) {
      console.error('Award CAMLY exception:', err);
      return { success: false, reason: err.message };
    } finally {
      processingRef.current.delete(key);
    }
  }, [toast]);

  // Award signup reward (one-time)
  const awardSignupReward = useCallback(async (userId: string): Promise<boolean> => {
    try {
      // Check if already rewarded
      const { data: profile } = await supabase
        .from('profiles')
        .select('signup_rewarded')
        .eq('id', userId)
        .single();

      if (profile?.signup_rewarded) {
        return false; // Already rewarded
      }

      const result = await awardCAMLY('SIGNUP');
      
      if (result.success) {
        // Mark as rewarded
        await supabase
          .from('profiles')
          .update({ signup_rewarded: true })
          .eq('id', userId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Signup reward error:', err);
      return false;
    }
  }, [awardCAMLY]);

  // Award first upload reward (one-time, 500K CAMLY)
  const awardFirstUploadReward = useCallback(async (userId: string, videoId: string): Promise<boolean> => {
    try {
      // Check if already rewarded
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_upload_rewarded')
        .eq('id', userId)
        .single();

      if (profile?.first_upload_rewarded) {
        return false; // Already rewarded, use regular upload reward
      }

      const result = await awardCAMLY('FIRST_UPLOAD', videoId);
      
      if (result.success) {
        // Mark as rewarded
        await supabase
          .from('profiles')
          .update({ first_upload_rewarded: true })
          .eq('id', userId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('First upload reward error:', err);
      return false;
    }
  }, [awardCAMLY]);

  // Award regular upload reward (100K CAMLY, after 3 views)
  const awardUploadReward = useCallback(async (videoId: string): Promise<boolean> => {
    try {
      const result = await awardCAMLY('UPLOAD', videoId);
      return result.success;
    } catch (err) {
      console.error('Upload reward error:', err);
      return false;
    }
  }, [awardCAMLY]);

  // Award view reward
  const awardViewReward = useCallback(async (videoId: string): Promise<boolean> => {
    try {
      const result = await awardCAMLY('VIEW', videoId);
      return result.success;
    } catch (err) {
      console.error('View reward error:', err);
      return false;
    }
  }, [awardCAMLY]);

  // Award comment reward (with content hash for spam prevention)
  const awardCommentReward = useCallback(async (videoId: string, commentContent: string): Promise<boolean> => {
    try {
      // Check minimum words (5 words)
      const wordCount = commentContent.trim().split(/\s+/).filter(w => w.length > 0).length;
      if (wordCount < 5) {
        return false;
      }

      // Create content hash for spam detection
      const contentHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(commentContent.toLowerCase().trim())
      ).then(hash => Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      );

      const result = await awardCAMLY('COMMENT', videoId, contentHash);
      return result.success;
    } catch (err) {
      console.error('Comment reward error:', err);
      return false;
    }
  }, [awardCAMLY]);

  // Award like reward
  const awardLikeReward = useCallback(async (videoId: string): Promise<boolean> => {
    try {
      const result = await awardCAMLY('LIKE', videoId);
      return result.success;
    } catch (err) {
      console.error('Like reward error:', err);
      return false;
    }
  }, [awardCAMLY]);

  // Award share reward
  const awardShareReward = useCallback(async (videoId: string): Promise<boolean> => {
    try {
      const result = await awardCAMLY('SHARE', videoId);
      return result.success;
    } catch (err) {
      console.error('Share reward error:', err);
      return false;
    }
  }, [awardCAMLY]);

  return {
    awardCAMLY,
    awardSignupReward,
    awardFirstUploadReward,
    awardUploadReward,
    awardViewReward,
    awardCommentReward,
    awardLikeReward,
    awardShareReward
  };
};
