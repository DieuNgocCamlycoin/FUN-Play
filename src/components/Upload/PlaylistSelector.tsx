import { useState, useEffect } from "react";
import { Plus, Globe, Lock, ListVideo, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Playlist {
  id: string;
  name: string;
  is_public: boolean | null;
}

interface PlaylistSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function PlaylistSelector({ selectedIds, onChange }: PlaylistSelectorProps) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("playlists")
        .select("id, name, is_public")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setPlaylists(data || []);
      setLoading(false);
    })();
  }, [user?.id]);

  const togglePlaylist = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((pid) => pid !== id)
        : [...selectedIds, id]
    );
  };

  const handleCreate = async () => {
    if (!newName.trim() || !user?.id || creating) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("playlists")
      .insert({ name: newName.trim(), user_id: user.id, is_public: true })
      .select("id, name, is_public")
      .single();

    if (!error && data) {
      setPlaylists((prev) => [data, ...prev]);
      onChange([...selectedIds, data.id]);
      setNewName("");
      setShowCreate(false);
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ListVideo className="w-4 h-4" />
        Danh sách phát
      </div>

      {/* Playlist list */}
      {playlists.length === 0 && !showCreate && (
        <p className="text-sm text-muted-foreground py-2">
          Chưa có danh sách phát nào. Tạo mới bên dưới!
        </p>
      )}

      <div className="space-y-1 max-h-48 overflow-y-auto">
        {playlists.map((pl) => (
          <motion.label
            key={pl.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors min-h-[48px]",
              selectedIds.includes(pl.id)
                ? "bg-gradient-to-r from-[hsl(var(--cosmic-cyan)/0.1)] to-[hsl(var(--cosmic-magenta)/0.1)] border border-[hsl(var(--cosmic-cyan)/0.3)]"
                : "hover:bg-muted/50"
            )}
          >
            <Checkbox
              checked={selectedIds.includes(pl.id)}
              onCheckedChange={() => togglePlaylist(pl.id)}
            />
            <span className="flex-1 text-sm font-medium truncate">{pl.name}</span>
            {pl.is_public ? (
              <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            )}
          </motion.label>
        ))}
      </div>

      {/* Create new playlist */}
      <AnimatePresence>
        {showCreate ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 items-center">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Tên danh sách phát..."
                className="flex-1 h-10"
                maxLength={100}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="h-10 bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] text-white"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setShowCreate(false); setNewName(""); }}
                className="h-10"
              >
                Hủy
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 text-sm text-[hsl(var(--cosmic-cyan))] hover:text-[hsl(var(--cosmic-cyan)/0.8)] transition-colors py-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Tạo danh sách phát mới
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
