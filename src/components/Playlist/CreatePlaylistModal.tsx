import { useState } from "react";
import { Globe, Link, Lock, Loader2, ChevronDown, Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { cn } from "@/lib/utils";

interface CreatePlaylistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (playlistId: string) => void;
  /** Optional: if provided, will auto-add this video to the new playlist */
  videoIdToAdd?: string;
}

export function CreatePlaylistModal({
  open,
  onOpenChange,
  onCreated,
  videoIdToAdd,
}: CreatePlaylistModalProps) {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [visibilityDrawerOpen, setVisibilityDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { lightTap } = useHapticFeedback();

  const getVisibilityDisplay = () => {
    switch (visibility) {
      case "public":
        return { icon: Globe, text: "Công khai" };
      case "unlisted":
        return { icon: Link, text: "Không công khai" };
      case "private":
        return { icon: Lock, text: "Riêng tư" };
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề danh sách phát",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Lỗi",
        description: "Bạn cần đăng nhập để tạo danh sách phát",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      // Map visibility to is_public: public=true, private=false, unlisted=null
      const is_public = visibility === "public" ? true : visibility === "private" ? false : null;

      // Create the playlist
      const { data: playlist, error } = await supabase
        .from("playlists")
        .insert({
          user_id: user.id,
          name: name.trim(),
          is_public,
        })
        .select("id")
        .single();

      if (error) throw error;

      // If videoIdToAdd is provided, add the video to the new playlist
      if (videoIdToAdd && playlist) {
        await supabase.from("playlist_videos").insert({
          playlist_id: playlist.id,
          video_id: videoIdToAdd,
          position: 0,
        });
      }

      toast({
        title: "Thành công",
        description: "Danh sách phát đã được tạo",
      });

      // Reset form
      setName("");
      setVisibility("public");
      onOpenChange(false);
      onCreated?.(playlist.id);
    } catch (error: any) {
      console.error("Error creating playlist:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo danh sách phát",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setName("");
      setVisibility("public");
      onOpenChange(false);
    }
  };

  const handleVisibilitySelect = (value: "public" | "unlisted" | "private") => {
    lightTap();
    setVisibility(value);
    setVisibilityDrawerOpen(false);
  };

  const VisibilityIcon = getVisibilityDisplay().icon;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Danh sách phát mới</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title input */}
            <div className="space-y-2">
              <Label htmlFor="playlist-name">Tiêu đề</Label>
              <Input
                id="playlist-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tiêu đề..."
                autoFocus
              />
            </div>

            {/* Visibility button - opens drawer */}
            <div className="space-y-2">
              <Label>Chế độ hiển thị</Label>
              <button
                type="button"
                onClick={() => setVisibilityDrawerOpen(true)}
                className="w-full flex items-center justify-between border border-input rounded-md px-3 py-2 text-left bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <div className="flex items-center gap-2">
                  <VisibilityIcon className="h-4 w-4" />
                  <span>{getVisibilityDisplay().text}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleClose} disabled={saving}>
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={saving || !name.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tạo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Visibility Drawer (Bottom Sheet) - Fixed to float properly */}
      <Drawer open={visibilityDrawerOpen} onOpenChange={setVisibilityDrawerOpen}>
        <DrawerContent className="max-h-[85vh] rounded-t-[20px]">
          {/* Header với back button */}
          <DrawerHeader className="flex flex-row items-center gap-2 pb-2">
            <button
              type="button"
              onClick={() => {
                lightTap();
                setVisibilityDrawerOpen(false);
              }}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <DrawerTitle className="flex-1">Đặt chế độ hiển thị</DrawerTitle>
          </DrawerHeader>

          <div className="p-4 space-y-2 pb-8 overflow-y-auto">
            {/* Công khai - với gradient glow khi selected */}
            <button
              type="button"
              onClick={() => handleVisibilitySelect("public")}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200",
                visibility === "public" 
                  ? "bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 ring-2 ring-cyan-500/30" 
                  : "hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2.5 rounded-full transition-all",
                  visibility === "public" 
                    ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white" 
                    : "bg-muted"
                )}>
                  <Globe className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Công khai</p>
                  <p className="text-sm text-muted-foreground">Mọi người có thể tìm kiếm và xem</p>
                </div>
              </div>
              {visibility === "public" && (
                <Check className="h-5 w-5 text-cyan-500" />
              )}
            </button>
            
            {/* Không công khai */}
            <button
              type="button"
              onClick={() => handleVisibilitySelect("unlisted")}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200",
                visibility === "unlisted" 
                  ? "bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 ring-2 ring-purple-500/30" 
                  : "hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2.5 rounded-full transition-all",
                  visibility === "unlisted" 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                    : "bg-muted"
                )}>
                  <Link className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Không công khai</p>
                  <p className="text-sm text-muted-foreground">Bất kỳ ai có đường dẫn liên kết đều có thể xem</p>
                </div>
              </div>
              {visibility === "unlisted" && (
                <Check className="h-5 w-5 text-purple-500" />
              )}
            </button>
            
            {/* Riêng tư */}
            <button
              type="button"
              onClick={() => handleVisibilitySelect("private")}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200",
                visibility === "private" 
                  ? "bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 ring-2 ring-pink-500/30" 
                  : "hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2.5 rounded-full transition-all",
                  visibility === "private" 
                    ? "bg-gradient-to-r from-pink-500 to-cyan-500 text-white" 
                    : "bg-muted"
                )}>
                  <Lock className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Riêng tư</p>
                  <p className="text-sm text-muted-foreground">Chỉ bạn mới có thể xem</p>
                </div>
              </div>
              {visibility === "private" && (
                <Check className="h-5 w-5 text-pink-500" />
              )}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
