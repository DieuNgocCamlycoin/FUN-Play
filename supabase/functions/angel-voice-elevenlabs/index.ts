import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎤 Generating Angel baby voice with ElevenLabs for:', text.substring(0, 50));

    // Use Charlotte voice (young female) with baby-like settings
    const voiceId = 'XB0fDUnXU5powFXDhCwa'; // Charlotte - young, sweet voice
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.3, // Lower stability = more expressive/playful
            similarity_boost: 0.8,
            style: 0.7, // Higher style = more baby-like enthusiasm
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('ElevenLabs API error:', error);
      return new Response(
        JSON.stringify({ error: error.detail || 'Failed to generate voice' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ ElevenLabs baby voice generated successfully');

    // Return audio stream directly
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Angel ElevenLabs voice error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
