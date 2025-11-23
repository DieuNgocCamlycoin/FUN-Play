import { Search, Video, Bell, Menu, Play, User as UserIcon, LogOut, Settings, Radio, SquarePen, Plus, FileVideo, List } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-50 flex items-center justify-between px-4 gap-4">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 cursor-pointer hover:bg-hover-blue dark:hover:bg-hover-blue-dark rounded-lg px-2 py-1.5 transition-colors" onClick={() => navigate("/")}>
          <div className="bg-logo-bg rounded-sm px-1 py-0.5 flex items-center justify-center">
            <Play className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: "'Roboto', sans-serif", letterSpacing: '-0.5px' }}>
            FUN<span className="font-normal">PLAY</span>
          </span>
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-2xl">
        <form onSubmit={handleSearch} className="relative">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
