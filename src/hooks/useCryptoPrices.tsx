import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { 
  COINGECKO_IDS, 
  PANCAKESWAP_ROUTER, 
  CAMLY_TOKEN_ADDRESS, 
  CAMLY_DECIMALS,
  USDT_ADDRESS,
  WBNB_ADDRESS
} from "@/config/tokens";

interface CryptoPrices {
  [key: string]: number;
}

const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
];

export const useCryptoPrices = () => {
  const [prices, setPrices] = useState<CryptoPrices>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      const newPrices: CryptoPrices = {
        // Fallback prices in case API fails
        BNB: 700,
        USDT: 1,
        BTC: 95000,
        CAMLY: 0.0001
      };
      
      try {
        // Fetch CoinGecko prices with timeout
        const ids = Object.values(COINGECKO_IDS).filter(Boolean).join(",");
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        try {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            Object.entries(COINGECKO_IDS).forEach(([symbol, id]) => {
              if (data[id]?.usd) {
                newPrices[symbol] = data[id].usd;
              }
            });
          }
        } catch (fetchError) {
          // Silently fail and use fallback prices - don't log error to avoid error popup
          console.log("[CryptoPrices] CoinGecko unavailable, using fallback prices");
        }

        // Fetch CAMLY price from PancakeSwap
        try {
          const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
          const router = new ethers.Contract(PANCAKESWAP_ROUTER, ROUTER_ABI, provider);
          
          const amountIn = ethers.parseUnits("1", CAMLY_DECIMALS); // 1 CAMLY
          
          console.log("[CAMLY Price] Fetching price for token:", CAMLY_TOKEN_ADDRESS);
          console.log("[CAMLY Price] Using decimals:", CAMLY_DECIMALS);
          
          // Try direct path: CAMLY -> USDT
          try {
            const directPath = [CAMLY_TOKEN_ADDRESS, USDT_ADDRESS];
            const amounts = await router.getAmountsOut(amountIn, directPath);
            const usdtOut = ethers.formatUnits(amounts[1], 18); // USDT has 18 decimals on BSC
            newPrices["CAMLY"] = parseFloat(usdtOut);
            console.log("[CAMLY Price] Direct path success, price:", newPrices["CAMLY"]);
          } catch (directError) {
            console.log("[CAMLY Price] Direct path failed, trying WBNB path...");
            
            // Try path via WBNB: CAMLY -> WBNB -> USDT
            try {
              const wbnbPath = [CAMLY_TOKEN_ADDRESS, WBNB_ADDRESS, USDT_ADDRESS];
              const amounts = await router.getAmountsOut(amountIn, wbnbPath);
              const usdtOut = ethers.formatUnits(amounts[2], 18);
              newPrices["CAMLY"] = parseFloat(usdtOut);
              console.log("[CAMLY Price] WBNB path success, price:", newPrices["CAMLY"]);
            } catch (wbnbError) {
              console.log("[CAMLY Price] WBNB path also failed, using fallback");
            }
          }
        } catch (error) {
          console.log("[CAMLY Price] PancakeSwap unavailable, using fallback price");
        }

        setPrices(newPrices);
      } catch (error) {
        // Silent fail - use fallback prices
        console.log("[CryptoPrices] Using fallback prices due to network error");
        setPrices(newPrices);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    
    // Refresh prices every 2 minutes instead of 1 minute to reduce API calls
    const interval = setInterval(fetchPrices, 120000);
    
    return () => clearInterval(interval);
  }, []);

  return { prices, loading };
};
