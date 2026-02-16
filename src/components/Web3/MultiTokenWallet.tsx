import { useState, useEffect, useCallback } from "react";
import { Wallet, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ethers } from "ethers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_TOKENS } from "@/config/tokens";
import { useWalletContext } from "@/contexts/WalletContext";
import { getAccount, getPublicClient } from "@wagmi/core";
import { wagmiConfig, BSC_CHAIN_ID } from "@/lib/web3Config";

interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  icon: string;
}

interface MultiTokenWalletProps {
  compact?: boolean;
}

export const MultiTokenWallet = ({ compact = false }: MultiTokenWalletProps) => {
  const {
    isConnected,
    address,
    isLoading,
    isInitialized,
    connectWallet,
    disconnectWallet,
  } = useWalletContext();
  
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [selectedToken, setSelectedToken] = useState("BNB");
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);

  const fetchBalances = useCallback(async (userAddress: string) => {
    if (!userAddress) return;
    
    setIsFetchingBalances(true);
    const newBalances: TokenBalance[] = [];

    try {
      for (const token of SUPPORTED_TOKENS) {
        try {
          // Use correct RPC per token (FUN = Testnet, others = Mainnet)
          const { getRpcForToken } = await import("@/config/tokens");
          const provider = new ethers.JsonRpcProvider(getRpcForToken(token.symbol));

          if (token.address === "native") {
            const balance = await provider.getBalance(userAddress);
            const bnbBalance = ethers.formatEther(balance);
            newBalances.push({ 
              symbol: token.symbol, 
              balance: parseFloat(bnbBalance).toFixed(4), 
              decimals: token.decimals,
              icon: token.icon
            });
          } else {
            // ERC-20 token balance
            const tokenContract = new ethers.Contract(
              token.address,
              [
                "function balanceOf(address account) view returns (uint256)",
                "function decimals() view returns (uint8)"
              ],
              provider
            );
            
            const [balance, decimals] = await Promise.all([
              tokenContract.balanceOf(userAddress),
              tokenContract.decimals()
            ]);
            
            const formattedBalance = ethers.formatUnits(balance, decimals);
            newBalances.push({ 
              symbol: token.symbol, 
              balance: parseFloat(formattedBalance).toFixed(4), 
              decimals: decimals,
              icon: token.icon
            });
          }
        } catch (error) {
          console.error(`Error fetching ${token.symbol} balance:`, error);
          newBalances.push({ 
            symbol: token.symbol, 
            balance: "0.0000", 
            decimals: token.decimals,
            icon: token.icon
          });
        }
      }
    } catch (error) {
      console.error("Error initializing provider:", error);
      SUPPORTED_TOKENS.forEach(token => {
        newBalances.push({ 
          symbol: token.symbol, 
          balance: "0.0000", 
          decimals: token.decimals,
          icon: token.icon
        });
      });
    }

    setBalances(newBalances);
    setIsFetchingBalances(false);
  }, []);

  // Fetch balances when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchBalances(address);
    }
  }, [isConnected, address, fetchBalances]);

  const currentBalance = balances.find(b => b.symbol === selectedToken);

  // Always show the button - never hide it completely

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={compact ? "ghost" : "outline"}
              size={compact ? "icon" : "sm"}
              className={compact 
                ? "h-8 w-8 relative" 
                : "gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              }
            >
              <Wallet className="h-4 w-4" />
              {!compact && currentBalance && (
                <img src={currentBalance.icon} alt={currentBalance.symbol} className="h-4 w-4 rounded-full" />
              )}
              {!compact && (
                <>
                  <span className="hidden md:inline">
                    {isFetchingBalances ? "..." : (currentBalance?.balance || "0.0000")} {selectedToken}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
              {compact && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-500 rounded-full border border-background" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {address.slice(0, 6)}...{address.slice(-4)}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Token Balances
            </DropdownMenuLabel>
            {balances.map((token) => (
              <DropdownMenuItem
                key={token.symbol}
                onClick={() => setSelectedToken(token.symbol)}
                className={selectedToken === token.symbol ? "bg-accent" : ""}
              >
                <img src={token.icon} alt={token.symbol} className="h-5 w-5 rounded-full mr-2" />
                <span className="font-medium">{token.symbol}</span>
                <span className="ml-auto text-muted-foreground">{token.balance}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={disconnectWallet} className="text-destructive">
              Ngắt kết nối ví
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Button
      onClick={connectWallet}
      disabled={isLoading}
      variant={compact ? "ghost" : "default"}
      size={compact ? "icon" : "sm"}
      className={compact 
        ? "h-8 w-8" 
        : "gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
      }
    >
      <Wallet className="h-4 w-4" />
      {!compact && (
        <span className="hidden md:inline">
          {isLoading ? "Đang kết nối..." : "Kết nối ví"}
        </span>
      )}
    </Button>
  );
};
