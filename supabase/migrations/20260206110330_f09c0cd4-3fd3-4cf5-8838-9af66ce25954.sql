
-- Remove overly permissive policy - service role already bypasses RLS
DROP POLICY IF EXISTS "Service role can update any AI music" ON public.ai_generated_music;
