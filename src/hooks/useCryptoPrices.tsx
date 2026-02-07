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
import { debugLog, debugError } from "@/lib/debugLog";

interface CryptoPrices {
  [key: string]: number;
}

const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
];

// Polling interval - 120s for better performance
const POLLING_INTERVAL = 120000;

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
          
          const amountIn = ethers.parseUnits("1", CAMLY_DECIMALS);
          
          debugLog('CryptoPrices', 'Fetching CAMLY price', { token: CAMLY_TOKEN_ADDRESS });
          
          let camlyPrice = 0;
          
          // Try direct path: CAMLY -> USDT
          try {
            const directPath = [CAMLY_TOKEN_ADDRESS, USDT_ADDRESS];
            const amounts = await router.getAmountsOut(amountIn, directPath);
            const usdtOut = ethers.formatUnits(amounts[1], 18);
            camlyPrice = parseFloat(usdtOut);
            debugLog('CryptoPrices', 'Direct path price', camlyPrice);
          } catch {
            // Try path via WBNB: CAMLY -> WBNB -> USDT
            try {
              const wbnbPath = [CAMLY_TOKEN_ADDRESS, WBNB_ADDRESS, USDT_ADDRESS];
              const amounts = await router.getAmountsOut(amountIn, wbnbPath);
              const usdtOut = ethers.formatUnits(amounts[2], 18);
              camlyPrice = parseFloat(usdtOut);
              debugLog('CryptoPrices', 'WBNB path price', camlyPrice);
            } catch {
              // Use fallback price
              camlyPrice = 0.0001;
              debugLog('CryptoPrices', 'Using fallback price', camlyPrice);
            }
          }
          
          newPrices["CAMLY"] = camlyPrice;
        } catch (error) {
          debugError('CryptoPrices', 'Error fetching CAMLY price', error);
          newPrices["CAMLY"] = 0.0001;
        }

        setPrices(newPrices);
      } catch (error) {
        debugError('CryptoPrices', 'Error fetching crypto prices', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    
    // Refresh prices every 120 seconds (optimized from 60s)
    const interval = setInterval(fetchPrices, POLLING_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);

  return { prices, loading };
};
