import { useState, useEffect } from "react";
import { Globe, Link, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { supabase } from "@/integrations/supabase/client";

interface EditPlaylistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: {
    id: string;
    name: string;
    description: string | null;
    is_public: boolean | null;
  };
  onUpdated?: () => void;
}

export function EditPlaylistModal({
  open,
  onOpenChange,
  playlist,
  onUpdated,
}: EditPlaylistModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && playlist) {
      setName(playlist.name);
      setDescription(playlist.description || "");
      // Map is_public to visibility
      if (playlist.is_public === true) {
        setVisibility("public");
      } else if (playlist.is_public === false) {
        setVisibility("private");
      } else {
        setVisibility("unlisted");
      }
    }
  }, [open, playlist]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề danh sách phát",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      // Map visibility to is_public
      const is_public = visibility === "public" ? true : visibility === "private" ? false : null;

      const { error } = await supabase
        .from("playlists")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          is_public,
        })
        .eq("id", playlist.id);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã cập nhật danh sách phát",
      });

      onOpenChange(false);
      onUpdated?.();
    } catch (error: any) {
      console.error("Error updating playlist:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật danh sách phát",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa danh sách phát</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title input */}
          <div className="space-y-2">
            <Label htmlFor="edit-playlist-name">Tiêu đề</Label>
            <Input
              id="edit-playlist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tiêu đề..."
            />
          </div>

          {/* Description input */}
          <div className="space-y-2">
            <Label htmlFor="edit-playlist-description">Mô tả</Label>
            <Textarea
              id="edit-playlist-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả..."
              rows={3}
            />
          </div>

          {/* Visibility select */}
          <div className="space-y-2">
            <Label>Chế độ hiển thị</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as "public" | "unlisted" | "private")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>Công khai</span>
                  </div>
                </SelectItem>
                <SelectItem value="unlisted">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    <span>Không công khai</span>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Riêng tư</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
