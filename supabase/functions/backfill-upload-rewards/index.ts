import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const REWARD_AMOUNTS = {
  FIRST_UPLOAD: 500000,
  SHORT_VIDEO_UPLOAD: 20000,
  LONG_VIDEO_UPLOAD: 70000,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Admin check
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'owner'])
      .limit(1);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Parse params
    const { batchSize = 50, dryRun = false } = await req.json().catch(() => ({}));

    // 4. Find unrewarded videos (no matching reward_transaction for upload types)
    const { data: unrewardedVideos, error: fetchError } = await adminSupabase
      .from('videos')
      .select('id, user_id, duration, created_at, title')
      .eq('upload_rewarded', false)
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch videos', detail: fetchError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!unrewardedVideos || unrewardedVideos.length === 0) {
      return new Response(JSON.stringify({ message: 'No unrewarded videos found', processed: 0 }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Found ${unrewardedVideos.length} unrewarded videos to process`);

    // 5. Get unique user IDs and check their first_upload_rewarded status
    const userIds = [...new Set(unrewardedVideos.map(v => v.user_id))];
    const { data: profiles } = await adminSupabase
      .from('profiles')
      .select('id, first_upload_rewarded, display_name')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Track which users get first upload in this batch
    const firstUploadGranted = new Set<string>();

    const results: Array<{
      videoId: string;
      userId: string;
      title: string;
      rewardType: string;
      amount: number;
      success: boolean;
      error?: string;
    }> = [];

    // 6. Process each video
    for (const video of unrewardedVideos) {
      try {
        const profile = profileMap.get(video.user_id);
        const alreadyHasFirst = profile?.first_upload_rewarded || firstUploadGranted.has(video.user_id);

        let rewardType: string;
        let amount: number;

        if (!alreadyHasFirst) {
          rewardType = 'FIRST_UPLOAD';
          amount = REWARD_AMOUNTS.FIRST_UPLOAD;
          firstUploadGranted.add(video.user_id);
        } else {
        const duration = video.duration;
          if (duration === null || duration === undefined) {
            console.warn(`⚠️ Video ${video.id} "${video.title}" has NULL duration, defaulting to SHORT. Admin should verify actual duration.`);
          }
          if ((duration || 0) > 180) {
            rewardType = 'LONG_VIDEO_UPLOAD';
            amount = REWARD_AMOUNTS.LONG_VIDEO_UPLOAD;
          } else {
            rewardType = 'SHORT_VIDEO_UPLOAD';
            amount = REWARD_AMOUNTS.SHORT_VIDEO_UPLOAD;
          }
        }

        if (dryRun) {
          results.push({ videoId: video.id, userId: video.user_id, title: video.title, rewardType, amount, success: true });
          continue;
        }

        // Atomic increment reward (auto-approve = true for backfill)
        const { error: rpcError } = await adminSupabase.rpc('atomic_increment_reward', {
          p_user_id: video.user_id,
          p_amount: amount,
          p_auto_approve: true,
        });

        if (rpcError) {
          console.error(`RPC error for video ${video.id}:`, rpcError);
          results.push({ videoId: video.id, userId: video.user_id, title: video.title, rewardType, amount, success: false, error: rpcError.message });
          continue;
        }

        // Create reward_transaction
        const txHash = `BACKFILL_${rewardType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await adminSupabase.from('reward_transactions').insert({
          user_id: video.user_id,
          video_id: video.id,
          amount,
          reward_type: rewardType,
          status: 'success',
          tx_hash: txHash,
          approved: true,
          approved_at: new Date().toISOString(),
        });

        // Update video
        await adminSupabase.from('videos').update({ upload_rewarded: true }).eq('id', video.id);

        // Update first_upload_rewarded if needed
        if (rewardType === 'FIRST_UPLOAD') {
          await adminSupabase.from('profiles').update({ first_upload_rewarded: true }).eq('id', video.user_id);
        }

        console.log(`✅ ${rewardType} ${amount} CAMLY -> ${profile?.display_name || video.user_id} (video: ${video.title})`);
        results.push({ videoId: video.id, userId: video.user_id, title: video.title, rewardType, amount, success: true });
      } catch (err) {
        console.error(`Error processing video ${video.id}:`, err);
        results.push({ videoId: video.id, userId: video.user_id, title: video.title, rewardType: 'UNKNOWN', amount: 0, success: false, error: String(err) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const totalAmount = results.filter(r => r.success).reduce((sum, r) => sum + r.amount, 0);

    const summary = {
      dryRun,
      processed: results.length,
      success: successCount,
      failed: failCount,
      totalCamlyAwarded: totalAmount,
      firstUploadUsers: [...firstUploadGranted],
      results,
    };

    console.log(`Backfill complete: ${successCount} success, ${failCount} failed, ${totalAmount} CAMLY total`);

    return new Response(JSON.stringify(summary), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
