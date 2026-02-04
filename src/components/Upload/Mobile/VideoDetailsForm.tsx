import { useState } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Globe,
  Link2,
  ChevronRight,
  FileText,
  Image,
  Upload,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VideoDetailsFormProps {
  metadata: {
    title: string;
    description: string;
    visibility: "public" | "unlisted" | "private";
  };
  thumbnailPreview: string | null;
  onEditVisibility: () => void;
  onEditDescription: () => void;
  onEditThumbnail: () => void;
  onTitleChange: (title: string) => void;
  onUpload: () => void;
}

const VISIBILITY_LABELS = {
  public: { label: "Công khai", icon: Globe, color: "text-green-600" },
  unlisted: { label: "Không công khai", icon: Link2, color: "text-yellow-600" },
  private: { label: "Riêng tư", icon: Lock, color: "text-muted-foreground" },
};

export function VideoDetailsForm({
  metadata,
  thumbnailPreview,
  onEditVisibility,
  onEditDescription,
  onEditThumbnail,
  onTitleChange,
  onUpload,
}: VideoDetailsFormProps) {
  const { user } = useAuth();
  const { lightTap, mediumTap } = useHapticFeedback();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const visibilityInfo = VISIBILITY_LABELS[metadata.visibility];
  const VisibilityIcon = visibilityInfo.icon;

  const handleUpload = () => {
    if (!metadata.title.trim()) {
      return;
    }
    setIsUploading(true);
    mediumTap();
    onUpload();
  };

  const menuItems = [
    {
      id: "visibility",
      icon: VisibilityIcon,
      iconColor: visibilityInfo.color,
      label: "Chế độ hiển thị",
      value: visibilityInfo.label,
      onClick: onEditVisibility,
    },
    {
      id: "description",
      icon: FileText,
      iconColor: "text-muted-foreground",
      label: "Thêm nội dung mô tả",
      value: metadata.description ? metadata.description.slice(0, 30) + "..." : null,
      onClick: onEditDescription,
    },
    {
      id: "thumbnail",
      icon: Image,
      iconColor: "text-muted-foreground",
      label: "Thumbnail",
      value: thumbnailPreview ? "Đã chọn" : null,
      preview: thumbnailPreview,
      onClick: onEditThumbnail,
    },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Channel Info */}
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <Avatar className="w-10 h-10">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--cosmic-cyan)/0.3)] to-[hsl(var(--cosmic-magenta)/0.3)]">
            {profile?.display_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{profile?.display_name || "Kênh của bạn"}</p>
          <p className="text-sm text-muted-foreground">@{profile?.username || "user"}</p>
        </div>
      </div>

      {/* Title Input */}
      <div className="p-4 border-b border-border">
        <Input
          value={metadata.title}
          onChange={(e) => {
            lightTap();
            onTitleChange(e.target.value);
          }}
          placeholder="Tạo tiêu đề..."
          maxLength={100}
          className="text-lg font-semibold border-0 border-b-2 rounded-none px-0 focus-visible:ring-0 focus-visible:border-[hsl(var(--cosmic-cyan))] bg-transparent min-h-[48px]"
        />
        <p className="text-xs text-muted-foreground mt-2 text-right">
          {metadata.title.length}/100
        </p>
      </div>

      {/* Menu Items */}
      <div className="flex-1">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03, duration: 0.15 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                lightTap();
                item.onClick();
              }}
              className="w-full flex items-center gap-4 p-4 border-b border-border/50 active:bg-muted/50 transition-colors min-h-[64px] touch-manipulation"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                <Icon className={cn("w-5 h-5", item.iconColor)} />
              </div>

              {/* Label & Value */}
              <div className="flex-1 text-left">
                <p className="font-medium">{item.label}</p>
                {item.value && (
                  <p className="text-sm text-muted-foreground truncate">{item.value}</p>
                )}
              </div>

              {/* Thumbnail Preview */}
              {item.preview && (
                <div className="w-16 h-10 rounded-lg overflow-hidden border border-border">
                  <img src={item.preview} alt="Thumbnail" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Chevron */}
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          );
        })}
      </div>

      {/* Upload Button */}
      <div className="p-4 border-t border-border bg-background sticky bottom-0 pb-safe">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleUpload}
          disabled={!metadata.title.trim() || isUploading}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 min-h-[56px] relative overflow-hidden transition-opacity touch-manipulation",
            metadata.title.trim() && !isUploading
              ? "bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] to-[hsl(var(--cosmic-magenta))] shadow-lg shadow-[hsl(var(--cosmic-cyan)/0.3)] active:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {metadata.title.trim() && !isUploading && (
            <motion.div
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          )}
          <span className="relative z-10 flex items-center gap-2 text-lg">
            {isUploading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                Đang tải lên...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Tải lên
              </>
            )}
          </span>
        </motion.button>

        {!metadata.title.trim() && (
          <p className="text-xs text-destructive text-center mt-2">
            Vui lòng nhập tiêu đề video
          </p>
        )}
      </div>
    </div>
  );
}
