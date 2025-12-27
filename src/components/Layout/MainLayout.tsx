import { useState, ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { MobileDrawer } from "./MobileDrawer";
import { MobileBottomNav } from "./MobileBottomNav";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header & Sidebar */}
      <div className="hidden lg:block">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Mobile Header & Drawer */}
      <div className="lg:hidden">
        <MobileHeader onMenuClick={() => setIsMobileDrawerOpen(true)} />
        <MobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} />
        {showBottomNav && <MobileBottomNav />}
      </div>

      <main className={`pt-14 pb-20 lg:pb-0 lg:pl-64 ${className}`}>
        {children}
      </main>
    </div>
  );
};
