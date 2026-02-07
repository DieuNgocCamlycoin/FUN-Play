import { useState, useEffect, useCallback } from "react";

export interface PriceDataPoint {
  timestamp: number;
  price: number;
}

export type TimePeriod = "24h" | "7d" | "30d";

const COINGECKO_ID = "camly-coin";

export const useCAMLYPriceHistory = (period: TimePeriod = "24h") => {
  const [priceHistory, setPriceHistory] = useState<PriceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const days = period === "24h" ? 1 : period === "7d" ? 7 : 30;
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${COINGECKO_ID}/market_chart?vs_currency=usd&days=${days}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch price data");
      }
      
      const data = await response.json();
      
      if (data.prices && Array.isArray(data.prices)) {
        const formatted: PriceDataPoint[] = data.prices.map(
          ([timestamp, price]: [number, number]) => ({
            timestamp,
            price,
          })
        );
        
        setPriceHistory(formatted);
        
        // Calculate current price & change
        const firstPrice = formatted[0]?.price || 0;
        const lastPrice = formatted[formatted.length - 1]?.price || 0;
        setCurrentPrice(lastPrice);
        setPriceChange(firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0);
      }
    } catch (error) {
      console.error("Error fetching CAMLY price history:", error);
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { 
    priceHistory, 
    loading, 
    currentPrice, 
    priceChange,
    refetch 
  };
};
