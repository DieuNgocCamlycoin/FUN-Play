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
                     bg-gradient-to-b from-[#FFEA00] via-[#FFD700] to-[#E5A800]
                     shadow-[0_0_12px_rgba(255,215,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.5)]
                     hover:shadow-[0_0_20px_rgba(255,234,0,0.7)]
                     border border-[#FFEA00]/50
                     transition-all duration-300 hover:scale-110"
        >
          <Gift className="h-5 w-5 text-[#7C5800]" />
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
        className={`relative group overflow-hidden flex items-center gap-2 
                   bg-gradient-to-b from-[#FFEA00] via-[#FFD700] to-[#E5A800] 
                   text-[#7C5800] font-bold rounded-full px-4 py-2
                   shadow-[0_0_15px_rgba(255,215,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.6),inset_0_-1px_2px_rgba(0,0,0,0.1)] 
                   hover:shadow-[0_0_25px_rgba(255,234,0,0.6),0_0_40px_rgba(255,215,0,0.3)] 
                   border border-[#FFEA00]/60 
                   transition-all duration-300 hover:scale-105 ${className}`}
      >
        <Gift className="h-4 w-4" />
        <span className="text-sm font-bold hidden md:inline">Thưởng & Tặng</span>
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      </Button>
      <EnhancedDonateModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contextType="global"
      />
    </>
  );
};
