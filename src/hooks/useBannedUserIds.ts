import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Fetch banned user IDs as a Set, cached for 5 minutes */
export function useBannedUserIds() {
  const { data: bannedIds = new Set<string>() } = useQuery({
    queryKey: ["banned-user-ids"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("banned", true);
      return new Set<string>(data?.map((p) => p.id) || []);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  return bannedIds;
}

/** Standalone fetch for use outside React components */
export async function fetchBannedUserIds(): Promise<Set<string>> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("banned", true);
  return new Set<string>(data?.map((p) => p.id) || []);
}
