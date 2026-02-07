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
        {/* Tabs List with Gradient Background */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[hsl(var(--cosmic-cyan))]/10 via-[hsl(var(--cosmic-purple))]/10 to-[hsl(var(--cosmic-magenta))]/10 blur-sm" />
          <TabsList className="relative w-full justify-start gap-1 h-auto p-1.5 bg-gradient-to-r from-[hsl(var(--cosmic-cyan))]/5 via-[hsl(var(--cosmic-purple))]/5 to-[hsl(var(--cosmic-magenta))]/5 border border-[hsl(var(--cosmic-cyan))]/20 rounded-xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-purple))] to-[hsl(var(--cosmic-magenta))] text-white shadow-[0_0_20px_rgba(0,231,255,0.4)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/50"
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
