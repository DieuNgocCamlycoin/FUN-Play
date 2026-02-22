import { useState } from "react";
import { Home, Zap, Users, Library, History, Video, Clock, ThumbsUp, Wallet, ListVideo, FileText, Tv, Trophy, Coins, UserPlus, Image, Sparkles, Music, ExternalLink, ChevronDown, ChevronUp, Award, Globe, ShieldBan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";

interface CollapsibleSidebarProps {
  isExpanded: boolean;
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

// FUN Platforms - Always visible
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

const mainNavItems: NavItem[] = [
  { icon: Home, label: "Trang chủ", href: "/" },
  { icon: Zap, label: "Shorts", href: "/shorts" },
  { icon: Users, label: "Kênh đăng ký", href: "/subscriptions" },
  { icon: Globe, label: "Users Directory", href: "/users" },
  { icon: Sparkles, label: "Thiền cùng Cha", href: "/meditate", special: true },
  { icon: Music, label: "Tạo Nhạc Ánh Sáng", href: "/create-music", special: true },
];

const libraryItems: NavItem[] = [
  { icon: Library, label: "Thư viện", href: "/library" },
  { icon: History, label: "Lịch sử", href: "/history" },
  { icon: Video, label: "Video của bạn", href: "/your-videos" },
  { icon: Clock, label: "Xem sau", href: "/watch-later" },
  { icon: ThumbsUp, label: "Video đã thích", href: "/liked" },
  { icon: Image, label: "Bộ sưu tập NFT", href: "/nft-gallery" },
];

const rewardItems: NavItem[] = [
  { icon: Trophy, label: "Bảng Xếp Hạng", href: "/leaderboard" },
  { icon: Coins, label: "Lịch Sử Phần Thưởng", href: "/reward-history" },
  { icon: Globe, label: "Lịch Sử Giao Dịch", href: "/transactions" },
  { icon: ShieldBan, label: "Danh Sách Đình Chỉ", href: "/suspended" },
  { 
    customIcon: '/images/fun-money-coin.png',
    label: "FUN Money", 
    href: "/fun-money",
    isFunMoney: true
  },
  { icon: UserPlus, label: "Giới Thiệu Bạn Bè", href: "/referral" },
  { icon: Award, label: "Build & Bounty", href: "/build-bounty", special: true },
];

const manageItems: NavItem[] = [
  { icon: Tv, label: "Studio", href: "/studio" },
  { icon: Tv, label: "Quản lý kênh", href: "/manage-channel" },
  { icon: ListVideo, label: "Danh sách phát", href: "/manage-playlists" },
  { icon: FileText, label: "Bài viết của bạn", href: "/manage-posts" },
  { icon: Wallet, label: "Ví", href: "/wallet" },
];

export const CollapsibleSidebar = ({ isExpanded }: CollapsibleSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState({
    nav: true,
    library: true,
    rewards: true,
    manage: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  const handleItemClick = (item: NavItem) => {
    if (item.external) {
      window.open(item.href, '_blank');
    } else {
      handleNavigation(item.href);
    }
  };

  const NavButton = ({ item, compact = false }: { item: NavItem; compact?: boolean }) => {
    const isActive = !item.external && location.pathname === item.href;
    
    const button = (
      <Button
        variant="ghost"
        onClick={() => handleItemClick(item)}
        className={cn(
          "w-full justify-start gap-4 px-3 py-2.5 h-auto hover:bg-primary/10 hover:text-primary transition-all duration-300",
          isActive && "bg-primary/10 text-primary font-semibold",
          item.isWallet && "bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-600/10 hover:from-yellow-500/20 hover:via-orange-500/20 hover:to-yellow-600/20 border border-yellow-500/20",
          item.isFunMoney && "bg-gradient-to-r from-primary/10 via-cyan-500/10 to-blue-500/10 hover:from-primary/20 hover:via-cyan-500/20 hover:to-blue-500/20 border border-primary/20",
          compact && "justify-center px-2"
        )}
      >
        {item.customIcon ? (
          <img 
            src={item.customIcon} 
            alt={item.label} 
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : item.icon ? (
          <item.icon className="h-5 w-5 text-[#004eac] shrink-0" />
        ) : null}
        {!compact && (
          <span className="text-[#004eac] font-medium truncate">
            {item.label}
          </span>
        )}
        {!compact && item.external && (
          <ExternalLink className="h-4 w-4 ml-auto text-yellow-500" />
        )}
      </Button>
    );

    if (compact) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-14 bottom-0 bg-background border-r border-border z-40 transition-all duration-300 hidden lg:block",
          isExpanded ? "w-60" : "w-16"
        )}
      >
        <ScrollArea className="h-full">
          <div className="py-2">
            {/* FUN ECOSYSTEM - Always visible */}
            <div className="px-2 py-2 border-b border-border mb-2">
              {isExpanded && (
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  FUN ECOSYSTEM
                </p>
              )}
              {funPlatformItems.map((item) => (
                <NavButton key={item.label} item={item} compact={!isExpanded} />
              ))}
            </div>

            {/* Collapsible sections */}
            {isExpanded ? (
              <>
                {/* Điều hướng */}
                <Collapsible open={openSections.nav} onOpenChange={() => toggleSection('nav')}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50"
                    >
                      <span>Điều hướng</span>
                      {openSections.nav ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="animate-in slide-in-from-top-2 duration-200">
                    <div className="px-2 py-1">
                      {mainNavItems.map((item) => (
                        <NavButton key={item.label} item={item} />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="h-px bg-border mx-2 my-1" />

                {/* Thư viện */}
                <Collapsible open={openSections.library} onOpenChange={() => toggleSection('library')}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50"
                    >
                      <span>Thư viện</span>
                      {openSections.library ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="animate-in slide-in-from-top-2 duration-200">
                    <div className="px-2 py-1">
                      {libraryItems.map((item) => (
                        <NavButton key={item.label} item={item} />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="h-px bg-border mx-2 my-1" />

                {/* Phần thưởng */}
                <Collapsible open={openSections.rewards} onOpenChange={() => toggleSection('rewards')}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50"
                    >
                      <span>Phần thưởng</span>
                      {openSections.rewards ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="animate-in slide-in-from-top-2 duration-200">
                    <div className="px-2 py-1">
                      {rewardItems.map((item) => (
                        <NavButton key={item.label} item={item} />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="h-px bg-border mx-2 my-1" />

                {/* Quản lý */}
                <Collapsible open={openSections.manage} onOpenChange={() => toggleSection('manage')}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50"
                    >
                      <span>Quản lý</span>
                      {openSections.manage ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="animate-in slide-in-from-top-2 duration-200">
                    <div className="px-2 py-1">
                      {manageItems.map((item) => (
                        <NavButton key={item.label} item={item} />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </>
            ) : (
              /* Mini mode - just show main icons */
              <div className="px-2 py-2 space-y-1">
                {mainNavItems.slice(0, 4).map((item) => (
                  <NavButton key={item.label} item={item} compact />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  );
};
