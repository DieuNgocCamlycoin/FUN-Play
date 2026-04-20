/**
 * angel-trust-evaluator — Angel AI chấm trust dùng Lovable AI Gateway
 * Input: user_id
 * Output: { fake_probability, quality_score, tc_adjustment, signals }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Bạn là Angel AI — bộ đánh giá Trust của FUN Ecosystem.
Phân tích hoạt động 30 ngày của user và trả về JSON đúng schema:
{
  "fake_probability": 0..1,    // khả năng tài khoản là bot/farm
  "quality_score": 0..1,       // chất lượng đóng góp tổng thể
  "tc_adjustment": -0.1..0.1,  // gợi ý điều chỉnh Trust Coefficient (cap ±0.1)
  "signals": { "reason": string, "red_flags": string[], "green_flags": string[] }
}
Tiêu chí: tần suất bất thường, lặp pattern, đa dạng nội dung, network organic, thời điểm hoạt động.
Chỉ trả JSON thuần, không markdown.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Gather signals
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const [eventsRes, featuresRes, edgesInRes, edgesOutRes, profileRes] = await Promise.all([
      admin.from('identity_events').select('event_type, created_at, tc_delta, risk_delta')
        .eq('user_id', user_id).gte('created_at', since).limit(200),
      admin.from('features_user_day').select('*')
        .eq('user_id', user_id).gte('date', since.slice(0, 10)).limit(30),
      admin.from('trust_edges').select('from_user_id, weight').eq('to_user_id', user_id),
      admin.from('trust_edges').select('to_user_id, weight').eq('from_user_id', user_id),
      admin.from('profiles').select('created_at, consistency_days, display_name').eq('id', user_id).maybeSingle(),
    ]);

    const summary = {
      account_age_days: profileRes.data?.created_at
        ? Math.floor((Date.now() - new Date(profileRes.data.created_at).getTime()) / 86400000) : 0,
      consistency_days: profileRes.data?.consistency_days ?? 0,
      events_30d: eventsRes.data?.length ?? 0,
      avg_anti_farm_risk: featuresRes.data?.length
        ? featuresRes.data.reduce((s: number, f: any) => s + Number(f.anti_farm_risk || 0), 0) / featuresRes.data.length
        : 0,
      total_posts: featuresRes.data?.reduce((s: number, f: any) => s + (f.count_posts || 0), 0) ?? 0,
      total_videos: featuresRes.data?.reduce((s: number, f: any) => s + (f.count_videos || 0), 0) ?? 0,
      total_comments: featuresRes.data?.reduce((s: number, f: any) => s + (f.count_comments || 0), 0) ?? 0,
      vouches_received: edgesInRes.data?.length ?? 0,
      vouches_given: edgesOutRes.data?.length ?? 0,
      event_types_distribution: countBy(eventsRes.data || [], 'event_type'),
    };

    // Call Lovable AI
    const aiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!aiKey) throw new Error('LOVABLE_API_KEY not set');

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Activity summary:\n${JSON.stringify(summary, null, 2)}` },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      if (aiRes.status === 429) throw new Error('AI rate limit exceeded');
      if (aiRes.status === 402) throw new Error('AI credits exhausted');
      throw new Error(`AI error: ${errText}`);
    }

    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content || '{}';
    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    const fake_probability = clamp01(Number(parsed.fake_probability) || 0);
    const quality_score = clamp01(Number(parsed.quality_score) || 0.5);
    const tc_adjustment = Math.max(-0.1, Math.min(0.1, Number(parsed.tc_adjustment) || 0));
    const signals = parsed.signals || { reason: 'no signals', red_flags: [], green_flags: [] };

    // Persist
    await admin.from('ai_trust_evaluations').insert({
      user_id,
      fake_probability,
      quality_score,
      tc_adjustment,
      signals,
      model: 'google/gemini-2.5-flash',
    });

    return new Response(JSON.stringify({
      user_id, fake_probability, quality_score, tc_adjustment, signals,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('angel-trust-evaluator error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
function countBy(arr: any[], key: string): Record<string, number> {
  const r: Record<string, number> = {};
  for (const a of arr) { const k = a[key]; if (k) r[k] = (r[k] || 0) + 1; }
  return r;
}
