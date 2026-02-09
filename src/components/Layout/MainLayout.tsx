import { useState, ReactNode } from "react";
import { Header } from "./Header";
import { CollapsibleSidebar } from "./CollapsibleSidebar";
import { MobileHeader } from "./MobileHeader";
import { MobileDrawer } from "./MobileDrawer";
import { MobileBottomNav } from "./MobileBottomNav";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  showBottomNav?: boolean;
}

export const MainLayout = ({ 
  children, 
  className = "",
  showBottomNav = true 
}: MainLayoutProps) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header & Sidebar */}
      <div className="hidden lg:block">
        <Header onMenuClick={() => setIsSidebarExpanded(prev => !prev)} />
        <CollapsibleSidebar isExpanded={isSidebarExpanded} />
      </div>

      {/* Mobile Header & Drawer */}
      <div className="lg:hidden">
        <MobileHeader onMenuClick={() => setIsMobileDrawerOpen(true)} />
        <MobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} />
        {showBottomNav && <MobileBottomNav />}
      </div>

      <main className={cn(
        "pt-14 pb-20 lg:pt-14 lg:pb-0 transition-all duration-300",
        isSidebarExpanded ? "lg:pl-60" : "lg:pl-16",
        className
      )}>
        {children}
      </main>
    </div>
  );
};
