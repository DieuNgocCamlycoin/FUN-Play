import { useState } from "react";
import { Loader2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

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

      // Create the playlist
      const { data: playlist, error } = await supabase
        .from("playlists")
        .insert({
          user_id: user.id,
          name: name.trim(),
          is_public: visibility === "public",
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
      setVisibility("private");
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
      setVisibility("private");
      onOpenChange(false);
    }
  };

  return (
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

          {/* Visibility select */}
          <div className="space-y-2">
            <Label>Chế độ hiển thị</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as "public" | "private")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Riêng tư</SelectItem>
                <SelectItem value="public">Công khai</SelectItem>
              </SelectContent>
            </Select>
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
  );
}
