import { Search, Bell, Menu, Play, X, Plus, Upload, Music, FileText, Coins, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiTokenWallet } from "@/components/Web3/MultiTokenWallet";
import { CAMLYMiniWidget } from "@/components/Web3/CAMLYMiniWidget";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { ClaimRewardsModal } from "@/components/Rewards/ClaimRewardsModal";

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
  const [unclaimedRewards, setUnclaimedRewards] = useState(0);
  const [claimModalOpen, setClaimModalOpen] = useState(false);

  // Fetch unclaimed rewards count as notification indicator
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!user) {
        setNotificationCount(0);
        setUnclaimedRewards(0);
        return;
      }

      try {
        const { data, count } = await supabase
          .from('reward_transactions')
          .select('amount', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('claimed', false)
          .eq('status', 'success');

        setNotificationCount(count || 0);
        setUnclaimedRewards(data?.length || 0);
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
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-px shrink-0">
            {/* CAMLY Price Widget */}
            <CAMLYMiniWidget compact className="mr-1" />
            
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

            {/* Claim Rewards - Always show icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => user ? setClaimModalOpen(true) : navigate("/auth")}
                  className="h-7 w-7 relative text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                >
                  <Coins className="h-3.5 w-3.5" />
                  {unclaimedRewards > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[12px] h-3 px-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unclaimedRewards > 9 ? '9+' : unclaimedRewards}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Nhận thưởng CAMLY
              </TooltipContent>
            </Tooltip>

            {/* Wallet - Compact */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <MultiTokenWallet compact />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Ví tiền điện tử
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
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Tạo nội dung
              </TooltipContent>
            </Tooltip>

            {/* Download App - with pulse animation */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/install")}
                  className="h-7 w-7 relative text-green-500 hover:text-green-400 hover:bg-green-500/10 group"
                >
                  <Download className="h-3.5 w-3.5 relative z-10" />
                  {/* Pulse ring animation */}
                  <span className="absolute inset-0 rounded-md bg-green-500/20 animate-ping" />
                  <span className="absolute inset-0.5 rounded-md bg-green-500/10 animate-pulse" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Tải App FUN Play
              </TooltipContent>
            </Tooltip>

            {/* Notifications with Badge */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 relative"
                  onClick={() => navigate("/reward-history")}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full p-0"
                    onClick={() => navigate("/settings")}
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
                ) : (
                  <Button
                    onClick={() => navigate("/auth")}
                    size="sm"
                    className="h-6 text-[9px] px-1.5 font-medium"
                  >
                    Sign In
                  </Button>
                )}
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {user ? "Cài đặt tài khoản" : "Đăng nhập / Đăng ký"}
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Claim Rewards Modal */}
      <ClaimRewardsModal open={claimModalOpen} onOpenChange={setClaimModalOpen} />

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