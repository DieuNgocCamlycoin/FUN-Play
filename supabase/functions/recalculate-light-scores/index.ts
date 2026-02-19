import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if this is a single-user request (manual "Update Reputation" button)
    let singleUserId: string | null = null;
    try {
      const body = await req.json();
      singleUserId = body?.user_id || null;
    } catch {
      // No body = cron job mode (batch all users)
    }

    if (singleUserId) {
      // Single user mode - rate limit check
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('last_light_score_update')
        .eq('id', singleUserId)
        .single();

      if (profile?.last_light_score_update) {
        const lastUpdate = new Date(profile.last_light_score_update);
        const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
        if (hoursSinceUpdate < 1) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              reason: `Vui lòng đợi ${Math.ceil(60 - hoursSinceUpdate * 60)} phút nữa` 
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const { data: result } = await adminSupabase.rpc('calculate_user_light_score', { p_user_id: singleUserId });
      
      return new Response(
        JSON.stringify({ success: true, result }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Batch mode: recalculate for all active users (cron job)
    // Get users who were active in last 7 days or never calculated
    const { data: users, error } = await adminSupabase
      .from('profiles')
      .select('id')
      .or('last_light_score_update.is.null,last_light_score_update.lt.' + new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
      .eq('banned', false)
      .limit(500);

    if (error) {
      console.error('Error fetching users:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let updated = 0;
    let errors = 0;

    for (const user of (users || [])) {
      try {
        await adminSupabase.rpc('calculate_user_light_score', { p_user_id: user.id });
        updated++;
      } catch (err) {
        console.error(`Error calculating light score for ${user.id}:`, err);
        errors++;
      }
    }

    console.log(`[recalculate-light-scores] Updated ${updated} users, ${errors} errors`);

    return new Response(
      JSON.stringify({ success: true, updated, errors, total: users?.length || 0 }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Recalculate light scores error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
