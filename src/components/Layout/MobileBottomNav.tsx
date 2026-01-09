import { Home, Plus, Users, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { UploadVideoModal } from "@/components/Video/UploadVideoModal";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface NavItem {
  icon?: typeof Home;
  customIcon?: string;
  label: string;
  href: string | null;
  isCreate?: boolean;
  isWallet?: boolean;
}

const navItems: NavItem[] = [
  { 
    customIcon: '/images/fun-wallet-logo.png',
    label: "Ví FUN", 
    href: "/fun-wallet",
    isWallet: true
  },
  { icon: Home, label: "Home", href: "/" },
  { icon: Plus, label: "Tạo", href: null, isCreate: true },
  { icon: Users, label: "Đăng ký", href: "/subscriptions" },
  { icon: User, label: "Bạn", href: "/your-videos" },
];

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const { lightTap, mediumTap } = useHapticFeedback();

  const handleNavClick = (item: typeof navItems[0]) => {
    lightTap(); // Haptic feedback on every nav tap
    if (item.isCreate) {
      mediumTap(); // Stronger feedback for create button
      if (user) {
        setUploadModalOpen(true);
      } else {
        navigate("/auth");
      }
      return;
    }
    if (item.href) {
      navigate(item.href);
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-lg border-t border-border z-50 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-full px-2">
          {navItems.map((item) => {
            const isActive = item.href ? location.pathname === item.href : false;
            const isCreateButton = item.isCreate;

            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-[64px] h-full transition-all duration-200",
                  isCreateButton
                    ? "relative"
                    : isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.customIcon ? (
                  <div className={cn(
                    "p-1.5 rounded-full transition-all",
                    item.isWallet && "bg-gradient-to-r from-yellow-500/20 to-orange-500/20",
                    isActive && "ring-2 ring-yellow-500/50"
                  )}>
                    <img 
                      src={item.customIcon} 
                      alt={item.label} 
                      className="h-5 w-5 rounded-full"
                    />
                  </div>
                ) : isCreateButton ? (
                  <div className="w-12 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
                    <item.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                ) : item.icon ? (
                  <item.icon
                    className={cn(
                      "h-6 w-6 transition-all",
                      isActive && "scale-110"
                    )}
                  />
                ) : null}
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isCreateButton && "mt-0.5"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <UploadVideoModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
    </>
  );
};
