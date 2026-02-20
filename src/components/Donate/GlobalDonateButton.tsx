import { useState } from "react";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhancedDonateModal } from "./EnhancedDonateModal";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface GlobalDonateButtonProps {
  variant?: "default" | "mobile";
  className?: string;
}

export const GlobalDonateButton = ({ variant = "default", className }: GlobalDonateButtonProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!user) {
      toast({
        title: "Đăng nhập để tặng",
        description: "Vui lòng đăng nhập để sử dụng tính năng Thưởng & Tặng",
      });
      navigate("/auth");
      return;
    }
    setModalOpen(true);
  };

  if (variant === "mobile") {
    return (
      <>
        <Button
          size="icon"
          onClick={handleClick}
          className="relative h-9 w-9 rounded-full overflow-hidden
                     bg-[linear-gradient(180deg,#F9E37A_0%,#F0D96C_25%,#B78C1A_50%,#D4A94E_75%,#F9E37A_100%)]
                     shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-2px_6px_rgba(120,70,10,0.3),0_0_20px_rgba(198,143,26,0.5),0_2px_8px_rgba(120,70,10,0.4)]
                     hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-2px_6px_rgba(120,70,10,0.3),0_0_35px_rgba(240,217,108,0.7),0_0_60px_rgba(198,143,26,0.3),0_2px_8px_rgba(120,70,10,0.4)]
                     border border-t-[#F9E37A]/80 border-b-[#8B6914]/60 border-x-[#C28F1A]/60
                     transition-all duration-300 hover:scale-110 animate-luxury-pulse"
        >
          <Gift className="h-5 w-5 text-[#A9710F] relative z-10" />
          {/* Glossy highlight */}
          <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/40 via-white/20 to-transparent rounded-t-full pointer-events-none" />
          {/* Mirror shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-mirror-shimmer rounded-full" />
        </Button>
        <EnhancedDonateModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          contextType="global"
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleClick}
        className={`relative group overflow-hidden flex items-center gap-2 h-10
                   bg-[linear-gradient(180deg,#F9E37A_0%,#F0D96C_25%,#B78C1A_50%,#D4A94E_75%,#F9E37A_100%)]
                   text-[#A9710F] font-bold rounded-full px-4
                   shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-2px_6px_rgba(120,70,10,0.3),0_0_20px_rgba(198,143,26,0.5),0_2px_8px_rgba(120,70,10,0.4)]
                   hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),inset_0_-2px_6px_rgba(120,70,10,0.3),0_0_35px_rgba(240,217,108,0.7),0_0_60px_rgba(198,143,26,0.3),0_2px_8px_rgba(120,70,10,0.4)]
                   border border-t-[#F9E37A]/80 border-b-[#8B6914]/60 border-x-[#C28F1A]/60
                   transition-all duration-300 hover:scale-105 animate-luxury-pulse ${className}`}
      >
        <Gift className="h-4 w-4 relative z-10" />
        <span className="text-base font-extrabold hidden md:inline relative z-10 tracking-wide">THƯỞNG & TẶNG</span>
        {/* Glossy highlight */}
        <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/40 via-white/20 to-transparent rounded-t-full pointer-events-none" />
        {/* Mirror shimmer effect - continuous */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-mirror-shimmer" />
      </Button>
      <EnhancedDonateModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contextType="global"
      />
    </>
  );
};
