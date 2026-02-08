import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfilePostsTab } from "./ProfilePostsTab";
import { ProfileVideosTab } from "./ProfileVideosTab";
import { ProfilePlaylistsTab } from "./ProfilePlaylistsTab";
import { FileText, Video, Zap, Radio, ListMusic, Info, Calendar, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface ProfileTabsProps {
  userId: string;
  channelId?: string;
  isOwnProfile: boolean;
}

export const ProfileTabs = ({ userId, channelId, isOwnProfile }: ProfileTabsProps) => {
  const [activeTab, setActiveTab] = useState("posts");

  const [aboutData, setAboutData] = useState<{
    description: string | null;
    created_at: string;
    total_views: number;
    is_verified: boolean;
  } | null>(null);

  const tabs = [
    { id: "posts", label: "Bài viết", icon: FileText },
    { id: "videos", label: "Video", icon: Video },
    { id: "shorts", label: "Shorts", icon: Zap },
    { id: "livestream", label: "Livestream", icon: Radio },
    { id: "playlists", label: "Playlist", icon: ListMusic },
    { id: "about", label: "Giới thiệu", icon: Info },
  ];

  useEffect(() => {
    if (activeTab === "about" && !aboutData) {
      fetchAboutData();
    }
  }, [activeTab, userId]);

  const fetchAboutData = async () => {
    try {
      // Get channel info
      const { data: channelData } = await supabase
        .from("channels")
        .select("description, created_at, is_verified")
        .eq("user_id", userId)
        .maybeSingle();

      // Get total views from all videos
      const { data: viewsData } = await supabase
        .from("videos")
        .select("view_count")
        .eq("user_id", userId)
        .eq("is_public", true);

      const totalViews = viewsData?.reduce((sum, v) => sum + (v.view_count || 0), 0) || 0;

      setAboutData({
        description: channelData?.description || null,
        created_at: channelData?.created_at || new Date().toISOString(),
        total_views: totalViews,
        is_verified: channelData?.is_verified || false,
      });
    } catch (err) {
      console.error("Error fetching about data:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tabs List with Bright Gradient Background */}
        <div className="relative mb-6">
          <TabsList className="relative w-full justify-start gap-2 h-auto p-2 bg-white/90 backdrop-blur-sm border border-sky-200/50 rounded-xl shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-[#00E7FF] via-[#00BFFF] to-[#7A2BFF] text-white shadow-[0_4px_15px_rgba(0,231,255,0.4)]"
                      : "bg-white/80 text-sky-600 hover:text-sky-700 hover:bg-white border border-sky-200/50 hover:border-sky-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Tab Contents */}
        <TabsContent value="posts" className="mt-0">
          <ProfilePostsTab userId={userId} isOwnProfile={isOwnProfile} />
        </TabsContent>

        <TabsContent value="videos" className="mt-0">
          <ProfileVideosTab userId={userId} channelId={channelId} type="video" />
        </TabsContent>

        <TabsContent value="shorts" className="mt-0">
          <ProfileVideosTab userId={userId} channelId={channelId} type="shorts" />
        </TabsContent>

        <TabsContent value="livestream" className="mt-0">
          <div className="text-center py-12">
            <Radio className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có Livestream</h3>
            <p className="text-muted-foreground text-sm">
              Tính năng Livestream sẽ sớm ra mắt! 🎥
            </p>
          </div>
        </TabsContent>

        <TabsContent value="playlists" className="mt-0">
          <ProfilePlaylistsTab userId={userId} isOwnProfile={isOwnProfile} />
        </TabsContent>

        <TabsContent value="about" className="mt-0">
          {aboutData ? (
            <div className="max-w-2xl space-y-6 py-4">
              {/* Description */}
              {aboutData.description && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Mô tả</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{aboutData.description}</p>
                </div>
              )}

              {/* Stats */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Thống kê</h3>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="w-5 h-5" />
                  <span>Tham gia {new Date(aboutData.created_at).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Eye className="w-5 h-5" />
                  <span>{aboutData.total_views.toLocaleString("vi-VN")} lượt xem</span>
                </div>
                {aboutData.is_verified && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    <span>Kênh đã xác minh</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Info className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Đang tải thông tin...</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
