import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfilePostsTab } from "./ProfilePostsTab";
import { ProfileVideosTab } from "./ProfileVideosTab";
import { ProfilePlaylistsTab } from "./ProfilePlaylistsTab";
import { FileText, Video, Zap, Radio, ListMusic } from "lucide-react";
import { motion } from "framer-motion";

interface ProfileTabsProps {
  userId: string;
  channelId?: string;
  isOwnProfile: boolean;
}

export const ProfileTabs = ({ userId, channelId, isOwnProfile }: ProfileTabsProps) => {
  const [activeTab, setActiveTab] = useState("posts");

  const tabs = [
    { id: "posts", label: "Bài viết", icon: FileText },
    { id: "videos", label: "Video", icon: Video },
    { id: "shorts", label: "Shorts", icon: Zap },
    { id: "livestream", label: "Livestream", icon: Radio },
    { id: "playlists", label: "Playlist", icon: ListMusic },
  ];

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
      </Tabs>
    </motion.div>
  );
};
