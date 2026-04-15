import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Find users who signed PPLP charter but never created a mint request
    const { data: idleUsers, error: queryError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .not('pplp_accepted_at', 'is', null)

    if (queryError) throw queryError

    if (!idleUsers || idleUsers.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No idle users found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let sentCount = 0

    for (const user of idleUsers) {
      // Check if user has any mint requests
      const { count: mintCount } = await supabase
        .from('mint_requests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: pplpCount } = await supabase
        .from('pplp_mint_requests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if ((mintCount || 0) > 0 || (pplpCount || 0) > 0) continue

      // Check if reminder already sent
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'system')
        .eq('action_type', 'idle_pplp_reminder')

      if ((notifCount || 0) > 0) continue

      // Send notification
      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'system',
          title: '🌟 Bạn đã sẵn sàng mint FUN!',
          message: 'Bạn đã ký Hiến chương PPLP nhưng chưa tạo yêu cầu mint. Hãy vào trang FUN Money để nhận FUN đầu tiên!',
          link: '/fun-money',
          action_type: 'idle_pplp_reminder',
          is_read: false,
        })

      if (!insertError) sentCount++
    }

    return new Response(
      JSON.stringify({ sent: sentCount, total_idle: idleUsers.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
