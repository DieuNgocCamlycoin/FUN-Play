import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Download, 
  Bell, 
  BellOff,
  Share2,
  ExternalLink 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/Layout/MainLayout";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { useCAMLYPriceAlert } from "@/hooks/useCAMLYPriceAlert";
import { CAMLY_TOKEN_ADDRESS } from "@/config/tokens";
import { toast } from "sonner";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

// Generate mock historical data
const generateMockData = (days: number, currentPrice: number) => {
  const data = [];
  const now = Date.now();
  const interval = days === 1 ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const points = days === 1 ? 24 : days;
  
  let price = currentPrice * (0.8 + Math.random() * 0.2);
  
  for (let i = points; i >= 0; i--) {
    const timestamp = now - i * interval;
    const change = (Math.random() - 0.5) * price * 0.05;
    price = Math.max(price + change, 0.00000001);
    
    data.push({
      timestamp,
      price: i === 0 ? currentPrice : price,
      date: new Date(timestamp).toLocaleDateString("vi-VN"),
      time: new Date(timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    });
  }
  
  return data;
};

export default function CAMLYPrice() {
  const navigate = useNavigate();
  const { prices, loading } = useCryptoPrices();
  const { config, setEnabled, setThreshold, checkPriceAlert, get24hChange } = useCAMLYPriceAlert();
  
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("24h");
  const [chartData, setChartData] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const camlyPrice = prices["CAMLY"] || 0;
  const change24h = get24hChange();
  
  useEffect(() => {
    if (camlyPrice > 0) {
      const days = period === "24h" ? 1 : period === "7d" ? 7 : 30;
      setChartData(generateMockData(days, camlyPrice));
    }
  }, [camlyPrice, period]);
  
  useEffect(() => {
    if (camlyPrice > 0) {
      checkPriceAlert(camlyPrice);
    }
  }, [camlyPrice, checkPriceAlert]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  const handleExportCSV = () => {
    if (chartData.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }
    
    const headers = ["Thời gian", "Giá (USD)"];
    const rows = chartData.map(d => [
      `${d.date} ${d.time}`,
      d.price.toFixed(10)
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `camly_price_${period}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success("Đã xuất dữ liệu giá thành công!");
  };

  const handleShare = async () => {
    const text = `CAMLY Token\nGiá: $${camlyPrice.toFixed(8)}\n24h: ${change24h ? (change24h.percent >= 0 ? "+" : "") + change24h.percent.toFixed(2) + "%" : "Không có"}\n\nXem thêm tại FUN Play`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: "Giá Token CAMLY", text, url: window.location.href });
      } catch (error) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Đã sao chép thông tin giá!");
    }
  };

  const formatPrice = (price: number): string => {
    if (price === 0) return "$0.00";
    if (price < 0.00001) return `$${price.toExponential(3)}`;
    if (price < 0.01) return `$${price.toFixed(8)}`;
    if (price < 1) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(4)}`;
  };

  const isPositive = change24h ? change24h.percent >= 0 : true;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Token Header with Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/camly-coin.png" alt="CAMLY" className="h-10 w-10 rounded-full" />
            <div>
              <h1 className="font-bold text-xl">CAMLY</h1>
              <p className="text-xs text-muted-foreground">Token Price</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Price Overview */}
        <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Giá hiện tại</p>
                <p className="text-4xl font-bold tracking-tight">
                  {loading ? "..." : formatPrice(camlyPrice)}
                </p>
                {change24h && (
                  <div className={`flex items-center gap-2 mt-2 ${isPositive ? "text-green-500" : "text-red-500"}`}>
                    {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    <span className="font-semibold">
                      {isPositive ? "+" : ""}{change24h.percent.toFixed(2)}%
                    </span>
                    <span className="text-sm text-muted-foreground">24h</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://bscscan.com/token/${CAMLY_TOKEN_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    BSCScan
                  </a>
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/wallet")}>
                  Mua/Swap
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Biểu đồ giá</CardTitle>
              <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                <TabsList className="h-8">
                  <TabsTrigger value="24h" className="text-xs px-3">24H</TabsTrigger>
                  <TabsTrigger value="7d" className="text-xs px-3">7D</TabsTrigger>
                  <TabsTrigger value="30d" className="text-xs px-3">30D</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey={period === "24h" ? "time" : "date"} 
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v) => `$${v.toExponential(1)}`}
                      tickLine={false}
                      axisLine={false}
                      width={60}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`$${value.toFixed(10)}`, "Giá"]}
                      labelFormatter={(label) => `Thời gian: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#colorPrice)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Đang tải dữ liệu...
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Xuất CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Price Alert Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {config.enabled ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
              Thông báo giá
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Bật thông báo</p>
                <p className="text-sm text-muted-foreground">Nhận thông báo khi giá thay đổi đáng kể</p>
              </div>
              <Switch checked={config.enabled} onCheckedChange={setEnabled} />
            </div>
            {config.enabled && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Ngưỡng thông báo</p>
                    <span className="text-sm font-bold text-primary">{config.thresholdPercent}%</span>
                  </div>
                  <Slider
                    value={[config.thresholdPercent]}
                    onValueChange={([value]) => setThreshold(value)}
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Thông báo khi giá tăng hoặc giảm {config.thresholdPercent}% so với lần kiểm tra trước
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Token Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Thông tin Token</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Tên</p>
                <p className="font-medium">CAMLY Token</p>
              </div>
              <div>
                <p className="text-muted-foreground">Symbol</p>
                <p className="font-medium">CAMLY</p>
              </div>
              <div>
                <p className="text-muted-foreground">Mạng</p>
                <p className="font-medium">BNB Smart Chain</p>
              </div>
              <div>
                <p className="text-muted-foreground">Decimals</p>
                <p className="font-medium">3</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Contract</p>
                <p className="font-mono text-xs break-all">{CAMLY_TOKEN_ADDRESS}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
