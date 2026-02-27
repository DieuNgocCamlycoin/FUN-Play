import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDailyCheckin, type CheckinMood } from '@/hooks/useDailyCheckin';
import { Sparkles, Flame, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MOODS: { value: CheckinMood; emoji: string; label: string }[] = [
  { value: 'peaceful', emoji: '🕊️', label: 'Bình an' },
  { value: 'grateful', emoji: '🙏', label: 'Biết ơn' },
  { value: 'joyful', emoji: '✨', label: 'Hạnh phúc' },
  { value: 'reflective', emoji: '🪷', label: 'Suy tư' },
  { value: 'hopeful', emoji: '🌅', label: 'Hy vọng' },
  { value: 'compassionate', emoji: '💛', label: 'Từ bi' },
];

export function DailyCheckinWidget() {
  const { todayCheckin, currentStreak, loading, submitting, checkin, hasCheckedInToday } = useDailyCheckin();
  const [selectedMood, setSelectedMood] = useState<CheckinMood | null>(null);
  const [intention, setIntention] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleCheckin = async () => {
    if (!selectedMood) {
      toast.error('Hãy chọn cảm xúc của bạn');
      return;
    }
    const success = await checkin(selectedMood, intention);
    if (success) {
      toast.success('Check-in thành công! ✨', {
        description: 'Ánh sáng của bạn đang lan tỏa 🌟',
      });
      setShowForm(false);
      setSelectedMood(null);
      setIntention('');
    } else {
      toast.error('Bạn đã check-in hôm nay rồi');
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-3 animate-pulse">
        <div className="h-16 bg-muted rounded-lg" />
      </div>
    );
  }

  // Already checked in today - show summary
  if (hasCheckedInToday && todayCheckin) {
    const moodInfo = MOODS.find(m => m.value === todayCheckin.mood);
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/10 p-3"
      >
        <div className="flex items-center gap-2 mb-2">
          <Check className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Đã check-in hôm nay</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{moodInfo?.emoji || '🌟'}</span>
            <span className="text-xs text-muted-foreground">{moodInfo?.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-destructive" />
            <span className="text-xs font-bold text-foreground">{currentStreak} ngày</span>
          </div>
        </div>
        {todayCheckin.intention && (
          <p className="text-[11px] text-muted-foreground mt-2 italic line-clamp-2">
            "{todayCheckin.intention}"
          </p>
        )}
      </motion.div>
    );
  }

  // Not checked in - show CTA or form
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/50 bg-card overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.button
            key="cta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(true)}
            className="w-full p-3 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left group"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">Light Check-in</p>
              <p className="text-[11px] text-muted-foreground">
                {currentStreak > 0 ? `🔥 Streak: ${currentStreak} ngày` : 'Bắt đầu streak hôm nay'}
              </p>
            </div>
          </motion.button>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">Bạn cảm thấy thế nào?</p>
              <button
                onClick={() => { setShowForm(false); setSelectedMood(null); }}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                Đóng
              </button>
            </div>

            {/* Mood Grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {MOODS.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all text-center",
                    "hover:bg-accent/50 border border-transparent",
                    selectedMood === mood.value && "border-primary/40 bg-primary/10 scale-105"
                  )}
                >
                  <span className="text-lg">{mood.emoji}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{mood.label}</span>
                </button>
              ))}
            </div>

            {/* Intention input */}
            <textarea
              value={intention}
              onChange={(e) => setIntention(e.target.value.slice(0, 500))}
              placeholder="Ý định hôm nay... (tùy chọn)"
              rows={2}
              className="w-full text-xs bg-muted/50 border border-border/50 rounded-lg px-2.5 py-2 resize-none placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />

            {/* Submit */}
            <button
              onClick={handleCheckin}
              disabled={!selectedMood || submitting}
              className={cn(
                "w-full py-2 rounded-lg text-xs font-semibold transition-all",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-1.5"
              )}
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Check-in
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
