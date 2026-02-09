import { useState } from "react";
import { Copy, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WalletAddressDisplayProps {
  address: string | null;
  fullAddress: string | null;
  chain?: string | null;
  label?: string;
  showCopy?: boolean;
  showExplorer?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function WalletAddressDisplay({
  address,
  fullAddress,
  chain = "BSC",
  label,
  showCopy = true,
  showExplorer = true,
  className,
  size = "md",
}: WalletAddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  if (!address && !fullAddress) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const displayAddress = address || (fullAddress ? `${fullAddress.slice(0, 6)}...${fullAddress.slice(-4)}` : "");
  const actualFullAddress = fullAddress || address || "";

  const getExplorerUrl = () => {
    switch (chain?.toLowerCase()) {
      case "bsc":
        return `https://bscscan.com/address/${actualFullAddress}`;
      case "eth":
        return `https://etherscan.io/address/${actualFullAddress}`;
      case "btc":
        return `https://blockstream.info/address/${actualFullAddress}`;
      default:
        return `https://bscscan.com/address/${actualFullAddress}`;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(actualFullAddress);
      setCopied(true);
      toast.success("Đã sao chép địa chỉ ví!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Không thể sao chép");
    }
  };

  const sizeClasses = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {label && (
        <span className={cn("text-muted-foreground", sizeClasses[size])}>{label}:</span>
      )}
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn(
              "font-mono text-muted-foreground hover:text-foreground cursor-default transition-colors",
              sizeClasses[size]
            )}>
              {displayAddress}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-mono text-xs break-all">{actualFullAddress}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showCopy && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 hover:bg-primary/10"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className={cn(iconSizes[size], "text-green-500")} />
          ) : (
            <Copy className={cn(iconSizes[size], "text-muted-foreground hover:text-primary")} />
          )}
        </Button>
      )}

      {showExplorer && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 hover:bg-primary/10"
          onClick={() => window.open(getExplorerUrl(), "_blank")}
        >
          <ExternalLink className={cn(iconSizes[size], "text-muted-foreground hover:text-primary")} />
        </Button>
      )}
    </div>
  );
}
