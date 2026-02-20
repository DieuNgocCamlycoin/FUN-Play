import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  History,
  Clock,
  ThumbsUp,
  ListMusic,
  Download,
  Film,
  ChevronRight,
  Library as LibraryIcon,
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";

const libraryItems = [
  {
    icon: History,
    label: "Lịch sử xem",
    description: "Video bạn đã xem gần đây",
    path: "/history",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Clock,
    label: "Xem sau",
    description: "Video đã lưu để xem sau",
    path: "/watch-later",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: ThumbsUp,
    label: "Video đã thích",
    description: "Tất cả video bạn đã thích",
    path: "/liked",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: ListMusic,
    label: "Danh sách phát",
    description: "Quản lý danh sách phát của bạn",
    path: "/manage-playlists",
    gradient: "from-purple-500 to-violet-500",
  },
  {
    icon: Film,
    label: "Video của bạn",
    description: "Video bạn đã tải lên",
    path: "/your-videos",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    icon: Download,
    label: "Video đã tải",
    description: "Video đã tải xuống để xem offline",
    path: "/downloads",
    gradient: "from-indigo-500 to-blue-500",
  },
];

const Library = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <LibraryIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Đăng nhập để xem thư viện</h2>
            <p className="text-muted-foreground mb-4">
              Lưu video, tạo danh sách phát và quản lý nội dung của bạn
            </p>
            <Button onClick={() => navigate("/auth")}>Đăng nhập</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <BackButton />
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center">
            <LibraryIcon className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Thư viện</h1>
            <p className="text-sm text-muted-foreground">
              Quản lý video và danh sách phát của bạn
            </p>
          </div>
        </div>

        {/* Library Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {libraryItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-accent/50 transition-all duration-200 text-left"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.label}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};

export default Library;
