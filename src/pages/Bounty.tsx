import { MainLayout } from "@/components/Layout/MainLayout";
import { useBountySubmissions } from "@/hooks/useBountySubmissions";
import { BountySubmissionForm } from "@/components/Bounty/BountySubmissionForm";
import { BountySubmissionList } from "@/components/Bounty/BountySubmissionList";
import { Trophy, Sparkles, Heart, Award } from "lucide-react";

export default function Bounty() {
  const {
    submissions,
    userUpvotes,
    isLoading,
    submitContribution,
    isSubmitting,
    toggleUpvote,
    isTogglingUpvote,
  } = useBountySubmissions();

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-sapphire))] to-[hsl(var(--cosmic-magenta))] bg-clip-text text-transparent">
            Build & Bounty
          </h1>
          <p className="text-muted-foreground text-sm">Cùng xây dựng Fun Play</p>
          <div className="flex items-center justify-center gap-1.5 text-sm">
            <img src="/images/camly-coin.png" alt="CAMLY" className="w-5 h-5" />
            <span className="text-amber-500 font-semibold">Nhận thưởng CAMLY</span>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50/60 px-6 py-4 text-center space-y-1">
          <p className="text-sm text-foreground/80">
            Gửi ý tưởng phát triển, cảm nhận sử dụng, đề xuất tính năng hoặc báo lỗi cho Fun Play.
          </p>
          <p className="text-sm font-semibold bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 bg-clip-text text-transparent">
            Mỗi đóng góp chất lượng sẽ được thưởng Camly Coin (CAMLY) – đồng coin hạnh phúc của hệ sinh thái FUN.
          </p>
        </div>

        {/* Hints Row */}
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-pink-400" />
            <span>Vote cho ý tưởng yêu thích</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Nhận thưởng khi được duyệt</span>
          </div>
        </div>

        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <BountySubmissionForm
              onSubmit={submitContribution}
              isSubmitting={isSubmitting}
            />
          </div>
          <div className="lg:col-span-2">
            <BountySubmissionList
              submissions={submissions}
              userUpvotes={userUpvotes}
              isLoading={isLoading}
              onToggleUpvote={toggleUpvote}
              isTogglingUpvote={isTogglingUpvote}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
