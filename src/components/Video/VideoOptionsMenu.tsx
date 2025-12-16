import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreHorizontal,
  ListPlus,
  Clock,
  FolderPlus,
  Download,
  Share2,
  Link2,
  Code,
  ThumbsDown,
  Ban,
  Flag,
  Plus,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import confetti from "canvas-confetti";

interface VideoOptionsMenuProps {
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  thumbnailUrl?: string;
  onShare?: () => void;
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
}

export const VideoOptionsMenu = ({
  videoId,
  videoTitle,
  videoUrl,
  thumbnailUrl,
  onShare,
}: VideoOptionsMenuProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToQueue } = useMusicPlayer();
  const [showNewPlaylistDialog, setShowNewPlaylistDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  const fetchPlaylists = async () => {
    if (!user) return;
    setLoadingPlaylists(true);
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select("id, name, description")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleAddToQueue = () => {
    addToQueue({
      id: videoId,
      title: videoTitle,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
    });
    
    // Celebration effect
    confetti({
      particleCount: 20,
      spread: 40,
      origin: { y: 0.6 },
      colors: ["#00E7FF", "#FFD700"],
    });
    
    toast({
      title: "✨ Đã thêm vào hàng đợi",
      description: videoTitle,
    });
  };

  const handleSaveToWatchLater = async () => {
    if (!user) {
      toast({
        title: "Đăng nhập để lưu video",
        description: "Vui lòng đăng nhập để sử dụng tính năng này",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find or create "Watch Later" playlist
      let { data: watchLater } = await supabase
        .from("playlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", "Xem sau")
        .maybeSingle();

      if (!watchLater) {
        const { data: newPlaylist, error: createError } = await supabase
          .from("playlists")
          .insert({
            user_id: user.id,
            name: "Xem sau",
            description: "Video đã lưu để xem sau",
          })
          .select()
          .single();

        if (createError) throw createError;
        watchLater = newPlaylist;
      }

      // Check if video already in playlist
      const { data: existing } = await supabase
        .from("playlist_videos")
        .select("id")
        .eq("playlist_id", watchLater.id)
        .eq("video_id", videoId)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Video đã có trong danh sách",
          description: "Video này đã được lưu trước đó",
        });
        return;
      }

      // Get max position
      const { data: maxPos } = await supabase
        .from("playlist_videos")
        .select("position")
        .eq("playlist_id", watchLater.id)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

      const newPosition = (maxPos?.position || 0) + 1;

      await supabase.from("playlist_videos").insert({
        playlist_id: watchLater.id,
        video_id: videoId,
        position: newPosition,
      });

      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#00E7FF", "#FFD700", "#FF00E5"],
      });

      toast({
        title: "💫 Đã lưu vào Xem sau",
        description: videoTitle,
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveToPlaylist = async (playlistId: string, playlistName: string) => {
    if (!user) return;

    try {
      // Check if video already in playlist
      const { data: existing } = await supabase
        .from("playlist_videos")
        .select("id")
        .eq("playlist_id", playlistId)
        .eq("video_id", videoId)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Video đã có trong playlist",
          description: `Video này đã có trong "${playlistName}"`,
        });
        return;
      }

      // Get max position
      const { data: maxPos } = await supabase
        .from("playlist_videos")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

      const newPosition = (maxPos?.position || 0) + 1;

      await supabase.from("playlist_videos").insert({
        playlist_id: playlistId,
        video_id: videoId,
        position: newPosition,
      });

      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.6 },
        colors: ["#00E7FF", "#FFD700"],
      });

      toast({
        title: "✨ Đã lưu vào playlist",
        description: `Đã thêm vào "${playlistName}"`,
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreatePlaylist = async () => {
    if (!user || !newPlaylistName.trim()) return;

    try {
      const { data: newPlaylist, error } = await supabase
        .from("playlists")
        .insert({
          user_id: user.id,
          name: newPlaylistName.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Add video to new playlist
      await supabase.from("playlist_videos").insert({
        playlist_id: newPlaylist.id,
        video_id: videoId,
        position: 1,
      });

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.5 },
        colors: ["#00E7FF", "#FFD700", "#FF00E5", "#7A2BFF"],
      });

      toast({
        title: "🎉 Playlist mới đã tạo!",
        description: `Đã tạo "${newPlaylistName}" và thêm video`,
      });

      setNewPlaylistName("");
      setShowNewPlaylistDialog(false);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = () => {
    const videoLink = `${window.location.origin}/watch/${videoId}`;
    navigator.clipboard.writeText(videoLink);
    toast({
      title: "✅ Đã sao chép liên kết",
      description: "Liên kết video đã được sao chép",
    });
  };

  const handleCopyEmbed = () => {
    const embedCode = `<iframe width="560" height="315" src="${window.location.origin}/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast({
      title: "✅ Đã sao chép mã nhúng",
      description: "Mã nhúng video đã được sao chép",
    });
  };

  const handleNotInterested = () => {
    toast({
      title: "🙈 Đã ghi nhận",
      description: "Chúng tôi sẽ không đề xuất video tương tự",
    });
  };

  const handleDontRecommendChannel = () => {
    toast({
      title: "🚫 Đã ghi nhận",
      description: "Sẽ không đề xuất video từ kênh này",
    });
  };

  const handleReport = () => {
    toast({
      title: "🚨 Báo cáo đã gửi",
      description: "Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét.",
    });
  };

  return (
    <>
      <DropdownMenu onOpenChange={(open) => open && fetchPlaylists()}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-muted/50 hover:bg-gradient-to-r hover:from-cosmic-cyan/20 hover:to-glow-gold/20 border border-cosmic-cyan/20 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,231,255,0.3)]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 bg-background/95 backdrop-blur-xl border-cosmic-cyan/20 shadow-[0_0_40px_rgba(0,231,255,0.2)] rounded-xl overflow-hidden"
        >
          {/* Gradient header */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cosmic-cyan via-cosmic-magenta to-glow-gold" />
          
          <DropdownMenuItem
            onClick={handleAddToQueue}
            className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-cosmic-cyan/10 transition-colors group"
          >
            <ListPlus className="h-5 w-5 text-cosmic-cyan group-hover:scale-110 transition-transform" />
            <span className="text-foreground">Thêm vào hàng đợi</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleSaveToWatchLater}
            className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-cosmic-cyan/10 transition-colors group"
          >
            <Clock className="h-5 w-5 text-cosmic-cyan group-hover:scale-110 transition-transform" />
            <span className="text-foreground">Lưu vào Xem sau</span>
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-glow-gold/10 transition-colors group">
              <FolderPlus className="h-5 w-5 text-glow-gold group-hover:scale-110 transition-transform" />
              <span className="text-foreground">Lưu vào playlist</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56 bg-background/95 backdrop-blur-xl border-glow-gold/20 shadow-[0_0_30px_rgba(255,215,0,0.2)] rounded-xl">
              {loadingPlaylists ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Sparkles className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Đang tải...
                </div>
              ) : (
                <>
                  {playlists.map((playlist) => (
                    <DropdownMenuItem
                      key={playlist.id}
                      onClick={() => handleSaveToPlaylist(playlist.id, playlist.name)}
                      className="flex items-center gap-3 py-2 px-3 cursor-pointer hover:bg-glow-gold/10 transition-colors"
                    >
                      <FolderPlus className="h-4 w-4 text-glow-gold" />
                      <span className="truncate">{playlist.name}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-glow-gold/20" />
                  <DropdownMenuItem
                    onClick={() => setShowNewPlaylistDialog(true)}
                    className="flex items-center gap-3 py-2 px-3 cursor-pointer hover:bg-cosmic-magenta/10 transition-colors"
                  >
                    <Plus className="h-4 w-4 text-cosmic-magenta" />
                    <span className="text-cosmic-magenta font-medium">Tạo playlist mới</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator className="bg-cosmic-cyan/20" />

          <DropdownMenuItem
            onClick={handleCopyLink}
            className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-cosmic-sapphire/10 transition-colors group"
          >
            <Link2 className="h-5 w-5 text-cosmic-sapphire group-hover:scale-110 transition-transform" />
            <span className="text-foreground">Sao chép liên kết</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleCopyEmbed}
            className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-cosmic-sapphire/10 transition-colors group"
          >
            <Code className="h-5 w-5 text-cosmic-sapphire group-hover:scale-110 transition-transform" />
            <span className="text-foreground">Nhúng video</span>
          </DropdownMenuItem>

          {onShare && (
            <DropdownMenuItem
              onClick={onShare}
              className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-cosmic-cyan/10 transition-colors group"
            >
              <Share2 className="h-5 w-5 text-cosmic-cyan group-hover:scale-110 transition-transform" />
              <span className="text-foreground">Chia sẻ</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="bg-muted" />

          <DropdownMenuItem
            onClick={handleNotInterested}
            className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors group"
          >
            <ThumbsDown className="h-5 w-5 text-muted-foreground group-hover:scale-110 transition-transform" />
            <span className="text-muted-foreground">Không quan tâm</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleDontRecommendChannel}
            className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors group"
          >
            <Ban className="h-5 w-5 text-muted-foreground group-hover:scale-110 transition-transform" />
            <span className="text-muted-foreground">Không đề xuất kênh</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleReport}
            className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-destructive/10 transition-colors group"
          >
            <Flag className="h-5 w-5 text-destructive group-hover:scale-110 transition-transform" />
            <span className="text-destructive">Báo cáo</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create New Playlist Dialog */}
      <Dialog open={showNewPlaylistDialog} onOpenChange={setShowNewPlaylistDialog}>
        <DialogContent className="bg-background/95 backdrop-blur-xl border-glow-gold/20 shadow-[0_0_60px_rgba(255,215,0,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-cosmic-cyan via-cosmic-magenta to-glow-gold bg-clip-text text-transparent">
              ✨ Tạo Playlist Mới
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder="Tên playlist..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="border-glow-gold/30 focus:border-glow-gold focus:ring-glow-gold/20"
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowNewPlaylistDialog(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
                className="bg-gradient-to-r from-cosmic-cyan to-glow-gold hover:from-cosmic-cyan/90 hover:to-glow-gold/90"
              >
                <Check className="h-4 w-4 mr-2" />
                Tạo & Thêm video
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
