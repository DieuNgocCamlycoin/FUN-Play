import { useState, useEffect, useRef, useCallback } from "react";
import { showLocalNotification, requestNotificationPermission } from "@/lib/pushNotifications";
import { toast } from "sonner";

interface PriceAlertConfig {
  enabled: boolean;
  thresholdPercent: number; // e.g., 5 for 5%
}

interface PriceData {
  price: number;
  timestamp: number;
}

const STORAGE_KEY = "camly_price_alert_config";
const PRICE_HISTORY_KEY = "camly_price_history";

export const useCAMLYPriceAlert = () => {
  const [config, setConfig] = useState<PriceAlertConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { enabled: true, thresholdPercent: 5 };
  });
  
  const [priceHistory, setPriceHistory] = useState<PriceData[]>(() => {
    const saved = localStorage.getItem(PRICE_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  const lastAlertPrice = useRef<number | null>(null);
  const notificationPermissionGranted = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    const requestPermission = async () => {
      const granted = await requestNotificationPermission();
      notificationPermissionGranted.current = granted;
    };
    requestPermission();
  }, []);

  // Save config to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  // Save price history to localStorage
  useEffect(() => {
    localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(priceHistory));
  }, [priceHistory]);

  const checkPriceAlert = useCallback((currentPrice: number) => {
    if (!config.enabled || currentPrice <= 0) return;

    // Add to price history
    const now = Date.now();
    setPriceHistory(prev => {
      const newHistory = [...prev, { price: currentPrice, timestamp: now }];
      // Keep only last 24 hours of data (1440 minutes = 1440 data points max)
      const cutoff = now - 24 * 60 * 60 * 1000;
      return newHistory.filter(p => p.timestamp > cutoff).slice(-1440);
    });

    // Check if we should alert
    if (lastAlertPrice.current !== null) {
      const changePercent = ((currentPrice - lastAlertPrice.current) / lastAlertPrice.current) * 100;
      const absChange = Math.abs(changePercent);
      
      if (absChange >= config.thresholdPercent) {
        const direction = changePercent > 0 ? "📈 TĂNG" : "📉 GIẢM";
        const color = changePercent > 0 ? "green" : "red";
        
        const message = `CAMLY ${direction} ${absChange.toFixed(2)}%! Giá mới: $${currentPrice.toFixed(8)}`;
        
        // Show toast notification
        toast(message, {
          description: `Giá trước: $${lastAlertPrice.current.toFixed(8)}`,
          duration: 10000,
          style: {
            background: changePercent > 0 ? "#10b981" : "#ef4444",
            color: "white",
          },
        });
        
        // Show push notification if permission granted
        if (notificationPermissionGranted.current) {
          showLocalNotification(`CAMLY ${direction}`, {
            body: message,
            tag: "camly-price-alert",
            requireInteraction: true,
          });
        }
        
        // Update last alert price
        lastAlertPrice.current = currentPrice;
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent("camly-price-alert", {
          detail: { 
            currentPrice, 
            previousPrice: lastAlertPrice.current,
            changePercent 
          }
        }));
      }
    } else {
      // First price received
      lastAlertPrice.current = currentPrice;
    }
  }, [config.enabled, config.thresholdPercent]);

  const setEnabled = (enabled: boolean) => {
    setConfig(prev => ({ ...prev, enabled }));
  };

  const setThreshold = (thresholdPercent: number) => {
    setConfig(prev => ({ ...prev, thresholdPercent }));
  };

  const get24hChange = useCallback((): { change: number; percent: number } | null => {
    if (priceHistory.length < 2) return null;
    
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    // Find the oldest price in the last 24 hours
    const oldPrice = priceHistory.find(p => p.timestamp >= oneDayAgo);
    const currentPrice = priceHistory[priceHistory.length - 1];
    
    if (!oldPrice || !currentPrice) return null;
    
    const change = currentPrice.price - oldPrice.price;
    const percent = (change / oldPrice.price) * 100;
    
    return { change, percent };
  }, [priceHistory]);

  return {
    config,
    priceHistory,
    checkPriceAlert,
    setEnabled,
    setThreshold,
    get24hChange,
  };
};

