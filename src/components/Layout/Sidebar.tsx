import { Home, Zap, Users, Library, History, Video, Clock, ThumbsUp, Wallet, ListVideo, FileText, Tv, Trophy, Coins, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Zap, label: "Shorts", href: "/shorts" },
  { icon: Users, label: "Subscriptions", href: "/subscriptions" },
];

const libraryItems = [
  { icon: Library, label: "Library", href: "/library" },
  { icon: History, label: "History", href: "/history" },
  { icon: Video, label: "Video của bạn", href: "/your-videos" },
  { icon: Clock, label: "Watch later", href: "/watch-later" },
  { icon: ThumbsUp, label: "Liked videos", href: "/liked" },
];

const manageItems = [
  { icon: Tv, label: "Studio", href: "/studio", highlight: true },
  { icon: Tv, label: "Quản lý kênh", href: "/manage-channel" },
  { icon: ListVideo, label: "Danh sách phát", href: "/manage-playlists" },
  { icon: FileText, label: "Bài viết của bạn", href: "/manage-posts" },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (href: string) => {
    navigate(href);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-14 bottom-0 w-64 bg-background border-r border-border z-40 transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <ScrollArea className="h-full">
          <div className="py-2">
            {/* Main navigation */}
            <div className="px-3 py-2">
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-hover-yellow hover:text-primary transition-all duration-300",
                    location.pathname === item.href && "bg-hover-yellow text-primary font-semibold"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>

            <div className="h-px bg-border my-2" />

            {/* Library section */}
            <div className="px-3 py-2">
              {libraryItems.map((item) => {
                const isYourVideos = item.href === "/your-videos";
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      "w-full justify-start gap-6 px-3 py-2.5 h-auto transition-all duration-300",
                      isYourVideos 
                        ? "bg-green-100 dark:bg-green-950 hover:bg-hover-yellow text-green-700 dark:text-green-300 font-bold border-2 border-green-500 shadow-md" 
                        : "hover:bg-hover-yellow hover:text-primary",
                      location.pathname === item.href && !isYourVideos && "bg-hover-yellow text-primary font-semibold",
                      location.pathname === item.href && isYourVideos && "bg-hover-yellow text-primary"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isYourVideos && "text-green-600 dark:text-green-400")} />
                    <span className={cn(isYourVideos && "text-lg")}>{item.label}</span>
                    {isYourVideos && <span className="ml-auto text-xl">📹</span>}
                  </Button>
                );
              })}
            </div>

            <div className="h-px bg-border my-2" />

            {/* Leaderboard section */}
            <div className="px-3 py-2">
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/leaderboard")}
                className={cn(
                  "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-hover-yellow hover:text-primary transition-all duration-300",
                  location.pathname === "/leaderboard" && "bg-hover-yellow text-primary font-semibold"
                )}
              >
                <Trophy className="h-5 w-5 text-yellow-400" />
                <span>Bảng Xếp Hạng</span>
                <span className="ml-auto text-xl">🏆</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/reward-history")}
                className={cn(
                  "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-hover-yellow hover:text-primary transition-all duration-300",
                  location.pathname === "/reward-history" && "bg-hover-yellow text-primary font-semibold"
                )}
              >
                <Coins className="h-5 w-5 text-yellow-400" />
                <span>Lịch Sử Phần Thưởng</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/referral")}
                className={cn(
                  "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-hover-yellow hover:text-primary transition-all duration-300",
                  location.pathname === "/referral" && "bg-hover-yellow text-primary font-semibold"
                )}
              >
                <UserPlus className="h-5 w-5 text-green-400" />
                <span>Giới Thiệu Bạn Bè</span>
              </Button>
            </div>

            <div className="h-px bg-border my-2" />
            <div className="px-3 py-2">
              {manageItems.map((item) => {
                const isStudio = item.href === "/studio";
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      "w-full justify-start gap-6 px-3 py-2.5 h-auto transition-all duration-300",
                      isStudio 
                        ? "bg-gradient-to-r from-primary/10 to-fun-yellow/10 hover:from-primary/20 hover:to-fun-yellow/20 text-primary font-bold border-2 border-primary/30 shadow-lg" 
                        : "hover:bg-hover-yellow hover:text-primary",
                      location.pathname === item.href && !isStudio && "bg-hover-yellow text-primary font-semibold",
                      location.pathname.startsWith(item.href) && isStudio && "from-primary/20 to-fun-yellow/20"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isStudio && "text-primary")} />
                    <span className={cn(isStudio && "text-base font-bold")}>{item.label}</span>
                    {isStudio && <span className="ml-auto text-xl">🎬</span>}
                  </Button>
                );
              })}
            </div>

            <div className="h-px bg-border my-2" />

            {/* Wallet section */}
            <div className="px-3 py-2">
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/wallet")}
                className={cn(
                  "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-hover-yellow hover:text-primary transition-all duration-300",
                  location.pathname === "/wallet" && "bg-hover-yellow text-primary font-semibold"
                )}
              >
                <Wallet className="h-5 w-5 text-fun-yellow" />
                <span>Wallet</span>
              </Button>
            </div>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};
