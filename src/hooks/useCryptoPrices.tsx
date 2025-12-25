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
      try {
        // Fetch CoinGecko prices
        const ids = Object.values(COINGECKO_IDS).filter(Boolean).join(",");
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
        );
        const data = await response.json();

        const newPrices: CryptoPrices = {};
        Object.entries(COINGECKO_IDS).forEach(([symbol, id]) => {
          if (data[id]?.usd) {
            newPrices[symbol] = data[id].usd;
          }
        });

        // Fetch CAMLY price from PancakeSwap
        try {
          const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
          const router = new ethers.Contract(PANCAKESWAP_ROUTER, ROUTER_ABI, provider);
          
          const amountIn = ethers.parseUnits("1", CAMLY_DECIMALS); // 1 CAMLY
          
          console.log("[CAMLY Price] Fetching price for token:", CAMLY_TOKEN_ADDRESS);
          console.log("[CAMLY Price] Using decimals:", CAMLY_DECIMALS);
          
          let camlyPrice = 0;
          
          // Try direct path: CAMLY -> USDT
          try {
            const directPath = [CAMLY_TOKEN_ADDRESS, USDT_ADDRESS];
            const amounts = await router.getAmountsOut(amountIn, directPath);
            const usdtOut = ethers.formatUnits(amounts[1], 18); // USDT has 18 decimals on BSC
            camlyPrice = parseFloat(usdtOut);
            console.log("[CAMLY Price] Direct path success, price:", camlyPrice);
          } catch (directError) {
            console.log("[CAMLY Price] Direct path failed, trying WBNB path...");
            
            // Try path via WBNB: CAMLY -> WBNB -> USDT
            try {
              const wbnbPath = [CAMLY_TOKEN_ADDRESS, WBNB_ADDRESS, USDT_ADDRESS];
              const amounts = await router.getAmountsOut(amountIn, wbnbPath);
              const usdtOut = ethers.formatUnits(amounts[2], 18);
              camlyPrice = parseFloat(usdtOut);
              console.log("[CAMLY Price] WBNB path success, price:", camlyPrice);
            } catch (wbnbError) {
              console.log("[CAMLY Price] WBNB path also failed:", wbnbError);
              // Use a reasonable fallback price
              camlyPrice = 0.0001;
              console.log("[CAMLY Price] Using fallback price:", camlyPrice);
            }
          }
          
          newPrices["CAMLY"] = camlyPrice;
        } catch (error) {
          console.error("[CAMLY Price] Error fetching from PancakeSwap:", error);
          // Fallback price if PancakeSwap fails completely
          newPrices["CAMLY"] = 0.0001;
        }

        setPrices(newPrices);
      } catch (error) {
        console.error("Error fetching crypto prices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    
    // Refresh prices every 60 seconds
    const interval = setInterval(fetchPrices, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return { prices, loading };
};
