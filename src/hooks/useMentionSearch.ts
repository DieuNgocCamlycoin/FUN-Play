import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MentionUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function useMentionSearch() {
  const [users, setUsers] = useState<MentionUser[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(8);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearUsers = useCallback(() => {
    setUsers([]);
  }, []);

  return { users, loading, searchUsers, clearUsers };
}
