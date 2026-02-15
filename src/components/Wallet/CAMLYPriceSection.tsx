import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, TrendingUp, TrendingDown, Minus, RefreshCw, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCAMLYPriceHistory, TimePeriod } from "@/hooks/useCAMLYPriceHistory";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const CAMLY_CONTRACT = "0x0910320181889fefde0bb1ca63962b0a8882e413";
const COINMARKETCAP_URL = "https://coinmarketcap.com/currencies/camly-coin/";
const DEXSCREENER_URL = `https://dexscreener.com/bsc/${CAMLY_CONTRACT}`;
const BSCSCAN_URL = `https://bscscan.com/token/${CAMLY_CONTRACT}`;

export const CAMLYPriceSection = () => {
  const [period, setPeriod] = useState<TimePeriod>("24h");
  const [copied, setCopied] = useState(false);
  const { priceHistory, loading, currentPrice, priceChange, refetch } = useCAMLYPriceHistory(period);

  const isPositive = priceChange >= 0;
  const TrendIcon = Math.abs(priceChange) < 0.1 ? Minus : isPositive ? TrendingUp : TrendingDown;
  const trendColor = Math.abs(priceChange) < 0.1 ? "text-muted-foreground" : isPositive ? "text-green-500" : "text-red-500";
  const chartColor = isPositive ? "#22c55e" : "#ef4444";
  const gradientId = isPositive ? "greenGradient" : "redGradient";

  const formatPrice = (price: number): string => {
    if (price === 0) return "$0.00";
    if (price < 0.00001) return `$${price.toExponential(2)}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (period === "24h") {
      return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  };

  const handleCopyContract = async () => {
    await navigator.clipboard.writeText(CAMLY_CONTRACT);
    setCopied(true);
    toast.success("Đã sao chép địa chỉ contract!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-white backdrop-blur-xl border border-gray-100 shadow-lg overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Logo & Price */}
          <div className="flex items-center gap-4">
            <motion.div
              className="relative"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(255, 215, 0, 0.4)",
                  "0 0 40px rgba(255, 215, 0, 0.6)",
                  "0 0 20px rgba(255, 215, 0, 0.4)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <img
                src="/images/camly-coin-new.png"
                alt="CAMLY"
                className="h-14 w-14 rounded-full object-cover"
                style={{ mixBlendMode: 'multiply' }}
              />
            </motion.div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                CAMLY Token
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  BSC
                </span>
              </CardTitle>
              <div className="flex items-center gap-3 mt-1">
                {loading && priceHistory.length === 0 ? (
                  <span className="text-2xl font-bold text-gray-400 animate-pulse">
                    Đang tải...
                  </span>
                ) : (
                  <>
                    <span className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                      {formatPrice(currentPrice)}
                    </span>
                    <div className={cn("flex items-center gap-1 text-sm font-medium", trendColor)}>
                      <TrendIcon className="h-4 w-4" />
                      <span>
                        {isPositive ? "+" : ""}
                        {priceChange.toFixed(2)}%
                      </span>
                      <span className="text-muted-foreground text-xs">{period}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="icon"
              onClick={refetch}
              disabled={loading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(COINMARKETCAP_URL, "_blank")}
              className="gap-2"
            >
              <img
                src="https://coinmarketcap.com/favicon.ico"
                alt="CMC"
                className="h-4 w-4"
              />
              CoinMarketCap
              <ExternalLink className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(DEXSCREENER_URL, "_blank")}
              className="gap-2"
            >
              DexScreener
              <ExternalLink className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(BSCSCAN_URL, "_blank")}
              className="gap-2"
            >
              BSCScan
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Timeframe Tabs */}
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as TimePeriod)}
          className="mb-4"
        >
          <TabsList className="grid grid-cols-3 w-full max-w-xs bg-gray-100">
            <TabsTrigger value="24h">24 giờ</TabsTrigger>
            <TabsTrigger value="7d">7 ngày</TabsTrigger>
            <TabsTrigger value="30d">30 ngày</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Custom Chart - White Background */}
        <div className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-200 bg-white p-4">
          {loading && priceHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : priceHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              Không có dữ liệu giá
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceHistory}>
                <defs>
                  <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  vertical={false}
                />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTime}
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB" }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  tickFormatter={(v) => formatPrice(v)}
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                  domain={["dataMin", "dataMax"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value: number) => [formatPrice(value), "Giá"]}
                  labelFormatter={(ts) =>
                    new Date(ts).toLocaleString("vi-VN")
                  }
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Contract Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Contract Address:</span>{" "}
              <code className="bg-white px-2 py-0.5 rounded text-[10px] border border-gray-200">
                {CAMLY_CONTRACT}
              </code>
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyContract}
              className="h-7 gap-1 text-xs"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Đã sao chép" : "Sao chép"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
