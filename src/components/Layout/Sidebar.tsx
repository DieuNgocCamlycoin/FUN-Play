import { useState } from "react";
import { Home, Zap, Users, Library, History, Video, Clock, ThumbsUp, Wallet, ListVideo, FileText, Tv, Trophy, Coins, UserPlus, Image, Sparkles, Music, ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { HonobarSidebarButton } from "./HonobarSidebarButton";
import { HonobarDetailModal } from "./HonobarDetailModal";

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
  isFunMoney?: boolean;
  external?: boolean;
}

const mainNavItems: NavItem[] = [
  { icon: Home, label: "Trang chủ", href: "/" },
  { icon: Zap, label: "Shorts", href: "/shorts" },
  { icon: Users, label: "Kênh đăng ký", href: "/subscriptions" },
  { icon: Sparkles, label: "Thiền cùng Cha", href: "/meditate", special: true },
  { icon: Music, label: "Tạo Nhạc Ánh Sáng", href: "/create-music", special: true },
];

// FUN Platforms - External links + FUN Wallet
const funPlatformItems: NavItem[] = [
  { 
    customIcon: '/images/fun-rich-logo.png?v=2',
    label: "FUN PROFILE", 
    href: "https://fun.rich/",
    external: true
  },
  { 
    customIcon: '/images/fun-farm-logo.png',
    label: "FUN FARM", 
    href: "https://farm.fun.rich/",
    external: true
  },
  { 
    customIcon: '/images/fun-planet-logo.png',
    label: "FUN PLANET", 
    href: "https://planet.fun.rich/?ref=22282B49",
    external: true
  },
];

const libraryItems = [
  { icon: Library, label: "Thư viện", href: "/library" },
  { icon: History, label: "Lịch sử", href: "/history" },
  { icon: Video, label: "Video của bạn", href: "/your-videos" },
  { icon: Clock, label: "Xem sau", href: "/watch-later" },
  { icon: ThumbsUp, label: "Video đã thích", href: "/liked" },
  { icon: Image, label: "Bộ sưu tập NFT", href: "/nft-gallery" },
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
  const [showHonobarDetail, setShowHonobarDetail] = useState(false);

  const handleNavigation = (href: string) => {
    navigate(href);
    onClose();
  };

  const handleItemClick = (item: NavItem) => {
    if (item.external) {
      window.open(item.href, '_blank');
    } else {
      handleNavigation(item.href);
    }
  };

  return (
    <>
      {/* Honor Board Detail Modal */}
      <HonobarDetailModal 
        isOpen={showHonobarDetail} 
        onClose={() => setShowHonobarDetail(false)} 
      />

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
            {/* HONOR BOARD - TRÊN CÙNG */}
            <div className="px-3 py-2 mb-2">
              <HonobarSidebarButton onOpenDetail={() => setShowHonobarDetail(true)} />
            </div>

            <div className="h-px bg-border my-2" />

            {/* FUN ECOSYSTEM section */}
            <div className="px-3 py-2">
              <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                FUN ECOSYSTEM
              </p>
              {funPlatformItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-primary/10 hover:text-primary transition-all duration-300",
                    !item.external && location.pathname === item.href && "bg-primary/10 text-primary font-semibold",
                    item.isWallet && "bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-600/10 hover:from-yellow-500/20 hover:via-orange-500/20 hover:to-yellow-600/20 border border-yellow-500/20",
                    item.isFunMoney && "bg-gradient-to-r from-primary/10 via-cyan-500/10 to-blue-500/10 hover:from-primary/20 hover:via-cyan-500/20 hover:to-blue-500/20 border border-primary/20"
                  )}
                >
                  {item.customIcon && (
                    <img 
                      src={item.customIcon} 
                      alt={item.label} 
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  )}
                  <span className="text-[#004eac] font-semibold">
                    {item.label}
                  </span>
                  {item.external && (
                    <ExternalLink className="h-4 w-4 ml-auto text-yellow-500" />
                  )}
                </Button>
              ))}
            </div>

            <div className="h-px bg-border my-2" />

            {/* Main navigation */}
            <div className="px-3 py-2">
              {mainNavItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-primary/10 hover:text-primary transition-all duration-300",
                    location.pathname === item.href && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  {item.icon && (
                    <item.icon className="h-5 w-5 text-[#004eac]" />
                  )}
                  <span className="text-[#004eac] font-medium">
                    {item.label}
                  </span>
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
                  <item.icon className="h-5 w-5 text-[#004eac]" />
                  <span className="text-[#004eac]">{item.label}</span>
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
                <Trophy className="h-5 w-5 text-[#004eac]" />
                <span className="text-[#004eac]">Light Community</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/reward-history")}
                className={cn(
                  "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-primary/10 hover:text-primary transition-all duration-300",
                  location.pathname === "/reward-history" && "bg-primary/10 text-primary font-semibold"
                )}
              >
                <Coins className="h-5 w-5 text-[#004eac]" />
                <span className="text-[#004eac]">Lịch Sử Phần Thưởng</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/transactions")}
                className={cn(
                  "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-primary/10 hover:text-primary transition-all duration-300",
                  location.pathname === "/transactions" && "bg-primary/10 text-primary font-semibold"
                )}
              >
                <Globe className="h-5 w-5 text-[#004eac]" />
                <span className="text-[#004eac]">Lịch Sử Giao Dịch</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/reward-history")}
                className={cn(
                  "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-primary/10 hover:text-primary transition-all duration-300",
                  location.pathname === "/reward-history" && "bg-primary/10 text-primary font-semibold"
                )}
              >
                <Coins className="h-5 w-5 text-[#004eac]" />
                <span className="text-[#004eac]">Lịch Sử Phần Thưởng</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleNavigation("/referral")}
                className={cn(
                  "w-full justify-start gap-6 px-3 py-2.5 h-auto hover:bg-primary/10 hover:text-primary transition-all duration-300",
                  location.pathname === "/referral" && "bg-primary/10 text-primary font-semibold"
                )}
              >
                <UserPlus className="h-5 w-5 text-[#004eac]" />
                <span className="text-[#004eac]">Giới Thiệu Bạn Bè</span>
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
                  <item.icon className="h-5 w-5 text-[#004eac]" />
                  <span className="text-[#004eac]">{item.label}</span>
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
                <Wallet className="h-5 w-5 text-[#004eac]" />
                <span className="text-[#004eac]">Ví</span>
              </Button>
            </div>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};
