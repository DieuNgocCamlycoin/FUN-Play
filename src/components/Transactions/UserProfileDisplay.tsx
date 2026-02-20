import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, ExternalLink, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface UserProfileDisplayProps {
  userId: string | null;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  walletAddress: string | null;
  walletAddressFull: string | null;
  chain?: string | null;
  align?: "left" | "right";
  size?: "sm" | "md";
  showWallet?: boolean;
  className?: string;
}

export const UserProfileDisplay = memo(function UserProfileDisplay({
  userId,
  displayName,
  username,
  avatarUrl,
  walletAddress,
  walletAddressFull,
  chain = "BSC",
  align = "left",
  size = "md",
  showWallet = true,
  className,
}: UserProfileDisplayProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopyWallet = async () => {
    if (!walletAddressFull) return;
    try {
      await navigator.clipboard.writeText(walletAddressFull);
      setCopied(true);
      toast.success("Đã sao chép địa chỉ ví!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const handleExplorer = () => {
    if (!walletAddressFull) return;
    const explorerBase = chain?.toLowerCase() === "eth" 
      ? "https://etherscan.io/address/" 
      : "https://bscscan.com/address/";
    window.open(explorerBase + walletAddressFull, "_blank");
  };

  const handleUserClick = () => {
    const identifier = username || userId;
    if (identifier) {
      navigate(`/${identifier}`);
    }
  };

  const avatarSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const usernameSize = size === "sm" ? "text-[10px]" : "text-xs";
  const walletTextSize = size === "sm" ? "text-[9px]" : "text-[10px]";
  const buttonSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const iconSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <div 
      className={cn(
        "flex items-start gap-2",
        align === "right" && "flex-row-reverse",
        className
      )}
    >
      {/* Avatar */}
      <Avatar 
        className={cn(
          avatarSize,
          "cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all flex-shrink-0"
        )}
        onClick={handleUserClick}
      >
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      {/* Info */}
      <div className={cn("min-w-0", align === "right" && "text-right")}>
        {/* Display Name */}
        <p 
          className={cn(
            textSize,
            "font-medium truncate cursor-pointer hover:text-primary transition-colors"
          )}
          onClick={handleUserClick}
        >
          {displayName}
        </p>
        
        {/* Username */}
        <p className={cn(usernameSize, "text-muted-foreground truncate")}>
          {username}
        </p>
        
        {/* Wallet Address */}
        {showWallet && walletAddress && (
          <div className={cn(
            "flex items-center gap-1 mt-0.5",
            align === "right" && "justify-end"
          )}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn(
                    walletTextSize,
                    "font-mono text-muted-foreground cursor-default"
                  )}>
                    {walletAddress}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs break-all max-w-xs">
                    {walletAddressFull || walletAddress}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {walletAddressFull && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className={buttonSize}
                  onClick={handleCopyWallet}
                >
                  {copied ? (
                    <Check className={cn(iconSize, "text-green-500")} />
                  ) : (
                    <Copy className={iconSize} />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={buttonSize}
                  onClick={handleExplorer}
                >
                  <ExternalLink className={iconSize} />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
});