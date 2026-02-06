import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export type ContributionType = "idea" | "feedback" | "bug" | "feature";

export interface BountySubmission {
  id: string;
  user_id: string | null;
  name: string | null;
  title: string;
  description: string;
  category: string;
  contribution_type: string;
  contact_info: string | null;
  image_url: string | null;
  status: string;
  reward_amount: number;
  upvote_count: number;
  admin_note: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SubmitContributionArgs {
  name?: string;
  contactInfo?: string;
  contributionType: ContributionType;
  title: string;
  description: string;
  imageUrl?: string;
}

export function useBountySubmissions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch public submissions (approved/rewarded, sorted by upvotes)
  const {
    data: submissions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bounty-submissions-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bounty_submissions")
        .select("*")
        .in("status", ["approved", "rewarded"])
        .order("upvote_count", { ascending: false });
      if (error) throw error;
      return data as BountySubmission[];
    },
  });

  // Fetch which submissions the current user has upvoted
  const { data: userUpvotes = [] } = useQuery({
    queryKey: ["bounty-user-upvotes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("bounty_upvotes")
        .select("submission_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((u: any) => u.submission_id as string);
    },
    enabled: !!user,
  });

  // Submit a new contribution
  const submitMutation = useMutation({
    mutationFn: async (args: SubmitContributionArgs) => {
      const insertData: any = {
        title: args.title.trim(),
        description: args.description.trim(),
        contribution_type: args.contributionType,
        category: args.contributionType, // keep category in sync
        name: args.name?.trim() || null,
        contact_info: args.contactInfo?.trim() || null,
        image_url: args.imageUrl || null,
        user_id: user?.id || null,
      };

      const { error } = await supabase
        .from("bounty_submissions")
        .insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Gửi thành công! 🎉",
        description: "Đóng góp của bạn đã được ghi nhận. Admin sẽ xem xét sớm.",
      });
      queryClient.invalidateQueries({ queryKey: ["bounty-submissions-public"] });
    },
    onError: (err: any) => {
      toast({
        title: "Lỗi",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Toggle upvote
  const toggleUpvoteMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      if (!user) throw new Error("Bạn cần đăng nhập để upvote");

      const hasUpvoted = userUpvotes.includes(submissionId);

      if (hasUpvoted) {
        const { error } = await supabase
          .from("bounty_upvotes")
          .delete()
          .eq("submission_id", submissionId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bounty_upvotes")
          .insert({ submission_id: submissionId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bounty-submissions-public"] });
      queryClient.invalidateQueries({ queryKey: ["bounty-user-upvotes"] });
    },
    onError: (err: any) => {
      toast({
        title: "Lỗi",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return {
    submissions,
    userUpvotes,
    isLoading,
    error,
    submitContribution: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
    toggleUpvote: toggleUpvoteMutation.mutate,
    isTogglingUpvote: toggleUpvoteMutation.isPending,
  };
}
