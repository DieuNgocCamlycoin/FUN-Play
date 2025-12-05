import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

const CAMLY_TOKEN_ADDRESS = "0x0910320181889fefde0bb1ca63962b0a8882e413";

interface OnChainBalance {
  camly: string;
  bnb: string;
  usdt: string;
  btc: string;
}

export const useOnChainBalance = (walletAddress: string | null) => {
  const [balances, setBalances] = useState<OnChainBalance>({
    camly: "0",
    bnb: "0",
    usdt: "0",
    btc: "0",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!walletAddress || typeof window.ethereum === "undefined") {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Verify BSC network
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(56)) {
        setError("Please connect to BSC Mainnet");
        setLoading(false);
        return;
      }

      const erc20Abi = [
        "function balanceOf(address account) view returns (uint256)",
        "function decimals() view returns (uint8)",
      ];

      // Fetch BNB (native)
      const bnbBalance = await provider.getBalance(walletAddress);
      const bnbFormatted = ethers.formatEther(bnbBalance);

      // Fetch CAMLY
      const camlyContract = new ethers.Contract(CAMLY_TOKEN_ADDRESS, erc20Abi, provider);
      const [camlyBalance, camlyDecimals] = await Promise.all([
        camlyContract.balanceOf(walletAddress),
        camlyContract.decimals(),
      ]);
      const camlyFormatted = ethers.formatUnits(camlyBalance, camlyDecimals);

      // Fetch USDT
      const usdtContract = new ethers.Contract(
        "0x55d398326f99059fF775485246999027B3197955",
        erc20Abi,
        provider
      );
      const [usdtBalance, usdtDecimals] = await Promise.all([
        usdtContract.balanceOf(walletAddress),
        usdtContract.decimals(),
      ]);
      const usdtFormatted = ethers.formatUnits(usdtBalance, usdtDecimals);

      // Fetch BTC (BTCB on BSC)
      const btcContract = new ethers.Contract(
        "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
        erc20Abi,
        provider
      );
      const [btcBalance, btcDecimals] = await Promise.all([
        btcContract.balanceOf(walletAddress),
        btcContract.decimals(),
      ]);
      const btcFormatted = ethers.formatUnits(btcBalance, btcDecimals);

      setBalances({
        camly: parseFloat(camlyFormatted).toFixed(3),
        bnb: parseFloat(bnbFormatted).toFixed(6),
        usdt: parseFloat(usdtFormatted).toFixed(2),
        btc: parseFloat(btcFormatted).toFixed(8),
      });
    } catch (err: any) {
      console.error("Error fetching on-chain balances:", err);
      setError(err.message || "Failed to fetch balances");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchBalances();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  return { balances, loading, error, refetch: fetchBalances };
};
