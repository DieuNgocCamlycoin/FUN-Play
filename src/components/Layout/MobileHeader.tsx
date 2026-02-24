import { Search, Menu, X, Plus, Upload, Music, FileText, Shield, Crown, Settings, LogOut, Users } from "lucide-react";
import funplayLogo from "@/assets/funplay-logo.jpg";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useVideoNavigation } from "@/lib/videoNavigation";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { UploadWizard } from "@/components/Upload/UploadWizard";
import { MobileUploadFlow } from "@/components/Upload/Mobile/MobileUploadFlow";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export const MobileHeader = ({ onMenuClick }: MobileHeaderProps) => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { goToVideo } = useVideoNavigation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { videos: suggestedVideos, channels: suggestedChannels, isOpen: suggestionsOpen, query: searchQuery, setQuery: setSearchQuery, open: openSuggestions, close: closeSuggestions, clear: clearSearch } = useSearchSuggestions();
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const isMobile = useIsMobile();

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

  // Fetch notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!user) { setNotificationCount(0); return; }
      try {
        const { count } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        setNotificationCount(count || 0);
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };
    fetchNotificationCount();
    const handleReward = () => fetchNotificationCount();
    window.addEventListener('camly-reward', handleReward);
    window.addEventListener('tip-received', handleReward);
    return () => {
      window.removeEventListener('camly-reward', handleReward);
      window.removeEventListener('tip-received', handleReward);
    };
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      clearSearch();
    }
  };

  const handleSuggestionClick = (videoId: string) => {
    goToVideo(videoId);
    setIsSearchOpen(false);
    clearSearch();
  };

  const handleChannelClick = (channelId: string) => {
    navigate(`/${channelId}`);
    setIsSearchOpen(false);
    clearSearch();
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-b border-border z-50 lg:hidden safe-area-top">
      {/* The actual toolbar row with fixed 56px height */}
      <div className="h-14 relative">
        {/* Normal Header */}
        <div
          className={cn(
            "flex items-center justify-between h-full px-2 transition-opacity duration-200",
            isSearchOpen && "opacity-0 pointer-events-none"
          )}
        >
          {/* Left - Menu & Logo */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onMenuClick}
              className="flex items-center justify-center h-9 w-9 rounded-full active:bg-muted/60 transition-colors"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            <div
              className="flex items-center cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img 
                src={funplayLogo} 
                alt="FUN Play" 
                className="h-8 w-8 rounded-full object-cover shadow-lg ring-2 ring-primary/30"
              />
            </div>
          </div>

          {/* Right - Action Icons (limited on mobile) */}
          <div className="flex items-center gap-0 shrink-0">
            {/* Search */}
            <ToolbarIconButton
              onClick={() => setIsSearchOpen(true)}
              ariaLabel="Tìm kiếm"
            >
              <Search className="h-5 w-5 text-foreground" />
            </ToolbarIconButton>

            {/* Notifications */}
            <ToolbarIconButton
              onClick={() => navigate("/notifications")}
              ariaLabel="Thông báo"
              badge={notificationCount}
            >
              <img 
                src="/images/icon-bell-holographic.png" 
                alt="Thông báo" 
                className="h-6 w-6 object-contain drop-shadow-md"
              />
            </ToolbarIconButton>

            {/* Messages */}
            <ToolbarIconButton
              onClick={() => navigate("/messages")}
              ariaLabel="Tin nhắn"
            >
              <img 
                src="/images/icon-chat-holographic.png" 
                alt="Tin nhắn" 
                className="h-6 w-6 object-contain drop-shadow-md"
              />
            </ToolbarIconButton>

            {/* Avatar / Sign In */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center h-9 w-9 rounded-full active:bg-muted/60 transition-colors">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-primary/30"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                        {user.email?.[0].toUpperCase()}
                      </div>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background border-border">
                  <DropdownMenuLabel className="text-xs truncate">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(isAdmin || isOwner) && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => navigate("/admin")}
                        className="text-amber-500 focus:text-amber-500 gap-2"
                      >
                        {isOwner ? <Crown className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        Bảng điều khiển
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2">
                    <Settings className="h-4 w-4" />
                    Cài đặt tài khoản
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => navigate("/auth")}
                size="sm"
                className="h-8 text-xs px-2.5 font-semibold rounded-full"
              >
                Đăng nhập
              </Button>
            )}
          </div>
        </div>

        {/* Search Mode */}
        <div
          className={cn(
            "absolute inset-0 flex items-center gap-2 px-2 bg-background transition-opacity duration-200",
            isSearchOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <button
            onClick={() => { setIsSearchOpen(false); clearSearch(); }}
            className="flex items-center justify-center h-9 w-9 shrink-0 rounded-full active:bg-muted/60"
            aria-label="Đóng tìm kiếm"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex-1 relative">
            <form onSubmit={handleSearch}>
              <Input
                autoFocus={isSearchOpen}
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
                  blurTimeoutRef.current = setTimeout(() => closeSuggestions(), 200);
                }}
                placeholder="Tìm kiếm"
                className="w-full h-9 text-base bg-muted border-border focus:border-primary rounded-full px-4"
              />
            </form>
            {suggestionsOpen && (suggestedVideos.length > 0 || suggestedChannels.length > 0) && (
              <div className="absolute top-11 left-0 right-0 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                {suggestedVideos.map((s) => (
                  <button
                    key={s.id}
                    onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(s.id); }}
                    className="flex items-center gap-3 w-full px-4 min-h-[48px] hover:bg-muted/60 active:bg-muted transition-colors text-left"
                  >
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground line-clamp-1">{s.title}</span>
                  </button>
                ))}
                {suggestedChannels.length > 0 && suggestedVideos.length > 0 && (
                  <div className="border-t border-border" />
                )}
                {suggestedChannels.map((ch) => (
                  <button
                    key={ch.id}
                    onMouseDown={(e) => { e.preventDefault(); handleChannelClick(ch.id); }}
                    className="flex items-center gap-3 w-full px-4 min-h-[48px] hover:bg-muted/60 active:bg-muted transition-colors text-left"
                  >
                    {ch.avatar_url ? (
                      <img src={ch.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-sm text-foreground line-clamp-1">{ch.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">Kênh</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="flex items-center justify-center h-9 w-9 shrink-0 rounded-full active:bg-muted/60"
            aria-label="Tìm kiếm"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {isMobile ? (
        <MobileUploadFlow open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
      ) : (
        <UploadWizard open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
      )}
    </header>
  );
};

/* ─── Reusable Toolbar Icon Button (44px touch target) ─── */
interface ToolbarIconButtonProps {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
  badge?: number;
}

const ToolbarIconButton = ({ onClick, ariaLabel, children, badge }: ToolbarIconButtonProps) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className="relative flex items-center justify-center h-9 w-9 rounded-full active:bg-muted/60 transition-colors"
  >
    {children}
    <AnimatePresence>
      {badge !== undefined && badge > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg"
        >
          {badge > 99 ? '99+' : badge}
        </motion.span>
      )}
    </AnimatePresence>
  </button>
);
