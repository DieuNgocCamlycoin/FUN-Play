import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DailyUploadStats {
  date: string;
  uploadCount: number;
  uniqueUploaders: number;
  totalFileSize: number;
}

export interface VideoUploadDetail {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  fileSize: number | null;
  duration: number | null;
  viewCount: number;
  createdAt: string;
  category: string | null;
  uploader: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    username: string;
  };
}

export interface UploadSummary {
  totalVideos: number;
  totalFileSize: number;
  todayUploads: number;
  avgFileSizeBytes: number;
  totalUploaders: number;
}

export const useAdminVideoStats = (
  searchQuery: string = "",
  dateFrom: string | null = null,
  dateTo: string | null = null,
  page: number = 1,
  pageSize: number = 20
) => {
  const [videos, setVideos] = useState<VideoUploadDetail[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyUploadStats[]>([]);
  const [summary, setSummary] = useState<UploadSummary>({
    totalVideos: 0,
    totalFileSize: 0,
    todayUploads: 0,
    avgFileSizeBytes: 0,
    totalUploaders: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch summary stats
        const today = new Date().toISOString().split("T")[0];
        
        // Total videos count
        const { count: totalVideos } = await supabase
          .from("videos")
          .select("*", { count: "exact", head: true });

        // Today's uploads
        const { count: todayUploads } = await supabase
          .from("videos")
          .select("*", { count: "exact", head: true })
          .gte("created_at", today);

        // Unique uploaders
        const { data: uniqueUploadersData } = await supabase
          .from("videos")
          .select("user_id");
        
        const uniqueUploaders = new Set(uniqueUploadersData?.map(v => v.user_id) || []).size;

        // Total file size (only from videos that have file_size)
        const { data: fileSizeData } = await supabase
          .from("videos")
          .select("file_size")
          .not("file_size", "is", null);
        
        const totalFileSize = fileSizeData?.reduce((sum, v) => sum + (v.file_size || 0), 0) || 0;
        const avgFileSizeBytes = fileSizeData && fileSizeData.length > 0 
          ? totalFileSize / fileSizeData.length 
          : 0;

        setSummary({
          totalVideos: totalVideos || 0,
          totalFileSize,
          todayUploads: todayUploads || 0,
          avgFileSizeBytes,
          totalUploaders: uniqueUploaders,
        });

        // Fetch daily stats for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: videosForStats } = await supabase
          .from("videos")
          .select("created_at, user_id, file_size")
          .gte("created_at", thirtyDaysAgo.toISOString());

        // Group by date
        const statsMap = new Map<string, { count: number; uploaders: Set<string>; size: number }>();
        
        videosForStats?.forEach(video => {
          const date = video.created_at.split("T")[0];
          if (!statsMap.has(date)) {
            statsMap.set(date, { count: 0, uploaders: new Set(), size: 0 });
          }
          const stat = statsMap.get(date)!;
          stat.count++;
          stat.uploaders.add(video.user_id);
          stat.size += video.file_size || 0;
        });

        // Fill in all 30 days
        const dailyStatsArray: DailyUploadStats[] = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          const stat = statsMap.get(dateStr);
          dailyStatsArray.push({
            date: dateStr,
            uploadCount: stat?.count || 0,
            uniqueUploaders: stat?.uploaders.size || 0,
            totalFileSize: stat?.size || 0,
          });
        }
        setDailyStats(dailyStatsArray);

        // Fetch videos with filters
        let query = supabase
          .from("videos")
          .select(`
            id,
            title,
            description,
            video_url,
            thumbnail_url,
            file_size,
            duration,
            view_count,
            created_at,
            category,
            user_id,
            profiles!videos_user_id_fkey (
              id,
              display_name,
              avatar_url,
              username
            )
          `, { count: "exact" })
          .order("created_at", { ascending: false });

        // Apply search filter
        if (searchQuery) {
          query = query.ilike("title", `%${searchQuery}%`);
        }

        // Apply date filters
        if (dateFrom) {
          query = query.gte("created_at", dateFrom);
        }
        if (dateTo) {
          query = query.lte("created_at", dateTo + "T23:59:59");
        }

        // Apply pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data: videosData, count, error } = await query;

        if (error) {
          console.error("Error fetching videos:", error);
        } else {
          const formattedVideos: VideoUploadDetail[] = (videosData || []).map((video: any) => ({
            id: video.id,
            title: video.title,
            description: video.description,
            videoUrl: video.video_url,
            thumbnailUrl: video.thumbnail_url,
            fileSize: video.file_size,
            duration: video.duration,
            viewCount: video.view_count || 0,
            createdAt: video.created_at,
            category: video.category,
            uploader: {
              id: video.user_id,
              displayName: video.profiles?.display_name,
              avatarUrl: video.profiles?.avatar_url,
              username: video.profiles?.username || "unknown",
            },
          }));
          setVideos(formattedVideos);
          setTotalCount(count || 0);
        }
      } catch (error) {
        console.error("Error in useAdminVideoStats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery, dateFrom, dateTo, page, pageSize]);

  return {
    videos,
    dailyStats,
    summary,
    totalCount,
    loading,
    totalPages: Math.ceil(totalCount / pageSize),
  };
};

// Helper functions
export const formatFileSize = (bytes: number | null): string => {
  if (!bytes || bytes === 0) return "N/A";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export const formatDuration = (seconds: number | null): string => {
  if (!seconds) return "N/A";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};
