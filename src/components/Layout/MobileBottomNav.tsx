import { Home, Zap, Plus, Users, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { UploadVideoModal } from "@/components/Video/UploadVideoModal";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Zap, label: "Shorts", href: "/shorts" },
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
    lightTap();
    if (item.isCreate) {
      mediumTap();
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
      <nav className="fixed bottom-0 left-0 right-0 h-14 bg-gradient-to-r from-cyan-50/95 via-white to-cyan-50/95 dark:from-cyan-950/90 dark:via-background dark:to-cyan-950/90 backdrop-blur-lg border-t border-cyan-200/50 dark:border-cyan-800/30 z-50 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-full px-2">
          {navItems.map((item) => {
            const isActive = item.href ? location.pathname === item.href : false;
            const isCreateButton = item.isCreate;

            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-full transition-all duration-200",
                  isCreateButton
                    ? "relative"
                    : isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isCreateButton ? (
                  <div className="w-10 h-8 bg-foreground rounded-lg flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-background" strokeWidth={2.5} />
                  </div>
                ) : (
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-all",
                      isActive ? "fill-current" : ""
                    )}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                )}
                <span
                  className={cn(
                    "text-[10px]",
                    isActive ? "font-medium" : "font-normal",
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
