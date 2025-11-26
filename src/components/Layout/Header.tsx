import { Search, Video, Bell, Menu, Play, User as UserIcon, LogOut, Settings, Radio, SquarePen, Plus, FileVideo, List } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { MultiTokenWallet } from "@/components/Web3/MultiTokenWallet";
import { UploadVideoModal } from "@/components/Video/UploadVideoModal";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ id: string; title: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      const { data } = await supabase
        .from("videos")
        .select("id, title")
        .ilike("title", `%${searchQuery}%`)
        .eq("is_public", true)
        .limit(5);

      setSuggestions(data || []);
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Check if it's a YouTube URL
      const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;
      const match = searchQuery.match(youtubeRegex);

      if (match && match[1]) {
        // Open YouTube video in new tab
        window.open(`https://www.youtube.com/watch?v=${match[1]}`, "_blank");
        setSearchQuery("");
      } else {
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
    }
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (videoId: string) => {
    navigate(`/watch/${videoId}`);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-50 flex items-center justify-between px-4 gap-4">
      {/* Left section */}
      <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>
        <div className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 rounded-xl px-4 py-2 transition-all duration-300 border border-border/50 hover:border-primary/30 shadow-sm hover:shadow-md" onClick={() => navigate("/")}>
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-lg px-3 py-2 flex items-center justify-center shadow-lg">
            <Play className="h-6 w-6 text-white fill-white" />
          </div>
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-[#00E7FF] to-[#00B8D4] bg-clip-text text-transparent">
            FUN Play
          </span>
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
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Tìm kiếm hoặc dán link YouTube..."
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
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion.id)}
                className="w-full px-4 py-3 text-left hover:bg-accent flex items-center gap-3 transition-colors"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{suggestion.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <MultiTokenWallet />
        
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
        
        <Button variant="ghost" size="icon" className="hidden md:flex">
          <Bell className="h-5 w-5" />
        </Button>
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {user.email?.[0].toUpperCase()}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/your-videos")}>
                <UserIcon className="mr-2 h-4 w-4" />
                Video của bạn
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => navigate("/auth")} size="sm" variant="default">
            Sign In
          </Button>
        )}
      </div>
      
      <UploadVideoModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
    </header>
  );
};
