import { LayoutDashboard, Video, ListVideo, Settings, MessageSquare, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface StudioSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Tổng quan", disabled: true },
  { id: "content", icon: Video, label: "Nội dung", disabled: false },
  { id: "playlists", icon: ListVideo, label: "Danh sách phát", disabled: false },
  { id: "analytics", icon: BarChart3, label: "Phân tích", disabled: true },
  { id: "comments", icon: MessageSquare, label: "Bình luận", disabled: true },
  { id: "subtitles", icon: FileText, label: "Phụ đề", disabled: true },
  { id: "settings", icon: Settings, label: "Cài đặt", disabled: false },
];

export const StudioSidebar = ({ isOpen, onClose, activeTab, onTabChange }: StudioSidebarProps) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-14 bottom-0 w-60 bg-background border-r border-border z-40 transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <ScrollArea className="h-full">
          <div className="py-4 px-2">
            <div className="mb-4 px-4">
              <h2 className="text-lg font-semibold text-foreground">Studio</h2>
            </div>

            <div className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  disabled={item.disabled}
                  onClick={() => {
                    if (!item.disabled) {
                      onTabChange(item.id);
                      onClose();
                    }
                  }}
                  className={cn(
                    "w-full justify-start gap-3 px-4 py-2.5 h-auto",
                    activeTab === item.id && !item.disabled
                      ? "bg-primary/10 text-primary font-medium hover:bg-primary/20"
                      : "hover:bg-muted",
                    item.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.disabled && (
                    <span className="ml-auto text-xs text-muted-foreground">Sắp có</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};
