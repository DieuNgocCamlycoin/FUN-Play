import { useState, useEffect } from "react";
import { Wallet, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [selectedToken, setSelectedToken] = useState("BNB");
  const { toast } = useToast();

  const connectWallet = async () => {
    if (isConnecting) return; // Prevent duplicate requests
    
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to use Web3 features",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      
      if (chainId !== "0x38") {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x38" }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0x38",
                    chainName: "Binance Smart Chain",
                    nativeCurrency: {
                      name: "BNB",
                      symbol: "BNB",
                      decimals: 18,
                    },
                    rpcUrls: ["https://bsc-dataseed.binance.org/"],
                    blockExplorerUrls: ["https://bscscan.com/"],
                  },
                ],
              });
            } catch (addError) {
              toast({
                title: "Network Error",
                description: "Failed to add BSC network",
                variant: "destructive",
              });
              return;
            }
          } else {
            toast({
              title: "Network Error",
              description: "Please switch to BSC Mainnet",
              variant: "destructive",
            });
            return;
          }
        }
      }

      setAddress(accounts[0]);
      setIsConnected(true);
      
      // Fetch balances for all supported tokens
      await fetchBalances(accounts[0]);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchBalances = async (userAddress: string) => {
    const newBalances: TokenBalance[] = [];

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Verify we're on BSC mainnet
      const network = await provider.getNetwork();
      console.log("MultiTokenWallet - Current network:", network.chainId.toString());
      
      if (network.chainId !== BigInt(56)) {
        console.warn("Not on BSC mainnet, switching...");
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x38" }],
          });
          // Wait a bit for network to switch
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error("Failed to switch network:", error);
        }
      }
      
      for (const token of SUPPORTED_TOKENS) {
        try {
          if (token.address === "native") {
            const balance = await provider.getBalance(userAddress);
            const bnbBalance = ethers.formatEther(balance);
            console.log(`BNB balance: ${bnbBalance}`);
            newBalances.push({ 
              symbol: token.symbol, 
              balance: parseFloat(bnbBalance).toFixed(4), 
              decimals: token.decimals,
              icon: token.icon
            });
          } else {
            // ERC-20 token balance - fetch decimals from contract
            const tokenContract = new ethers.Contract(
              token.address,
              [
                "function balanceOf(address account) view returns (uint256)",
                "function decimals() view returns (uint8)"
              ],
              provider
            );
            
            // Fetch both balance and decimals from contract
            const [balance, decimals] = await Promise.all([
              tokenContract.balanceOf(userAddress),
              tokenContract.decimals()
            ]);
            
            console.log(`${token.symbol} balance (raw):`, balance.toString());
            console.log(`${token.symbol} decimals:`, decimals.toString());
            
            const formattedBalance = ethers.formatUnits(balance, decimals);
            console.log(`${token.symbol} balance (formatted):`, formattedBalance);
            
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
      // Fallback to all zeros if provider fails
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
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress("");
    setBalances([]);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const currentBalance = balances.find(b => b.symbol === selectedToken);

  if (isConnected) {
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
              <Wallet className={compact ? "h-4 w-4" : "h-4 w-4"} />
              {!compact && currentBalance && (
                <img src={currentBalance.icon} alt={currentBalance.symbol} className="h-4 w-4 rounded-full" />
              )}
              {!compact && (
                <>
                  <span className="hidden md:inline">
                    {currentBalance?.balance || "0.0000"} {selectedToken}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
              {/* Connected indicator for compact mode */}
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
              Disconnect Wallet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Button
      onClick={connectWallet}
      disabled={isConnecting}
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
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </span>
      )}
    </Button>
  );
};

declare global {
  interface Window {
    ethereum?: any;
  }
}
