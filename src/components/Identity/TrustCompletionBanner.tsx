/**
 * TrustCompletionBanner — banner đầu trang Profile (chỉ own profile)
 * Tự ẩn khi user đã có ≥2 guardian.
 */
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTrustCompletion } from '@/hooks/useTrustCompletion';
import { useState } from 'react';

interface Props { userId: string; }

export function TrustCompletionBanner({ userId }: Props) {
  const { loading, isComplete, hasPrimary, hasWallet, guardianCount } = useTrustCompletion(userId);
  const [dismissed, setDismissed] = useState(false);

  if (loading || isComplete || dismissed) return null;

  const steps = [
    { done: hasPrimary, label: 'Email/Phone' },
    { done: hasWallet, label: 'Ví' },
    { done: guardianCount >= 2, label: `Guardian ${guardianCount}/2` },
  ];
  const completed = steps.filter(s => s.done).length;

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 mt-4">
      <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 p-4">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="rounded-full bg-primary/20 p-2.5 shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">
                Hoàn tất Định danh & Trust ({completed}/3)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mở khoá mint full FUN, vote governance, tránh sandbox cap.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {steps.map(s => (
                  <span
                    key={s.label}
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      s.done
                        ? 'bg-primary/15 border-primary/40 text-primary'
                        : 'bg-muted border-border text-muted-foreground'
                    }`}
                  >
                    {s.done ? '✓' : '○'} {s.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link to="/identity">
              Hoàn tất ngay <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
