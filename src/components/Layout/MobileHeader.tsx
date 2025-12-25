import { Search, Bell, Menu, Play, X, Plus, Upload, Music, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiTokenWallet } from "@/components/Web3/MultiTokenWallet";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClaimRewardsButton } from "@/components/Rewards/ClaimRewardsButton";
import { supabase } from "@/integrations/supabase/client";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export const MobileHeader = ({ onMenuClick }: MobileHeaderProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);

  // Fetch unclaimed rewards count as notification indicator
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!user) {
        setNotificationCount(0);
        return;
      }

      try {
        const { count } = await supabase
          .from('reward_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('claimed', false)
          .eq('status', 'success');

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
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
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-md p-1 shadow-lg">
              <Play className="h-3.5 w-3.5 text-primary-foreground fill-primary-foreground" />
            </div>
            <span className="text-sm font-black tracking-tight bg-gradient-to-r from-[#00E7FF] via-[#00FFFF] to-[#00E7FF] bg-clip-text text-transparent hidden xs:inline">
              FUN
            </span>
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Search */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(true)}
            className="h-8 w-8"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Claim Rewards - Compact */}
          <ClaimRewardsButton compact />

          {/* Wallet - Compact */}
          <MultiTokenWallet compact />

          {/* Create Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-background border-border">
              <DropdownMenuItem onClick={() => navigate("/upload")} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Video
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

          {/* Notifications with Badge */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 relative"
            onClick={() => navigate("/reward-history")}
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </Button>

          {/* Profile / Sign In */}
          {user ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full p-0"
              onClick={() => navigate("/settings")}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                  {user.email?.[0].toUpperCase()}
                </div>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => navigate("/auth")}
              size="sm"
              className="h-7 text-[10px] px-2 font-medium"
            >
              Sign In
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSearchOpen(false)}
          className="h-8 w-8 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
        <form onSubmit={handleSearch} className="flex-1">
          <Input
            autoFocus={isSearchOpen}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm video..."
            className="w-full h-8 text-sm bg-muted border-border focus:border-primary rounded-full"
          />
        </form>
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