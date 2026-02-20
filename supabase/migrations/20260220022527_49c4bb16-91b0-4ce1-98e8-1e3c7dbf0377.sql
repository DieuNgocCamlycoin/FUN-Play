
CREATE POLICY "Admins can view all videos"
  ON public.videos FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all videos"
  ON public.videos FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all videos"
  ON public.videos FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
