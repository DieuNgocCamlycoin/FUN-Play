import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MentionUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface UseMentionSearchReturn {
  results: MentionUser[];
  loading: boolean;
  searchUsers: (query: string) => void;
  clearResults: () => void;
}

export function useMentionSearch(): UseMentionSearchReturn {
  const [results, setResults] = useState<MentionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const searchUsers = useCallback((query: string) => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Clear results if query is empty or too short
    if (!query || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Debounce search by 300ms
    debounceRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
          .limit(8);

        if (error) throw error;

        setResults(data || []);
      } catch (error) {
        console.error("Error searching users:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const clearResults = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setResults([]);
    setLoading(false);
  }, []);

  return {
    results,
    loading,
    searchUsers,
    clearResults,
  };
}
