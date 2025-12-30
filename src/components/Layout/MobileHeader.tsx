import { Search, Bell, X, Cast } from "lucide-react";
import funplayLogo from "@/assets/funplay-logo.jpg";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface MobileHeaderProps {
  onMenuClick?: () => void;
}

export const MobileHeader = ({ onMenuClick }: MobileHeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);

  // Fetch notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!user) {
        setNotificationCount(0);
        return;
      }

      try {
        const { count } = await supabase
          .from('reward_transactions')
          .select('amount', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('claimed', false)
          .eq('status', 'success');

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
      setSearchQuery("");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-gradient-to-r from-cyan-50 via-white to-cyan-50 dark:from-cyan-950/80 dark:via-background/95 dark:to-cyan-950/80 backdrop-blur-lg border-b border-cyan-200/50 dark:border-cyan-800/30 z-50 lg:hidden">
      {/* Normal Header - YouTube Style */}
      <div
        className={cn(
          "flex items-center justify-between h-full px-3 transition-opacity duration-200",
          isSearchOpen && "opacity-0 pointer-events-none"
        )}
      >
        {/* Left - Logo Only (YouTube style) */}
        <div
          className="flex items-center cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img 
            src={funplayLogo} 
            alt="FUN Play" 
            className="h-8 w-auto rounded object-cover"
          />
        </div>

        {/* Right - Cast, Notifications, Search (YouTube style) */}
        <div className="flex items-center gap-2">
          {/* Cast */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
          >
            <Cast className="h-5 w-5" />
          </Button>

          {/* Notifications with Badge */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 relative"
            onClick={() => navigate("/reward-history")}
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Button>

          {/* Search */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(true)}
            className="h-10 w-10"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search Mode */}
      <div
        className={cn(
          "absolute inset-0 flex items-center gap-2 px-3 bg-gradient-to-r from-cyan-50 via-white to-cyan-50 dark:from-cyan-950/80 dark:via-background dark:to-cyan-950/80 transition-opacity duration-200",
          isSearchOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSearchOpen(false)}
          className="h-10 w-10 shrink-0"
        >
          <X className="h-5 w-5" />
        </Button>
        <form onSubmit={handleSearch} className="flex-1">
          <Input
            autoFocus={isSearchOpen}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm trên FUN Play"
            className="w-full h-10 text-sm bg-muted border-border focus:border-primary rounded-full px-4"
          />
        </form>
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          onClick={handleSearch}
          className="h-10 w-10 shrink-0"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};