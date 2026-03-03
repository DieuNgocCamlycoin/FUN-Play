import { Header } from "@/components/Layout/Header";
import { useLiveDirectory } from "@/hooks/useLivestream";
import { LiveCard } from "@/components/Live/LiveCard";
import { LiveBadge } from "@/components/Live/LiveBadge";
import { Button } from "@/components/ui/button";
import { Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const LiveDirectory = () => {
  const { livestreams, isLoading } = useLiveDirectory();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => {}} />
      <div className="pt-14 max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Đang phát sóng</h1>
            <LiveBadge size="md" />
          </div>
          {user && (
            <Button onClick={() => navigate("/go-live")} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              <Radio className="h-4 w-4 mr-2" />
              Phát sóng
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-video rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : livestreams.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📡</p>
            <p className="text-lg font-semibold mb-2">Không có ai đang phát sóng</p>
            <p className="text-sm text-muted-foreground mb-4">
              Hãy là người đầu tiên phát sóng trực tiếp!
            </p>
            {user && (
              <Button onClick={() => navigate("/go-live")} variant="outline">
                <Radio className="h-4 w-4 mr-2" />
                Bắt đầu phát sóng
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {livestreams.map((ls) => (
              <LiveCard key={ls.id} livestream={ls} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveDirectory;
