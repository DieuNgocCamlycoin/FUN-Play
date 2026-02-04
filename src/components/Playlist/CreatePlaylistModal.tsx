import { useState } from "react";
import { Globe, Link, Lock, Loader2, ChevronDown, Check } from "lucide-react";
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

      {/* Visibility Drawer (Bottom Sheet) */}
      <Drawer open={visibilityDrawerOpen} onOpenChange={setVisibilityDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Đặt chế độ hiển thị</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-1 pb-8">
            {/* Công khai */}
            <button
              type="button"
              onClick={() => { setVisibility("public"); setVisibilityDrawerOpen(false); }}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Công khai</p>
                  <p className="text-sm text-muted-foreground">Mọi người có thể tìm kiếm và xem</p>
                </div>
              </div>
              {visibility === "public" && <Check className="h-5 w-5 text-primary" />}
            </button>
            
            {/* Không công khai */}
            <button
              type="button"
              onClick={() => { setVisibility("unlisted"); setVisibilityDrawerOpen(false); }}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Link className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Không công khai</p>
                  <p className="text-sm text-muted-foreground">Bất kỳ ai có đường dẫn liên kết đều có thể xem</p>
                </div>
              </div>
              {visibility === "unlisted" && <Check className="h-5 w-5 text-primary" />}
            </button>
            
            {/* Riêng tư */}
            <button
              type="button"
              onClick={() => { setVisibility("private"); setVisibilityDrawerOpen(false); }}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Riêng tư</p>
                  <p className="text-sm text-muted-foreground">Chỉ bạn mới có thể xem</p>
                </div>
              </div>
              {visibility === "private" && <Check className="h-5 w-5 text-primary" />}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
