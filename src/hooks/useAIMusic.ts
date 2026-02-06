import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface AIMusic {
  id: string;
  title: string;
  lyrics: string | null;
  style: string;
  voice_type: string;
  instrumental: boolean;
  audio_url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  status: string;
  is_public: boolean;
  play_count: number;
  like_count: number;
  created_at: string;
  user_id: string;
  prompt: string | null;
  error_message?: string | null;
}

export interface CreateSunoMusicInput {
  title: string;
  prompt?: string;
  lyrics?: string;
  style: string;
  instrumental: boolean;
  is_public?: boolean;
}

export function useAIMusic() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: myMusic, isLoading: isLoadingMyMusic, refetch: refetchMyMusic } = useQuery({
    queryKey: ["my-ai-music", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("ai_generated_music")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as AIMusic[];
    },
    enabled: !!user?.id,
    refetchInterval: (query) => {
      const data = query.state.data as AIMusic[] | undefined;
      const hasPending = data?.some(m => m.status === "pending" || m.status === "processing");
      return hasPending ? 5000 : false;
    }
  });

  const { data: publicMusic, isLoading: isLoadingPublic } = useQuery({
    queryKey: ["public-ai-music"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_generated_music")
        .select("*")
        .eq("is_public", true)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as AIMusic[];
    },
  });

  const generateLyricsMutation = useMutation({
    mutationFn: async (params: { description: string; style: string; title: string }) => {
      const { data, error } = await supabase.functions.invoke("generate-lyrics", {
        body: params,
      });
      if (error) throw error;
      if (!data?.lyrics) throw new Error("No lyrics generated");
      return data.lyrics as string;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (musicId: string) => {
      const { error } = await supabase
        .from("ai_generated_music")
        .delete()
        .eq("id", musicId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-ai-music"] });
      toast.success("Đã xóa bài hát");
    },
  });

  const togglePublicMutation = useMutation({
    mutationFn: async ({ musicId, isPublic }: { musicId: string; isPublic: boolean }) => {
      const { error } = await supabase
        .from("ai_generated_music")
        .update({ is_public: isPublic })
        .eq("id", musicId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["my-ai-music"] });
      queryClient.invalidateQueries({ queryKey: ["public-ai-music"] });
      toast.success(variables.isPublic ? "Bài hát đã được công khai" : "Bài hát đã chuyển sang riêng tư");
    },
  });

  const createSunoMutation = useMutation({
    mutationFn: async (input: CreateSunoMusicInput) => {
      if (!user?.id) throw new Error("User not authenticated");

      // @ts-ignore - table is newly created, types not yet regenerated
      const { data, error } = await supabase
        .from("ai_generated_music")
        .insert({
          title: input.title,
          lyrics: input.lyrics || null,
          style: input.style,
          voice_type: input.instrumental ? "instrumental" : "vocal",
          instrumental: input.instrumental,
          is_public: input.is_public ?? false,
          prompt: input.prompt || null,
          user_id: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Fire and forget - trigger generation
      supabase.functions.invoke("generate-suno-music", {
        body: {
          musicId: (data as Record<string, unknown>).id,
          title: input.title,
          prompt: input.prompt,
          lyrics: input.lyrics,
          style: input.style,
          instrumental: input.instrumental,
        },
      });

      return data as unknown as AIMusic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-ai-music"] });
      toast.success("🌟 Đang tạo bài hát với Fun Music AI... Vui lòng đợi 1-3 phút");
    },
    onError: (error) => {
      console.error("Create Suno music error:", error);
      toast.error("Không thể tạo bài hát. Vui lòng thử lại.");
    },
  });

  const incrementPlayCount = async (musicId: string) => {
    try {
      const music = myMusic?.find(m => m.id === musicId);
      if (music) {
        await supabase
          .from("ai_generated_music")
          .update({ play_count: (music.play_count || 0) + 1 })
          .eq("id", musicId);
      }
    } catch (error) {
      console.error("Failed to increment play count:", error);
    }
  };

  return {
    myMusic,
    publicMusic,
    isLoadingMyMusic,
    isLoadingPublic,
    createSunoMusic: createSunoMutation.mutateAsync,
    isCreatingSuno: createSunoMutation.isPending,
    generateLyrics: generateLyricsMutation.mutateAsync,
    isGeneratingLyrics: generateLyricsMutation.isPending,
    deleteMusic: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    togglePublic: togglePublicMutation.mutateAsync,
    incrementPlayCount,
    refetchMyMusic,
  };
}
