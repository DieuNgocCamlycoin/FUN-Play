import { Home, Zap, Users, Library, History, Video, Clock, ThumbsUp, Wallet, ListVideo, FileText, Tv, Trophy, Coins, UserPlus, Image, Sparkles, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  icon?: any;
  customIcon?: string;
  label: string;
  href: string;
  special?: boolean;
  isWallet?: boolean;
}

const navItems: NavItem[] = [
  { 
    customIcon: '/images/fun-wallet-logo.png',
    label: "FUN Wallet", 
    href: "/fun-wallet", 
    special: true,
    isWallet: true
  },
  { icon: Home, label: "Home", href: "/" },
  { icon: Zap, label: "Shorts", href: "/shorts" },
  { icon: Users, label: "Subscriptions", href: "/subscriptions" },
  { icon: Sparkles, label: "Meditate with Father", href: "/meditate", special: true },
  { icon: Music, label: "Tạo Nhạc Ánh Sáng", href: "/create-music", special: true },
];

const libraryItems = [
  { icon: Library, label: "Library", href: "/library" },
  { icon: History, label: "History", href: "/history" },
  { icon: Video, label: "Video của bạn", href: "/your-videos" },
  { icon: Clock, label: "Watch later", href: "/watch-later" },
  { icon: ThumbsUp, label: "Liked videos", href: "/liked" },
  { icon: Image, label: "NFT Gallery", href: "/nft-gallery" },
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
                    "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-primary/10 hover:text-primary transition-all duration-300",
                    location.pathname === item.href && "bg-primary/10 text-primary font-semibold",
                    item.special && !item.isWallet && "bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-amber-500/10 hover:from-cyan-500/20 hover:via-purple-500/20 hover:to-amber-500/20",
                    item.isWallet && "bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-600/10 hover:from-yellow-500/20 hover:via-orange-500/20 hover:to-yellow-600/20 border border-yellow-500/20"
                  )}
                >
                  {item.customIcon ? (
                    <img 
                      src={item.customIcon} 
                      alt={item.label} 
                      className="h-6 w-6 rounded-full shadow-md"
                    />
                  ) : item.icon ? (
                    <item.icon className={cn("h-5 w-5", item.special && "text-cyan-400")} />
                  ) : null}
                  <span className={cn(
                    item.isWallet && "bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 bg-clip-text text-transparent font-bold",
                    item.special && !item.isWallet && "bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 bg-clip-text text-transparent font-medium"
                  )}>
                    {item.label}
                  </span>
                  {item.isWallet && <span className="ml-auto text-sm">💰</span>}
                  {item.special && !item.isWallet && <span className="ml-auto text-sm">✨</span>}
                </Button>
              ))}
            </div>

            <div className="h-px bg-border my-2" />

            {/* Library section */}
            <div className="px-3 py-2">
              {libraryItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-primary/10 hover:text-primary transition-all duration-300",
                    location.pathname === item.href && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>

            <div className="h-px bg-border my-2" />

            {/* Leaderboard section */}
            <div className="px-3 py-2">
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/leaderboard")}
                className={cn(
                  "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-primary/10 hover:text-primary transition-all duration-300",
                  location.pathname === "/leaderboard" && "bg-primary/10 text-primary font-semibold"
                )}
              >
                <Trophy className="h-5 w-5 text-cosmic-gold" />
                <span>Bảng Xếp Hạng</span>
                <span className="ml-auto text-xl">🏆</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/reward-history")}
                className={cn(
                  "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-primary/10 hover:text-primary transition-all duration-300",
                  location.pathname === "/reward-history" && "bg-primary/10 text-primary font-semibold"
                )}
              >
                <Coins className="h-5 w-5 text-cosmic-gold" />
                <span>Lịch Sử Phần Thưởng</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/referral")}
                className={cn(
                  "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-primary/10 hover:text-primary transition-all duration-300",
                  location.pathname === "/referral" && "bg-primary/10 text-primary font-semibold"
                )}
              >
                <UserPlus className="h-5 w-5 text-green-400" />
                <span>Giới Thiệu Bạn Bè</span>
              </Button>
            </div>

            <div className="h-px bg-border my-2" />
            <div className="px-3 py-2">
              {manageItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-primary/10 hover:text-primary transition-all duration-300",
                    location.pathname === item.href && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>

            <div className="h-px bg-border my-2" />

            {/* Wallet section */}
            <div className="px-3 py-2">
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/wallet")}
                className={cn(
                  "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-primary/10 hover:text-primary transition-all duration-300",
                  location.pathname === "/wallet" && "bg-primary/10 text-primary font-semibold"
                )}
              >
                <Wallet className="h-5 w-5 text-cosmic-gold" />
                <span>Wallet</span>
              </Button>
            </div>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};
