/**
 * PPLP Charter Acceptance Flow
 * Users must read and accept the 5 core PPLP principles before minting FUN
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Shield, Heart, Users, Sparkles, Scale, 
  CheckCircle2, FileText, Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PPLPCharterAcceptanceProps {
  userId: string;
  onAccepted: () => void;
}

const CHARTER_PRINCIPLES = [
  {
    icon: Heart,
    title: 'Hành động Thực — Real Action',
    description: 'Mỗi FUN được tạo ra phải gắn liền với một hành động thực sự trên nền tảng (xem video, bình luận, chia sẻ, sáng tạo nội dung). Không có FUN nào được mint mà không có giá trị đóng góp thực.',
    emoji: '💎',
  },
  {
    icon: Sparkles,
    title: 'Giá trị Thực — Real Value',
    description: 'Chỉ những hoạt động tạo ra giá trị cho cộng đồng mới được thưởng. Spam, nội dung rác, hành vi gian lận sẽ bị phát hiện và không nhận thưởng.',
    emoji: '✨',
  },
  {
    icon: Users,
    title: 'Tác động Tích cực — Positive Impact',
    description: 'Mọi hành động được thưởng phải có tác động tích cực đến hệ sinh thái. Nội dung mang tính xây dựng, hỗ trợ cộng đồng và truyền cảm hứng được đánh giá cao.',
    emoji: '🌱',
  },
  {
    icon: Shield,
    title: 'Không Khai thác — No Exploitation',
    description: 'Nghiêm cấm mọi hình thức khai thác hệ thống: bot tự động, farming hàng loạt, tạo tài khoản giả, thao túng điểm số. Hệ thống Anti-Farm sẽ tự động phát hiện và xử lý.',
    emoji: '🛡️',
  },
  {
    icon: Scale,
    title: 'Tuân thủ Hiến chương — Charter Compliant',
    description: 'Tôi cam kết tuân thủ toàn bộ quy tắc của Proof of Pure Love Protocol. Hiểu rằng FUN Money là phần thưởng cho đóng góp thực sự, không phải công cụ đầu cơ.',
    emoji: '⚖️',
  },
];

export function PPLPCharterAcceptance({ userId, onAccepted }: PPLPCharterAcceptanceProps) {
  const [checked, setChecked] = useState<boolean[]>(new Array(5).fill(false));
  const [finalAgree, setFinalAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allChecked = checked.every(Boolean) && finalAgree;

  const handleAccept = async () => {
    if (!allChecked || submitting) return;
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          pplp_accepted_at: new Date().toISOString(),
          pplp_version: 'v2.0',
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('🎉 Chấp nhận Hiến chương PPLP thành công!', {
        description: 'Bạn đã sẵn sàng mint FUN Money',
      });

      onAccepted();
    } catch (err: any) {
      console.error('[PPLPCharter] Accept error:', err);
      toast.error('Lỗi khi chấp nhận Hiến chương', {
        description: err.message || 'Vui lòng thử lại',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCheck = (index: number) => {
    setChecked(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const checkedCount = checked.filter(Boolean).length;

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            Hiến Chương PPLP
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Constitution v2.0
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Vui lòng đọc và chấp nhận 5 nguyên tắc cốt lõi của <strong>Proof of Pure Love Protocol</strong> để bắt đầu mint FUN Money.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(checkedCount / 5) * 100}%` }}
            />
          </div>
          <span className="font-medium">{checkedCount}/5</span>
        </div>

        {/* 5 Principles */}
        <ScrollArea className="h-[55vh] sm:h-[400px] w-full pr-2">
          <div className="space-y-3 overflow-y-auto touch-pan-y [-webkit-overflow-scrolling:touch]">
            {CHARTER_PRINCIPLES.map((principle, i) => {
              const Icon = principle.icon;
              const isChecked = checked[i];

              return (
                <div
                  key={i}
                  onClick={() => toggleCheck(i)}
                  className={cn(
                    "flex gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200",
                    isChecked
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-muted/30"
                  )}
                >
                  <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleCheck(i)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={cn(
                        "w-4 h-4 shrink-0",
                        isChecked ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="text-sm font-semibold">
                        {principle.emoji} {principle.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {principle.description}
                    </p>
                  </div>
                  {isChecked && (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Final agreement */}
        <div
          onClick={() => setFinalAgree(!finalAgree)}
          className={cn(
            "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
            checkedCount < 5 && "opacity-50 pointer-events-none",
            finalAgree
              ? "border-primary bg-primary/10"
              : "border-dashed border-muted-foreground/30 hover:border-primary/40"
          )}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={finalAgree}
              disabled={checkedCount < 5}
              onCheckedChange={() => setFinalAgree(!finalAgree)}
              className="mt-0.5 data-[state=checked]:bg-primary"
            />
          </div>
          <p className="text-sm font-medium leading-relaxed">
            Tôi đã đọc, hiểu và <strong>cam kết tuân thủ toàn bộ Hiến chương PPLP v2.0</strong>. 
            Tôi hiểu rằng FUN Money là phần thưởng cho đóng góp thực sự và tôi sẽ hành động vì lợi ích chung của cộng đồng.
          </p>
        </div>

        {/* Accept button */}
        <Button
          onClick={handleAccept}
          disabled={!allChecked || submitting}
          className={cn(
            "w-full h-12 text-base font-bold gap-2 transition-all",
            allChecked && !submitting
              ? "bg-gradient-to-r from-primary to-primary/80 hover:scale-[1.01] shadow-lg"
              : "opacity-50"
          )}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Tôi Đồng Ý — Chấp Nhận Hiến Chương PPLP
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
