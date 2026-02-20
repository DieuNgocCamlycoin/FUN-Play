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
                     bg-gradient-to-b from-[#F9E37A] via-[#F0D96C] to-[#B78C1A]
                     shadow-[0_0_12px_rgba(198,143,26,0.5),inset_0_1px_2px_rgba(255,255,255,0.5)]
                     hover:shadow-[0_0_20px_rgba(240,217,108,0.7)]
                     border border-[#C28F1A]/50
                     transition-all duration-300 hover:scale-110"
        >
          <Gift className="h-5 w-5 text-[#A9710F] relative z-10" />
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
                   bg-gradient-to-b from-[#F9E37A] via-[#F0D96C] to-[#B78C1A] 
                   text-[#A9710F] font-bold rounded-full px-4
                   shadow-[0_0_15px_rgba(198,143,26,0.4),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-1px_2px_rgba(0,0,0,0.1)] 
                   hover:shadow-[0_0_25px_rgba(240,217,108,0.6),0_0_40px_rgba(198,143,26,0.3)] 
                   border border-[#C28F1A]/60
                   transition-all duration-300 hover:scale-105 ${className}`}
      >
        <Gift className="h-4 w-4 relative z-10" />
        <span className="text-base font-extrabold hidden md:inline relative z-10 tracking-wide">THƯỞNG & TẶNG</span>
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
