import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CAMLYMiniWidgetProps {
  className?: string;
  compact?: boolean;
}

export const CAMLYMiniWidget = ({ className, compact = false }: CAMLYMiniWidgetProps) => {
  const { prices, loading } = useCryptoPrices();
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const navigate = useNavigate();

  const camlyPrice = prices["CAMLY"] || 0;

  useEffect(() => {
    if (camlyPrice > 0 && previousPrice !== null) {
      // Calculate mock 24h change based on price movement
      const change = ((camlyPrice - previousPrice) / previousPrice) * 100;
      setPriceChange24h(prev => {
        // Smooth the change to prevent jumps
        return prev * 0.8 + change * 0.2;
      });
    }
    
    if (camlyPrice > 0 && previousPrice === null) {
      setPreviousPrice(camlyPrice);
      // Random initial 24h change for demo
      setPriceChange24h((Math.random() - 0.5) * 10);
    }
  }, [camlyPrice, previousPrice]);

  const formatPrice = (price: number): string => {
    if (price === 0) return "$0.00";
    if (price < 0.00001) return `$${price.toExponential(2)}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const isPositive = priceChange24h >= 0;
  const TrendIcon = priceChange24h === 0 ? Minus : isPositive ? TrendingUp : TrendingDown;
  const trendColor = priceChange24h === 0 ? "text-muted-foreground" : isPositive ? "text-green-500" : "text-red-500";
  const bgColor = priceChange24h === 0 ? "bg-muted/50" : isPositive ? "bg-green-500/10" : "bg-red-500/10";

  if (loading) {
    return (
      <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 animate-pulse", className)}>
        <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">...</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => navigate("/camly-price")}
            className={cn(
              "flex items-center gap-1 rounded-full transition-all duration-300",
              "hover:scale-105 active:scale-95 cursor-pointer",
              bgColor,
              compact ? "px-1.5 py-0.5" : "px-2 py-1",
              className
            )}
          >
            {/* CAMLY Icon */}
            <img 
              src="/images/camly-coin.png" 
              alt="CAMLY" 
              className={cn("rounded-full", compact ? "h-3 w-3" : "h-4 w-4")}
            />
            
            {/* Price */}
            <span className={cn(
              "font-bold",
              trendColor,
              compact ? "text-[9px]" : "text-[11px]"
            )}>
              {formatPrice(camlyPrice)}
            </span>
            
            {/* Change indicator */}
            {!compact && (
              <div className={cn("flex items-center gap-0.5", trendColor)}>
                <TrendIcon className="h-3 w-3" />
                <span className="text-[9px] font-medium">
                  {Math.abs(priceChange24h).toFixed(1)}%
                </span>
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="space-y-1">
            <p className="font-bold">CAMLY Token</p>
            <p>Giá: {formatPrice(camlyPrice)}</p>
            <p className={trendColor}>
              24h: {isPositive ? "+" : ""}{priceChange24h.toFixed(2)}%
            </p>
            <p className="text-muted-foreground">Nhấn để xem chi tiết</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
