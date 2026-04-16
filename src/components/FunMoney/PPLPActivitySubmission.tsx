/**
 * PPLP Activity Submission Form — Phase 6 UI
 * Allows users to submit activities from multiple platforms
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, Link, Globe, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityPlatform, ActivityType } from '@/lib/fun-money/pplp-engine-v2';

const PLATFORMS: { value: ActivityPlatform; label: string; emoji: string }[] = [
  { value: 'facebook', label: 'Facebook', emoji: '📘' },
  { value: 'telegram', label: 'Telegram', emoji: '✈️' },
  { value: 'youtube', label: 'YouTube', emoji: '▶️' },
  { value: 'zoom', label: 'Zoom', emoji: '📹' },
  { value: 'internal', label: 'FUN Play', emoji: '🌟' },
];

const ACTIVITY_TYPES: { value: ActivityType; label: string; emoji: string }[] = [
  { value: 'post', label: 'Bài đăng', emoji: '📝' },
  { value: 'livestream', label: 'Livestream', emoji: '🔴' },
  { value: 'comment', label: 'Bình luận', emoji: '💬' },
  { value: 'donation', label: 'Quyên góp', emoji: '💝' },
  { value: 'coaching', label: 'Coaching', emoji: '🎓' },
  { value: 'volunteer', label: 'Tình nguyện', emoji: '🤝' },
  { value: 'meditation', label: 'Thiền định', emoji: '🧘' },
  { value: 'sharing', label: 'Chia sẻ', emoji: '🔗' },
];

interface PPLPActivitySubmissionProps {
  userId: string;
}

export const PPLPActivitySubmission = ({ userId }: PPLPActivitySubmissionProps) => {
  const { toast } = useToast();
  const [platform, setPlatform] = useState<ActivityPlatform>('internal');
  const [activityType, setActivityType] = useState<ActivityType>('post');
  const [content, setContent] = useState('');
  const [proofLink, setProofLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({ title: 'Vui lòng nhập nội dung', variant: 'destructive' });
      return;
    }
    if (!proofLink.trim()) {
      toast({ title: 'Cần bằng chứng (Rule #1: No Proof → No Score)', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('pplp_activity_submissions')
        .insert({
          user_id: userId,
          activity_type: activityType,
          platform,
          content: content.trim(),
          proof_link: proofLink.trim(),
          proof_status: 'pending',
        });

      if (error) throw error;

      setSubmitted(true);
      setContent('');
      setProofLink('');
      toast({ title: '✅ Đã gửi! AI sẽ phân tích hành động của bạn.' });

      setTimeout(() => setSubmitted(false), 3000);
    } catch (err: any) {
      toast({ title: 'Lỗi khi gửi', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          Gửi hoạt động PPLP
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Gửi hoạt động từ bất kỳ nền tảng nào — AI sẽ đánh giá giá trị thật
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nền tảng</label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as ActivityPlatform)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.emoji} {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Loại hoạt động</label>
            <Select value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map(a => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.emoji} {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Nội dung</label>
          <Textarea
            placeholder="Mô tả hành động của bạn..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="text-sm min-h-[80px] resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Link className="h-3 w-3" /> Bằng chứng (bắt buộc)
          </label>
          <Input
            placeholder="https://facebook.com/post/..."
            value={proofLink}
            onChange={(e) => setProofLink(e.target.value)}
            className="text-sm h-9"
          />
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Rule #1: Không có bằng chứng → Không có điểm
          </p>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 py-2"
            >
              <CheckCircle className="h-4 w-4" />
              Đã gửi thành công!
            </motion.div>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !content.trim() || !proofLink.trim()}
              className="w-full"
              size="sm"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang gửi...</>
              ) : (
                <><Globe className="h-4 w-4 mr-2" /> Gửi để AI phân tích</>
              )}
            </Button>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
