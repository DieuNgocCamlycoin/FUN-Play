import { useState } from "react";
import { X, Home, Zap, Users, Library, History, Video, Clock, ThumbsUp, Wallet, ListVideo, FileText, Tv, Trophy, Coins, UserPlus, Image, Sparkles, Music, Settings, LogOut, Download, ExternalLink, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { motion, AnimatePresence } from "framer-motion";
import { HonobarSidebarButton } from "./HonobarSidebarButton";
import { HonobarDetailModal } from "./HonobarDetailModal";

interface MobileDrawerProps {
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
    customIcon: '/images/fun-rich-logo.png',
    label: "FUN.RICH", 
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
  { 
    customIcon: '/images/fun-wallet-logo.png',
    label: "FUN Wallet", 
    href: "/fun-wallet",
    isWallet: true
  },
];

const libraryItems: NavItem[] = [
  { icon: Library, label: "Thư viện", href: "/library" },
  { icon: History, label: "Lịch sử xem", href: "/history" },
  { icon: Video, label: "Video của bạn", href: "/your-videos" },
  { icon: Clock, label: "Xem sau", href: "/watch-later" },
  { icon: ThumbsUp, label: "Video đã thích", href: "/liked" },
  { icon: Image, label: "Bộ sưu tập NFT", href: "/nft-gallery" },
];

const rewardItems: NavItem[] = [
  { icon: Trophy, label: "Bảng Xếp Hạng", href: "/leaderboard" },
  { icon: Coins, label: "Lịch Sử Phần Thưởng", href: "/reward-history" },
  { 
    customIcon: '/images/fun-money-coin.png',
    label: "FUN Money", 
    href: "/fun-money",
    special: true
  },
  { icon: UserPlus, label: "Giới Thiệu Bạn Bè", href: "/referral" },
  { icon: Award, label: "Build & Bounty", href: "/build-bounty", special: true },
  { icon: Wallet, label: "Ví của tôi", href: "/wallet" },
  { icon: Download, label: "Cài đặt App", href: "/install", special: true },
];

const manageItems: NavItem[] = [
  { icon: Tv, label: "Studio", href: "/studio" },
  { icon: Tv, label: "Quản lý kênh", href: "/manage-channel" },
  { icon: ListVideo, label: "Danh sách phát", href: "/manage-playlists" },
  { icon: FileText, label: "Bài viết của bạn", href: "/manage-posts" },
];

export const MobileDrawer = ({ isOpen, onClose }: MobileDrawerProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
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

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleOpenHonobar = () => {
    setShowHonobarDetail(true);
  };

  const NavButton = ({ item }: { item: NavItem }) => (
    <Button
      variant="ghost"
      onClick={() => handleItemClick(item)}
      className={cn(
        "w-full justify-start gap-4 px-4 py-3 h-auto text-base hover:bg-primary/10",
        !item.external && location.pathname === item.href && "bg-primary/10 text-primary font-semibold",
        item.special && item.customIcon && "bg-gradient-to-r from-primary/10 via-cyan-500/10 to-blue-500/10 border border-primary/20"
      )}
    >
      {item.customIcon ? (
        <img 
          src={item.customIcon} 
          alt={item.label} 
          className="h-6 w-6 rounded-full shadow-md object-cover ring-2 ring-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]"
        />
      ) : item.icon ? (
        <item.icon className="h-6 w-6 text-[#004eac]" />
      ) : null}
      <span className="text-[#004eac] font-medium">
        {item.label}
      </span>
      {item.external && (
        <ExternalLink className="h-4 w-4 ml-auto text-yellow-500" />
      )}
    </Button>
  );

  const FunPlatformButton = ({ item }: { item: NavItem }) => (
    <Button
      variant="ghost"
      onClick={() => handleItemClick(item)}
      className={cn(
        "w-full justify-start gap-4 px-4 py-3 h-auto text-base hover:bg-primary/10",
        !item.external && location.pathname === item.href && "bg-primary/10 text-primary font-semibold",
        item.isWallet && "bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-600/10 border border-yellow-500/20"
      )}
    >
      {item.customIcon && (
        <img 
          src={item.customIcon} 
          alt={item.label} 
          className="h-6 w-6 rounded-full shadow-md object-cover ring-2 ring-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]"
        />
      )}
      <span className="text-[#004eac] font-semibold">
        {item.label}
      </span>
      {item.external && (
        <ExternalLink className="h-4 w-4 ml-auto text-yellow-500" />
      )}
    </Button>
  );

  return (
    <>
      {/* Honor Board Detail Modal */}
      <HonobarDetailModal 
        isOpen={showHonobarDetail} 
        onClose={() => setShowHonobarDetail(false)} 
      />

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] lg:hidden"
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-background border-r border-border z-[70] lg:hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="text-lg font-bold bg-gradient-to-r from-[#00E7FF] to-[#00FFFF] bg-clip-text text-transparent">
                  FUN Play
                </span>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* User Profile Section */}
              {user && (
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-semibold">
                        {user.email?.[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{profile?.display_name || profile?.username || "User"}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <ScrollArea className="h-[calc(100%-140px)]">
                <div className="py-2">
                  {/* HONOR BOARD - TRÊN CÙNG */}
                  <div className="px-2 mb-3">
                    <HonobarSidebarButton onOpenDetail={handleOpenHonobar} />
                  </div>

                  <div className="h-px bg-border my-3 mx-4" />

                  {/* FUN ECOSYSTEM */}
                  <div className="px-2">
                    <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      FUN ECOSYSTEM
                    </p>
                    {funPlatformItems.map((item) => (
                      <FunPlatformButton key={item.label} item={item} />
                    ))}
                </div>

                <div className="h-px bg-border my-3 mx-4" />

                {/* Main Navigation */}
                <div className="px-2">
                  {mainNavItems.map((item) => (
                    <NavButton key={item.label} item={item} />
                  ))}
                </div>

                <div className="h-px bg-border my-3 mx-4" />

                {/* Library */}
                <div className="px-2">
                  <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Thư viện
                  </p>
                  {libraryItems.map((item) => (
                    <NavButton key={item.label} item={item} />
                  ))}
                </div>

                <div className="h-px bg-border my-3 mx-4" />

                {/* Rewards */}
                <div className="px-2">
                  <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Phần thưởng
                  </p>
                  {rewardItems.map((item) => (
                    <NavButton key={item.label} item={item} />
                  ))}
                </div>

                {user && (
                  <>
                    <div className="h-px bg-border my-3 mx-4" />

                    {/* Manage */}
                    <div className="px-2">
                      <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Quản lý
                      </p>
                      {manageItems.map((item) => (
                        <NavButton key={item.label} item={item} />
                      ))}
                    </div>

                    <div className="h-px bg-border my-3 mx-4" />

                    {/* Settings & Sign Out */}
                    <div className="px-2">
                      <Button
                        variant="ghost"
                        onClick={() => handleNavigation("/settings")}
                        className="w-full justify-start gap-4 px-4 py-3 h-auto text-base hover:bg-primary/10"
                      >
                        <Settings className="h-6 w-6" />
                        <span>Cài đặt</span>
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleSignOut}
                        className="w-full justify-start gap-4 px-4 py-3 h-auto text-base hover:bg-destructive/10 text-destructive"
                      >
                        <LogOut className="h-6 w-6" />
                        <span>Đăng xuất</span>
                      </Button>
                    </div>
                  </>
                )}

                {!user && (
                  <>
                    <div className="h-px bg-border my-3 mx-4" />
                    <div className="px-4 py-2">
                      <Button
                        onClick={() => handleNavigation("/auth")}
                        className="w-full h-12 text-base bg-gradient-to-r from-primary to-primary/80"
                      >
                        Đăng nhập / Đăng ký
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
