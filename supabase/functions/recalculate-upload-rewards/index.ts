import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SHORT_REWARD = 20000;
const LONG_REWARD = 70000;
const SHORT_MAX_DURATION = 180;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify user
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check admin
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: roles } = await adminSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .limit(1);

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'Admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { dryRun = true } = await req.json().catch(() => ({ dryRun: true }));

    // Find all upload reward transactions with mismatched type
    // We need to join reward_transactions with videos to compare duration vs reward_type
    const { data: transactions, error: txError } = await adminSupabase
      .from('reward_transactions')
      .select('id, user_id, video_id, amount, reward_type')
      .in('reward_type', ['SHORT_VIDEO_UPLOAD', 'LONG_VIDEO_UPLOAD'])
      .not('video_id', 'is', null);

    if (txError) {
      return new Response(JSON.stringify({ error: txError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!transactions || transactions.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No upload reward transactions found', 
        fixed: 0, totalDiff: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get all relevant video durations
    const videoIds = [...new Set(transactions.map(t => t.video_id).filter(Boolean))];
    const { data: videos } = await adminSupabase
      .from('videos')
      .select('id, duration')
      .in('id', videoIds);

    const videoDurationMap = new Map<string, number | null>();
    (videos || []).forEach(v => videoDurationMap.set(v.id, v.duration));

    const fixes: Array<{
      txId: string;
      userId: string;
      videoId: string;
      oldType: string;
      newType: string;
      oldAmount: number;
      newAmount: number;
      diff: number;
      duration: number | null;
    }> = [];

    for (const tx of transactions) {
      if (!tx.video_id) continue;
      const duration = videoDurationMap.get(tx.video_id);
      
      // Skip if duration is still NULL (can't determine correct type)
      if (duration == null) continue;

      const shouldBeLong = duration > SHORT_MAX_DURATION;
      const isCurrentlyShort = tx.reward_type === 'SHORT_VIDEO_UPLOAD';
      const isCurrentlyLong = tx.reward_type === 'LONG_VIDEO_UPLOAD';

      if (shouldBeLong && isCurrentlyShort) {
        // Should be LONG but got SHORT reward
        fixes.push({
          txId: tx.id,
          userId: tx.user_id,
          videoId: tx.video_id,
          oldType: 'SHORT_VIDEO_UPLOAD',
          newType: 'LONG_VIDEO_UPLOAD',
          oldAmount: tx.amount,
          newAmount: LONG_REWARD,
          diff: LONG_REWARD - tx.amount,
          duration,
        });
      } else if (!shouldBeLong && isCurrentlyLong) {
        // Should be SHORT but got LONG reward (rare)
        fixes.push({
          txId: tx.id,
          userId: tx.user_id,
          videoId: tx.video_id,
          oldType: 'LONG_VIDEO_UPLOAD',
          newType: 'SHORT_VIDEO_UPLOAD',
          oldAmount: tx.amount,
          newAmount: SHORT_REWARD,
          diff: SHORT_REWARD - tx.amount, // negative
          duration,
        });
      }
    }

    if (dryRun) {
      const totalDiff = fixes.reduce((sum, f) => sum + f.diff, 0);
      return new Response(JSON.stringify({
        dryRun: true,
        fixesNeeded: fixes.length,
        totalDiff,
        fixes: fixes.slice(0, 50), // Show first 50
        message: `Found ${fixes.length} transactions to fix. Total CAMLY diff: ${totalDiff}. Set dryRun=false to apply.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Apply fixes
    let applied = 0;
    let totalDiffApplied = 0;
    const errors: string[] = [];

    for (const fix of fixes) {
      try {
        // Update reward_transaction type and amount
        const { error: updateErr } = await adminSupabase
          .from('reward_transactions')
          .update({ 
            reward_type: fix.newType, 
            amount: fix.newAmount 
          })
          .eq('id', fix.txId);

        if (updateErr) {
          errors.push(`TX ${fix.txId}: ${updateErr.message}`);
          continue;
        }

        // Adjust user balance via atomic_increment_reward
        if (fix.diff !== 0) {
          const { error: balErr } = await adminSupabase.rpc('atomic_increment_reward', {
            p_user_id: fix.userId,
            p_amount: fix.diff,
            p_auto_approve: true,
          });

          if (balErr) {
            errors.push(`Balance ${fix.userId}: ${balErr.message}`);
            continue;
          }
        }

        applied++;
        totalDiffApplied += fix.diff;
      } catch (e) {
        errors.push(`${fix.txId}: ${e.message}`);
      }
    }

    return new Response(JSON.stringify({
      dryRun: false,
      applied,
      totalDiffApplied,
      errors: errors.length > 0 ? errors : undefined,
      message: `Applied ${applied}/${fixes.length} fixes. Total CAMLY adjusted: ${totalDiffApplied}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Recalculate error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
