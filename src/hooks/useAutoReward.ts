import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RewardResult {
  success: boolean;
  amount?: number;
  newTotal?: number;
  milestone?: number | null;
  reason?: string;
  autoApproved?: boolean;
}

export const useAutoReward = () => {
  const processingRef = useRef<Set<string>>(new Set());

  // Award CAMLY through edge function
  const awardCAMLY = useCallback(async (
    type: 'VIEW' | 'LIKE' | 'COMMENT' | 'SHARE' | 'UPLOAD' | 'SHORT_VIDEO_UPLOAD' | 'LONG_VIDEO_UPLOAD' | 'FIRST_UPLOAD' | 'SIGNUP' | 'WALLET_CONNECT',
    videoId?: string,
    options?: { contentHash?: string; commentLength?: number }
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
        body: { 
          type, 
          videoId, 
          contentHash: options?.contentHash,
          commentLength: options?.commentLength
        }
      });

      if (error) {
        console.error('Award CAMLY error:', error);
        return { success: false, reason: error.message };
      }

      if (data?.success) {
        // Silent reward - 5D Light Economy spirit
        // Rewards are processed silently in the background
        console.log(`[Reward] ${data.amount} CAMLY for ${type}, auto-approved: ${data.autoApproved}`);

        // Dispatch event để UI cập nhật ngay lập tức
        window.dispatchEvent(new CustomEvent("camly-reward", { 
          detail: { 
            type, 
            amount: data.amount, 
            autoApproved: data.autoApproved 
          } 
        }));

        return {
          success: true,
          amount: data.amount,
          newTotal: data.newTotal,
          milestone: data.milestone,
          autoApproved: data.autoApproved
        };
      }

      return { success: false, reason: data?.reason || 'Unknown error' };
    } catch (err: any) {
      console.error('Award CAMLY exception:', err);
      return { success: false, reason: err.message };
    } finally {
      processingRef.current.delete(key);
    }
  }, []);

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

  // Award regular upload reward (legacy - 100K CAMLY)
  const awardUploadReward = useCallback(async (videoId: string): Promise<boolean> => {
    try {
      const result = await awardCAMLY('UPLOAD', videoId);
      return result.success;
    } catch (err) {
      console.error('Upload reward error:', err);
      return false;
    }
  }, [awardCAMLY]);

  // Award short video upload reward (<3 min, 20K CAMLY)
  const awardShortVideoUpload = useCallback(async (videoId: string): Promise<RewardResult> => {
    return awardCAMLY('SHORT_VIDEO_UPLOAD', videoId);
  }, [awardCAMLY]);

  // Award long video upload reward (>=3 min, 70K CAMLY)
  const awardLongVideoUpload = useCallback(async (videoId: string): Promise<RewardResult> => {
    return awardCAMLY('LONG_VIDEO_UPLOAD', videoId);
  }, [awardCAMLY]);

  // Check and award upload reward when video reaches required views
  const checkUploadReward = useCallback(async (videoId: string): Promise<RewardResult> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, reason: 'Not authenticated' };
      }

      const { data, error } = await supabase.functions.invoke('check-upload-reward', {
        body: { videoId }
      });

      if (error) {
        console.error('Check upload reward error:', error);
        return { success: false, reason: error.message };
      }

      return {
        success: data?.success ?? false,
        amount: data?.amount,
        reason: data?.reason,
        autoApproved: data?.autoApproved
      };
    } catch (err: any) {
      console.error('Check upload reward exception:', err);
      return { success: false, reason: err.message };
    }
  }, []);

  // Award view reward
  const awardViewReward = useCallback(async (videoId: string): Promise<RewardResult> => {
    try {
      return await awardCAMLY('VIEW', videoId);
    } catch (err) {
      console.error('View reward error:', err);
      return { success: false, reason: 'Error' };
    }
  }, [awardCAMLY]);

  // Award comment reward (with content hash for spam prevention)
  const awardCommentReward = useCallback(async (videoId: string, commentContent: string): Promise<boolean> => {
    try {
      // Check minimum characters (20 characters)
      if (commentContent.trim().length < 20) {
        console.log('Comment too short for reward (min 20 chars)');
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

      const result = await awardCAMLY('COMMENT', videoId, { 
        contentHash,
        commentLength: commentContent.trim().length
      });
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

  // Award wallet connect reward (one-time, 50K CAMLY)
  const awardWalletConnectReward = useCallback(async (userId: string): Promise<boolean> => {
    try {
      // Check if already rewarded
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_connect_rewarded')
        .eq('id', userId)
        .single();

      if (profile?.wallet_connect_rewarded) {
        return false; // Already rewarded
      }

      const result = await awardCAMLY('WALLET_CONNECT');
      
      if (result.success) {
        // Mark as rewarded
        await supabase
          .from('profiles')
          .update({ wallet_connect_rewarded: true })
          .eq('id', userId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Wallet connect reward error:', err);
      return false;
    }
  }, [awardCAMLY]);

  return {
    awardCAMLY,
    awardSignupReward,
    awardFirstUploadReward,
    awardUploadReward,
    awardShortVideoUpload,
    awardLongVideoUpload,
    checkUploadReward,
    awardViewReward,
    awardCommentReward,
    awardLikeReward,
    awardShareReward,
    awardWalletConnectReward
  };
};
