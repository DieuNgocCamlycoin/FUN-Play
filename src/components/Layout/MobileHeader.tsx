import { Search, Bell, Menu, X, Plus, Upload, Music, FileText, Shield, Crown, Settings, LogOut, MessageCircle } from "lucide-react";
import funplayLogo from "@/assets/funplay-logo.jpg";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalletButton } from "@/components/Wallet/WalletButton";

import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { UploadWizard } from "@/components/Upload/UploadWizard";
import { MobileUploadFlow } from "@/components/Upload/Mobile/MobileUploadFlow";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export const MobileHeader = ({ onMenuClick }: MobileHeaderProps) => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ id: string; title: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const suggestionsDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const isMobile = useIsMobile();

  // Check admin/owner role
  useEffect(() => {
    const checkRoles = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsOwner(false);
        return;
      }
      
      const { data: adminData } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      
      const { data: ownerData } = await supabase.rpc("is_owner", {
        _user_id: user.id,
      });
      
      setIsAdmin(adminData === true);
      setIsOwner(ownerData === true);
    };
    checkRoles();
  }, [user]);

  // Fetch notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!user) {
        setNotificationCount(0);
        return;
      }

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

    // Listen for new rewards
    const handleReward = () => fetchNotificationCount();
    window.addEventListener('camly-reward', handleReward);
    window.addEventListener('tip-received', handleReward);
    
    return () => {
      window.removeEventListener('camly-reward', handleReward);
      window.removeEventListener('tip-received', handleReward);
    };
  }, [user]);

  // Search suggestions debounce
  useEffect(() => {
    if (suggestionsDebounceRef.current) clearTimeout(suggestionsDebounceRef.current);

    if (!isSearchOpen || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    suggestionsDebounceRef.current = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('videos')
          .select('id, title')
          .eq('is_public', true)
          .eq('approval_status', 'approved')
          .ilike('title', `%${searchQuery.trim()}%`)
          .order('view_count', { ascending: false })
          .limit(5);
        setSuggestions(data || []);
        setShowSuggestions((data || []).length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (suggestionsDebounceRef.current) clearTimeout(suggestionsDebounceRef.current);
    };
  }, [searchQuery, isSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (videoId: string) => {
    navigate(`/watch/${videoId}`);
    setIsSearchOpen(false);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-12 bg-background/95 backdrop-blur-lg border-b border-border z-50 lg:hidden">
      {/* Normal Header */}
      <div
        className={cn(
          "flex items-center justify-between h-full px-2 transition-opacity duration-200",
          isSearchOpen && "opacity-0 pointer-events-none"
        )}
      >
        {/* Left - Menu & Logo */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
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

        {/* Right - Actions */}
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-px shrink-0">
            {/* WALLET Button - Replaces 3 old widgets */}
            <WalletButton compact />
            
            {/* Search */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                  className="h-7 w-7"
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Tìm kiếm
              </TooltipContent>
            </Tooltip>

            {/* Create Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-primary"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 bg-background border-border">
                    <DropdownMenuItem onClick={() => setUploadModalOpen(true)} className="gap-2">
                      <Upload className="h-4 w-4" />
                      Tải video lên
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/create-music")} className="gap-2">
                      <Music className="h-4 w-4" />
                      Tạo Nhạc AI
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/create-post")} className="gap-2">
                      <FileText className="h-4 w-4" />
                      Tạo Bài Viết
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Tạo nội dung
              </TooltipContent>
            </Tooltip>

            {/* ANGEL AI Chat Button - Compact */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open("https://angel.fun.rich", "_blank")}
                  className="h-7 w-7 relative rounded-full overflow-hidden"
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FFD700]/30 to-[#FFA500]/30 animate-pulse" />
                  <img 
                    src="/images/angel-ai-v2.png" 
                    alt="ANGEL AI" 
                    className="w-6 h-6 object-contain relative z-10"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                ANGEL AI ✨
              </TooltipContent>
            </Tooltip>

            {/* Messages */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 relative"
                  onClick={() => navigate("/messages")}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Tin nhắn
              </TooltipContent>
            </Tooltip>

            {/* Notifications with Badge */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 relative"
                  onClick={() => navigate("/notifications")}
                >
                  <Bell className="h-3.5 w-3.5" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[12px] h-3 px-0.5 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Thông báo
              </TooltipContent>
            </Tooltip>

            {/* Profile / Sign In */}
            <Tooltip>
              <TooltipTrigger asChild>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full p-0"
                      >
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt="Profile"
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-semibold">
                            {user.email?.[0].toUpperCase()}
                          </div>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-background border-border">
                      <DropdownMenuLabel className="text-xs truncate">{user.email}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {/* Admin Dashboard - Only show for admin/owner */}
                      {(isAdmin || isOwner) && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => navigate("/admin")}
                            className="text-amber-500 focus:text-amber-500 gap-2"
                          >
                            {isOwner ? (
                              <Crown className="h-4 w-4" />
                            ) : (
                              <Shield className="h-4 w-4" />
                            )}
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
                    className="h-7 text-xs px-2 font-medium"
                  >
                    Đăng nhập
                  </Button>
                )}
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {user ? "Tài khoản" : "Đăng nhập / Đăng ký"}
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>


      {/* Upload Modal */}
      {isMobile ? (
        <MobileUploadFlow open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
      ) : (
        <UploadWizard open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
      )}

      {/* Search Mode */}
      <div
        className={cn(
          "absolute inset-0 flex items-center gap-2 px-2 bg-background transition-opacity duration-200",
          isSearchOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { setIsSearchOpen(false); setSuggestions([]); setShowSuggestions(false); }}
          className="h-8 w-8 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="flex-1 relative">
          <form onSubmit={handleSearch}>
            <Input
              autoFocus={isSearchOpen}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm"
              className="w-full h-8 text-sm bg-muted border-border focus:border-primary rounded-full"
            />
          </form>
          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-10 left-0 right-0 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSuggestionClick(s.id)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-muted/60 transition-colors text-left"
                >
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground line-clamp-1">{s.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          onClick={handleSearch}
          className="h-8 w-8 shrink-0"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};