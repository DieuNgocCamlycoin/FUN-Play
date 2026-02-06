import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AIMusic } from "./useAIMusic";

export function useAIMusicDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["ai-music-detail", id],
    queryFn: async (): Promise<AIMusic | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("ai_generated_music")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        console.error("Error fetching AI music detail:", error);
        throw error;
      }
      return data as unknown as AIMusic;
    },
    enabled: !!id,
  });
}
