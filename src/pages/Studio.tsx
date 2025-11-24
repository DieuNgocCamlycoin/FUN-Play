import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { StudioSidebar } from "@/components/Studio/StudioSidebar";
import { StudioContent } from "@/components/Studio/StudioContent";
import { StudioPlaylists } from "@/components/Studio/StudioPlaylists";
import { StudioSettings } from "@/components/Studio/StudioSettings";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const Studio = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Parse tab from URL query params
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [user, navigate, location]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/studio?tab=${tab}`);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "content":
        return <StudioContent />;
      case "playlists":
        return <StudioPlaylists />;
      case "settings":
        return <StudioSettings />;
      default:
        return <StudioContent />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex pt-14">
        <StudioSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        
        <main className="flex-1 lg:ml-60">
          <div className="border-b border-border bg-muted/30 px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Creator Studio</span>
              <span>•</span>
              <span className="text-foreground font-medium">
                {activeTab === "content" && "Nội dung"}
                {activeTab === "playlists" && "Danh sách phát"}
                {activeTab === "settings" && "Cài đặt kênh"}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Studio;
