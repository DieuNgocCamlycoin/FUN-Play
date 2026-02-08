import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/Layout/MainLayout";
import { VideoCard } from "@/components/Video/VideoCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon } from "lucide-react";

interface SearchVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number | null;
  created_at: string;
  user_id: string;
  channels: {
    id: string;
    name: string;
  } | null;
}

interface ProfileInfo {
  display_name: string | null;
  username: string;
  avatar_url: string | null;
}

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [localQuery, setLocalQuery] = useState(query);
  const [results, setResults] = useState<(SearchVideo & { profile?: ProfileInfo })[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalQuery(query);
    if (query.trim()) {
      performSearch(query.trim());
    } else {
      setResults([]);
    }
  }, [query]);

  const performSearch = async (q: string) => {
    setLoading(true);
    try {
      // Step 1: Query videos (same pattern as Index.tsx)
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, thumbnail_url, view_count, created_at, user_id, channels(id, name)")
        .eq("is_public", true)
        .eq("approval_status", "approved")
        .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!data || data.length === 0) {
        setResults([]);
        return;
      }

      // Step 2: Fetch profiles separately (same pattern as Index.tsx)
      const userIds = [...new Set(data.map(v => v.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", userIds);

      const profilesMap = new Map(
        profilesData?.map(p => [p.id, { display_name: p.display_name, username: p.username, avatar_url: p.avatar_url }]) || []
      );

      // Step 3: Merge results
      const merged = data.map(video => ({
        ...video,
        profile: profilesMap.get(video.user_id),
      }));

      setResults(merged);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setSearchParams({ q: localQuery.trim() });
    }
  };

  const formatViews = (count: number | null) => {
    if (!count) return "0 lượt xem";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M lượt xem`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K lượt xem`;
    return `${count} lượt xem`;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days > 365) return `${Math.floor(days / 365)} năm trước`;
    if (days > 30) return `${Math.floor(days / 30)} tháng trước`;
    if (days > 0) return `${days} ngày trước`;
    const hours = Math.floor(diff / 3600000);
    if (hours > 0) return `${hours} giờ trước`;
    return "Vừa xong";
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Search input */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative max-w-2xl">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Tìm kiếm video..."
              className="pl-10 h-12 text-base"
            />
          </div>
        </form>

        {/* Results header */}
        {query && (
          <p className="text-muted-foreground mb-4">
            {loading
              ? "Đang tìm kiếm..."
              : `${results.length} kết quả cho "${query}"`}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Results grid */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.map((video) => (
              <VideoCard
                key={video.id}
                videoId={video.id}
                thumbnail={video.thumbnail_url || undefined}
                title={video.title}
                channel={video.profile?.display_name || video.profile?.username || "Unknown"}
                views={formatViews(video.view_count)}
                timestamp={timeAgo(video.created_at)}
                userId={video.user_id}
                channelId={video.channels?.id}
                avatarUrl={video.profile?.avatar_url || undefined}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && query && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SearchIcon className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Không tìm thấy kết quả</h2>
            <p className="text-muted-foreground max-w-md">
              Không tìm thấy video nào phù hợp với "{query}". Hãy thử từ khóa khác.
            </p>
          </div>
        )}

        {/* Initial state */}
        {!query && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SearchIcon className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Tìm kiếm video</h2>
            <p className="text-muted-foreground">Nhập từ khóa để bắt đầu tìm kiếm</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Search;
