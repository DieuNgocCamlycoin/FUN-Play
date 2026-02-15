import { Search, Video, Bell, Menu, User as UserIcon, LogOut, Settings, Radio, SquarePen, Plus, FileVideo, List, Music, Shield, Crown, MessageCircle, Users } from "lucide-react";
import funplayLogo from "@/assets/funplay-logo.jpg";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { WalletButton } from "@/components/Wallet/WalletButton";
import { UploadWizard } from "@/components/Upload/UploadWizard";

import { GlobalDonateButton } from "@/components/Donate/GlobalDonateButton";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Notification badge component for bell icon
function NotificationBadge({ userId }: { userId?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!userId) return;
    const fetchCount = async () => {
      const { count: c } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
      setCount(c || 0);
    };
    fetchCount();
    const channel = supabase.channel('header-notif-count').on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, fetchCount).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);
  if (count <= 0) return null;
  return <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">{count > 9 ? '9+' : count}</span>;
}

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { videos: suggestedVideos, channels: suggestedChannels, isOpen: showSuggestions, query: searchQuery, setQuery: setSearchQuery, open: openSuggestions, close: closeSuggestions, clear: clearSearch } = useSearchSuggestions();
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Check admin/owner role
  useEffect(() => {
    const checkRoles = async () => {
      if (!user) { setIsAdmin(false); setIsOwner(false); return; }
      const { data: adminData } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      const { data: ownerData } = await supabase.rpc("is_owner", { _user_id: user.id });
      setIsAdmin(adminData === true);
      setIsOwner(ownerData === true);
    };
    checkRoles();
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
    closeSuggestions();
  };

  const handleSuggestionClick = (videoId: string) => {
    navigate(`/watch/${videoId}`);
    clearSearch();
  };

  const handleChannelClick = (channelId: string) => {
    navigate(`/channel/${channelId}`);
    clearSearch();
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-50 hidden lg:flex items-center justify-between px-4 gap-4">
      {/* Left section */}
      <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>
        <div className="flex items-center cursor-pointer hover:scale-105 transition-transform duration-300" onClick={() => navigate("/")}>
          <img 
            src={funplayLogo} 
            alt="FUN Play" 
            className="h-11 w-11 rounded-full object-cover shadow-lg ring-2 ring-primary/30 hover:ring-primary/50 transition-all drop-shadow-lg"
          />
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-2xl relative">
        <form onSubmit={handleSearch}>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (blurTimeoutRef.current) { clearTimeout(blurTimeoutRef.current); blurTimeoutRef.current = null; }
              openSuggestions();
            }}
            onFocus={() => {
              if (blurTimeoutRef.current) { clearTimeout(blurTimeoutRef.current); blurTimeoutRef.current = null; }
              openSuggestions();
            }}
            onBlur={() => {
              blurTimeoutRef.current = setTimeout(closeSuggestions, 200);
            }}
            placeholder="Tìm kiếm"
            className="w-full pl-4 pr-12 h-10 bg-muted border-border focus:border-primary rounded-full"
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="absolute right-0 top-0 h-10 w-12 rounded-r-full hover:bg-accent"
          >
            <Search className="h-5 w-5" />
          </Button>
        </form>

        {/* Search Suggestions */}
        {showSuggestions && (suggestedVideos.length > 0 || suggestedChannels.length > 0) && (
          <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
            {suggestedVideos.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSuggestionClick(s.id)}
                className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-3 transition-colors"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{s.title}</span>
              </button>
            ))}
            {suggestedChannels.length > 0 && suggestedVideos.length > 0 && (
              <div className="border-t border-border" />
            )}
            {suggestedChannels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => handleChannelClick(ch.id)}
                className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-3 transition-colors"
              >
                {ch.avatar_url ? (
                  <img src={ch.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <Users className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">{ch.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">Kênh</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <GlobalDonateButton />
        
        {/* MINT FUN MONEY Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={() => navigate("/fun-money")}
                className="relative hidden md:flex items-center gap-2 overflow-hidden
                           bg-gradient-to-b from-[#FFEA00] via-[#FFD700] to-[#E5A800] 
                           text-[#7C5800] font-extrabold rounded-full px-4 h-10
                           shadow-[0_0_15px_rgba(255,215,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-1px_2px_rgba(0,0,0,0.1)] 
                           hover:shadow-[0_0_25px_rgba(255,234,0,0.6),0_0_40px_rgba(255,215,0,0.3)] 
                           border border-[#FFEA00]/60 
                           transition-all duration-300 hover:scale-105"
              >
                <img 
                  src="/images/fun-money-coin.png" 
                  alt="FUN Money" 
                  className="h-5 w-5 rounded-full object-cover ring-1 ring-[#7C5800]/30 relative z-10"
                />
                <span className="text-base font-extrabold relative z-10 tracking-wide">
                  MINT
                </span>
                {/* Mirror shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-mirror-shimmer" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mint FUN Money - PPLP Protocol</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <WalletButton />
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hidden md:flex gap-2 px-3">
                <Plus className="h-5 w-5" />
                <span className="text-sm font-medium">Tạo</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setUploadModalOpen(true)}>
                <FileVideo className="mr-2 h-4 w-4" />
                Tải video lên
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/create-music")}>
                <Music className="mr-2 h-4 w-4 text-cyan-500" />
                Tạo Nhạc Ánh Sáng
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/channel/" + user.id)}>
                <Settings className="mr-2 h-4 w-4" />
                Quản lý kênh
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/your-videos")}>
                <List className="mr-2 h-4 w-4" />
                Video của tôi
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/create-post")}>
                <SquarePen className="mr-2 h-4 w-4" />
                Tạo bài đăng
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* ANGEL AI Chat Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open("https://angel.fun.rich", "_blank")}
                className="relative rounded-full overflow-hidden h-11 w-11 hover:scale-110 transition-transform p-0"
              >
                <img 
                  src="/images/angel-ai-v2.png" 
                  alt="ANGEL AI" 
                  className="w-11 h-11 rounded-full object-cover shadow-lg ring-2 ring-primary/30 hover:ring-primary/50 transition-all drop-shadow-lg"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>ANGEL AI ✨</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Messages button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/messages")}
                className="relative"
              >
                <img src="/images/icon-chat-holographic.png" alt="Tin nhắn" className="h-6 w-6 object-contain drop-shadow-md" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tin nhắn</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/notifications")}>
          <img src="/images/icon-bell-holographic.png" alt="Thông báo" className="h-6 w-6 object-contain drop-shadow-md" />
          <NotificationBadge userId={user?.id} />
        </Button>
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 p-0 hover:scale-105 transition-transform">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-11 h-11 rounded-full object-cover shadow-lg ring-2 ring-primary/30 hover:ring-primary/50 transition-all drop-shadow-lg"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold shadow-lg ring-2 ring-primary/30">
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Admin Dashboard - Only show for admin/owner */}
              {(isAdmin || isOwner) && (
                <>
                  <DropdownMenuItem 
                    onClick={() => navigate("/admin")}
                    className="text-amber-500 focus:text-amber-500"
                  >
                    {isOwner ? (
                      <Crown className="mr-2 h-4 w-4" />
                    ) : (
                      <Shield className="mr-2 h-4 w-4" />
                    )}
                    Bảng điều khiển
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem onClick={() => navigate(`/user/${user.id}`)}>
                <UserIcon className="mr-2 h-4 w-4" />
                Trang cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/your-videos")}>
                <UserIcon className="mr-2 h-4 w-4" />
                Video của bạn
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Cài đặt
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => navigate("/auth")} size="sm" variant="default">
            Đăng nhập
          </Button>
        )}
      </div>
      
      <UploadWizard open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
    </header>
  );
};
