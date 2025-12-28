import { motion } from "framer-motion";
import { Play, Clock, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getDefaultThumbnail } from "@/lib/defaultThumbnails";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string;
  duration: number | null;
  view_count: number | null;
  channel_id: string;
  user_id: string;
}

interface MeditationVideoGridProps {
  videos: Video[];
  isLoading: boolean;
  onVideoSelect: (video: Video) => void;
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatViews = (views: number | null) => {
  if (!views) return "0";
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
};

export const MeditationVideoGrid = ({ videos, isLoading, onVideoSelect }: MeditationVideoGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-video w-full bg-slate-800" />
            <Skeleton className="h-4 w-3/4 bg-slate-800" />
            <Skeleton className="h-3 w-1/2 bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
          <Play className="w-12 h-12 text-cyan-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-200 mb-2">
          Chưa có video thiền định
        </h3>
        <p className="text-slate-400 max-w-md mx-auto">
          Hãy upload video thiền định đầu tiên của bạn! Nhấn nút "Create" → "Upload video thiền định & chữa lành"
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video, index) => (
        <motion.div
          key={video.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onVideoSelect(video)}
          className="group cursor-pointer"
        >
          {/* Thumbnail Container with Glow */}
          <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-xl blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-500" />

            {/* Thumbnail Image */}
            <img
              src={video.thumbnail_url || getDefaultThumbnail(video.id)}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <motion.div
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-8 h-8 text-white fill-white" />
              </motion.div>
            </div>

            {/* Duration Badge */}
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(video.duration)}
            </div>

            {/* Meditation Badge */}
            <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-cyan-500/80 to-purple-500/80 rounded-full text-xs text-white">
              ✨ Thiền định
            </div>
          </div>

          {/* Video Info */}
          <div className="space-y-1">
            <h3 className="text-slate-200 font-medium line-clamp-2 group-hover:text-cyan-300 transition-colors">
              {video.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Eye className="w-3 h-3" />
              <span>{formatViews(video.view_count)} lượt xem</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
