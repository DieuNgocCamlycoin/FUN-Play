import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const CAMLY_CONTRACT = "0x0910320181889fefde0bb1ca63962b0a8882e413";
const DEXSCREENER_URL = `https://dexscreener.com/bsc/${CAMLY_CONTRACT}`;
const BSCSCAN_URL = `https://bscscan.com/token/${CAMLY_CONTRACT}`;

type TimeFrame = "5m" | "15m" | "1h" | "1d";

export const CAMLYPriceSection = () => {
  const { prices, loading } = useCryptoPrices();
  const [timeframe, setTimeframe] = useState<TimeFrame>("1h");
  
  const camlyPrice = prices["CAMLY"] || 0;
  
  // Mock 24h change - in production, this would come from API
  const [priceChange24h] = useState(() => (Math.random() - 0.3) * 10); // Random change for demo
  const isPositive = priceChange24h >= 0;
  const TrendIcon = Math.abs(priceChange24h) < 0.1 ? Minus : isPositive ? TrendingUp : TrendingDown;
  const trendColor = priceChange24h === 0 ? "text-muted-foreground" : isPositive ? "text-green-500" : "text-red-500";

  const formatPrice = (price: number): string => {
    if (price === 0) return "$0.00";
    if (price < 0.00001) return `$${price.toExponential(2)}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  // DexScreener embed URL with timeframe
  const getEmbedUrl = () => {
    const intervals: Record<TimeFrame, string> = {
      "5m": "5",
      "15m": "15",
      "1h": "60",
      "1d": "1440"
    };
    return `https://dexscreener.com/bsc/${CAMLY_CONTRACT}?embed=1&theme=light&trades=0&info=0&interval=${intervals[timeframe]}`;
  };

  return (
    <Card className="bg-white backdrop-blur-xl border border-gray-100 shadow-lg overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <motion.div 
              className="relative"
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(255, 215, 0, 0.4)",
                  "0 0 40px rgba(255, 215, 0, 0.6)",
                  "0 0 20px rgba(255, 215, 0, 0.4)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <img 
                src="/images/camly-coin.png" 
                alt="CAMLY" 
                className="h-14 w-14 rounded-full"
              />
            </motion.div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                CAMLY Token
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">BSC</span>
              </CardTitle>
              <div className="flex items-center gap-3 mt-1">
                {loading ? (
                  <span className="text-2xl font-bold text-muted-foreground animate-pulse">Loading...</span>
                ) : (
                  <>
                    <span className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                      {formatPrice(camlyPrice)}
                    </span>
                    <div className={cn("flex items-center gap-1 text-sm font-medium", trendColor)}>
                      <TrendIcon className="h-4 w-4" />
                      <span>{isPositive ? "+" : ""}{priceChange24h.toFixed(2)}%</span>
                      <span className="text-muted-foreground text-xs">24h</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(DEXSCREENER_URL, "_blank")}
              className="gap-2"
            >
              <img src="https://dexscreener.com/favicon.ico" alt="DexScreener" className="h-4 w-4" />
              DexScreener
              <ExternalLink className="h-3 w-3" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(BSCSCAN_URL, "_blank")}
              className="gap-2"
            >
              <img src="https://bscscan.com/images/favicon.ico" alt="BSCScan" className="h-4 w-4" />
              BSCScan
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {/* Timeframe Tabs */}
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as TimeFrame)} className="mb-4">
          <TabsList className="grid grid-cols-4 w-full max-w-xs">
            <TabsTrigger value="5m">5 phút</TabsTrigger>
            <TabsTrigger value="15m">15 phút</TabsTrigger>
            <TabsTrigger value="1h">1 giờ</TabsTrigger>
            <TabsTrigger value="1d">1 ngày</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* DexScreener Chart Embed */}
        <div className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
          <iframe
            src={getEmbedUrl()}
            className="w-full h-full border-0"
            title="CAMLY Price Chart"
            allow="clipboard-write"
          />
        </div>
        
        {/* Contract Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Contract Address:</span>{" "}
            <code className="bg-background px-1 py-0.5 rounded text-[10px]">
              {CAMLY_CONTRACT}
            </code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
