import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { usePriceChart } from "@/hooks/usePriceChart";
import { Loader2 } from "lucide-react";
import { ethers } from "ethers";
import { CAMLY_TOKEN_ADDRESS, CAMLY_DECIMALS } from "@/config/tokens";

interface PriceChartProps {
  tokenSymbol: string;
  tokenName: string;
}

const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
];

// Generate mock historical data based on current price
const generateMockData = (currentPrice: number, period: "24h" | "7d" | "30d") => {
  const now = Date.now();
  const dataPoints = period === "24h" ? 48 : period === "7d" ? 84 : 90;
  const intervalMs = period === "24h" 
    ? 30 * 60 * 1000 // 30 minutes
    : period === "7d" 
    ? 2 * 60 * 60 * 1000 // 2 hours
    : 8 * 60 * 60 * 1000; // 8 hours

  const data = [];
  let price = currentPrice * (0.85 + Math.random() * 0.1); // Start lower

  for (let i = dataPoints; i >= 0; i--) {
    const timestamp = now - i * intervalMs;
    // Random walk with trend towards current price
    const trend = (currentPrice - price) * 0.02;
    const volatility = currentPrice * 0.03 * (Math.random() - 0.5);
    price = Math.max(price + trend + volatility, currentPrice * 0.7);
    
    if (i === 0) price = currentPrice; // End at current price
    
    data.push({ timestamp, price });
  }

  return data;
};

// CAMLY Chart Component with real-time price from PancakeSwap
const CAMLYChart = ({ period, tokenName }: { period: "24h" | "7d" | "30d"; tokenName: string }) => {
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  useEffect(() => {
    const fetchCAMLYPrice = async () => {
      setLoading(true);
      try {
        const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
        const routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
        const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider);
        const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
        const USDT = "0x55d398326f99059fF775485246999027B3197955";

        const amountIn = ethers.parseUnits("1", CAMLY_DECIMALS);
        
        // Try CAMLY -> WBNB -> USDT path
        const amounts = await router.getAmountsOut(amountIn, [CAMLY_TOKEN_ADDRESS, WBNB, USDT]);
        const price = parseFloat(ethers.formatUnits(amounts[2], 18));
        setCurrentPrice(price);
        console.log("[CAMLYChart] Fetched price:", price);
      } catch (error) {
        console.error("[CAMLYChart] Error fetching price:", error);
        // Use fallback price
        setCurrentPrice(0.000025);
      } finally {
        setLoading(false);
      }
    };

    fetchCAMLYPrice();
  }, []);

  const chartData = useMemo(() => {
    if (currentPrice <= 0) return [];
    return generateMockData(currentPrice, period);
  }, [currentPrice, period]);

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    if (period === "24h") {
      return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
  };

  const { minPrice, maxPrice } = useMemo(() => {
    if (chartData.length === 0) return { minPrice: 0, maxPrice: 0 };
    const prices = chartData.map(d => d.price);
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices)
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="camlyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatXAxis}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis
          domain={[minPrice * 0.95, maxPrice * 1.05]}
          tickFormatter={(v) => `$${v.toFixed(8)}`}
          stroke="hsl(var(--muted-foreground))"
          fontSize={10}
          width={80}
        />
        <Tooltip
          formatter={(value: number) => [`$${value.toFixed(8)}`, "Giá"]}
          labelFormatter={(label) => new Date(label).toLocaleString("vi-VN")}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#camlyGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const PriceChart = ({ tokenSymbol, tokenName }: PriceChartProps) => {
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("24h");
  const { chartData, loading } = usePriceChart(tokenSymbol, period);

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    if (period === "24h") {
      return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
  };

  // Calculate dynamic Y-axis domain for better wave visibility
  const { minPrice, maxPrice } = useMemo(() => {
    if (chartData.length === 0) return { minPrice: 0, maxPrice: 0 };
    const prices = chartData.map(d => d.price);
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices)
    };
  }, [chartData]);

  // CAMLY uses special chart with mock data
  if (tokenSymbol === "CAMLY") {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Biểu đồ giá {tokenName}</CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as "24h" | "7d" | "30d")}>
            <TabsList>
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7 ngày</TabsTrigger>
              <TabsTrigger value="30d">30 ngày</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <CAMLYChart period={period} tokenName={tokenName} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Biểu đồ giá {tokenName}</CardTitle>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as "24h" | "7d" | "30d")}>
          <TabsList>
            <TabsTrigger value="24h">24h</TabsTrigger>
            <TabsTrigger value="7d">7 ngày</TabsTrigger>
            <TabsTrigger value="30d">30 ngày</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                domain={[minPrice * 0.995, maxPrice * 1.005]}
                tickFormatter={(v) => `$${tokenSymbol === "BTC" ? v.toLocaleString() : v.toFixed(4)}`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                width={tokenSymbol === "BTC" ? 80 : 60}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(tokenSymbol === "BTC" ? 2 : 6)}`, "Giá"]}
                labelFormatter={(label) => new Date(label).toLocaleString("vi-VN")}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
