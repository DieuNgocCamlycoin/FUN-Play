
-- Create the missing trigger for video reports
CREATE TRIGGER on_video_report_inserted
  AFTER INSERT ON public.video_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_video_report();
