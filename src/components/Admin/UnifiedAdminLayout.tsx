import { useState } from "react";
import funplayPlanetLogo from "@/assets/funplay-planet-logo.png";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Coins, 
  Users, 
  Video, 
  Settings, 
  Crown,
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu,
  Home,
  BarChart3,
  Fingerprint,
  Flag,
  Sparkles
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export type AdminSection = 
  | "overview" 
  | "rewards" 
  | "users" 
  | "videos" 
  | "config" 
  | "admin-team"
  | "fun-money"
  | "fun-money-stats"
  | "abuse-detection"
  | "user-stats"
  | "wallet-detective"
  | "reports"
  | "transparency";

interface NavItem {
  id: AdminSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  ownerOnly?: boolean;
}

interface UnifiedAdminLayoutProps {
  children: React.ReactNode;
  currentSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  pendingCount?: number;
  isOwner?: boolean;
}

const navItems: NavItem[] = [
  { id: "overview", label: "Tổng Quan", icon: LayoutDashboard },
  { id: "rewards", label: "CAMLY Rewards", icon: Coins },
  { id: "fun-money", label: "FUN Money", icon: Coins },
  { id: "fun-money-stats", label: "FUN Money Stats", icon: BarChart3 },
  { id: "abuse-detection", label: "Phát Hiện Lạm Dụng", icon: Shield },
  { id: "users", label: "Quản Lý Users", icon: Users },
  { id: "videos", label: "Quản Lý Video", icon: Video },
  { id: "config", label: "Cấu Hình", icon: Settings },
  { id: "user-stats", label: "Thống Kê Users", icon: BarChart3 },
  { id: "wallet-detective", label: "Wallet Detective", icon: Fingerprint },
  { id: "reports", label: "Báo Cáo", icon: Flag },
  { id: "transparency", label: "PPLP Transparency", icon: Sparkles },
  { id: "admin-team", label: "Quản Lý Admin", icon: Crown, ownerOnly: true },
];

export function UnifiedAdminLayout({
  children,
  currentSection,
  onSectionChange,
  pendingCount = 0,
  isOwner = false,
}: UnifiedAdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const filteredNavItems = navItems.filter(
    (item) => !item.ownerOnly || isOwner
  );

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <img src={funplayPlanetLogo} alt="FUN Play" className="w-10 h-10 rounded-xl object-cover" />
          {!collapsed && (
            <div>
              <h2 className="font-bold text-foreground">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">FUN Play</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 p-2">
        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            const showBadge = item.id === "rewards" && pendingCount > 0;

            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/20",
                  collapsed && "justify-center px-2"
                )}
                onClick={() => {
                  onSectionChange(item.id);
                  if (isMobile) setMobileOpen(false);
                }}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {showBadge && (
                      <Badge 
                        variant="destructive" 
                        className="h-5 min-w-5 px-1.5 text-xs"
                      >
                        {pendingCount}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t border-border/50">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <Home className="w-5 h-5" />
          {!collapsed && <span>Về Trang Chủ</span>}
        </Button>
        
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-1 h-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span className="text-xs">Thu gọn</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center gap-3 p-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <NavContent />
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] to-[#FF00E5] bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
        </div>

        {/* Content */}
        <main className="p-4">{children}</main>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "sticky top-0 h-screen border-r border-border/50 bg-card/50 transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
