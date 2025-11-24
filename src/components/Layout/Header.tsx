import { Search, Video, Bell, Menu, Play, User as UserIcon, LogOut, Settings, Radio, SquarePen, Plus, FileVideo, List, Upload, ListVideo } from "lucide-react";
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
        <div className="flex items-center gap-2 cursor-pointer hover:bg-hover-yellow hover:text-primary rounded-lg px-3 py-2 transition-all duration-300" onClick={() => navigate("/")}>
          <div className="bg-logo-bg rounded-md px-2 py-1.5 flex items-center justify-center shadow-lg">
            <Play className="h-7 w-7 text-white fill-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Fun<span className="font-extrabold">Play</span>
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
              <Button 
                size="lg" 
                className="gap-2 bg-green-600 hover:bg-hover-yellow hover:text-primary text-white font-bold transition-all duration-300 shadow-lg border-2 border-green-700 px-6 py-2"
              >
                <Plus className="h-5 w-5" />
                TẠO
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem onClick={() => navigate("/your-videos")} className="cursor-pointer py-3 gap-3 hover:bg-hover-yellow hover:text-primary">
                <Video className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <div className="font-bold">Video Của Tôi</div>
                  <div className="text-xs text-muted-foreground">Xem, sửa, xóa video</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setUploadModalOpen(true)} className="cursor-pointer py-3 gap-3 hover:bg-hover-yellow hover:text-primary">
                <Upload className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <div className="font-bold">Tải Video Lên</div>
                  <div className="text-xs text-muted-foreground">Đăng video mới (10GB)</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/manage-playlists")} className="cursor-pointer py-3 gap-3 hover:bg-hover-yellow hover:text-primary">
                <ListVideo className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <div className="font-bold">Danh Sách Phát</div>
                  <div className="text-xs text-muted-foreground">Quản lý playlist</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/manage-channel")} className="cursor-pointer py-3 gap-3 hover:bg-hover-yellow hover:text-primary">
                <Settings className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <div className="font-bold">Quản Lý Kênh</div>
                  <div className="text-xs text-muted-foreground">Tên, avatar, banner</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/create-post")} className="cursor-pointer py-3 gap-3 hover:bg-hover-yellow hover:text-primary">
                <SquarePen className="h-5 w-5 text-cyan-600" />
                <div className="flex-1">
                  <div className="font-bold">Tạo Bài Viết</div>
                  <div className="text-xs text-muted-foreground">Đăng bài mới</div>
                </div>
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
