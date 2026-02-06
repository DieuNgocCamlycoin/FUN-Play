import { MainLayout } from "@/components/Layout/MainLayout";
import { useBountySubmissions } from "@/hooks/useBountySubmissions";
import { BountySubmissionForm } from "@/components/Bounty/BountySubmissionForm";
import { BountySubmissionList } from "@/components/Bounty/BountySubmissionList";
import { Rocket } from "lucide-react";

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
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-sapphire))] to-[hsl(var(--cosmic-magenta))] bg-clip-text text-transparent flex items-center gap-3 justify-center md:justify-start">
            <Rocket className="w-8 h-8 text-primary" />
            Build & Bounty
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Đóng góp ý tưởng, báo lỗi, phản hồi hoặc đề xuất tính năng mới cho FUN Play.
            Cộng đồng upvote và Admin sẽ thưởng CAMLY cho những đóng góp tuyệt vời! 🎉
          </p>
        </div>

        {/* Split Layout: 2/3 form + 1/3 list on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Submission Form (3/5 on desktop) */}
          <div className="lg:col-span-3">
            <BountySubmissionForm
              onSubmit={submitContribution}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* Right: Community Submissions (2/5 on desktop) */}
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
