import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wallet as WalletIcon, Send, History, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { sendTip, getTransactionHistory } from "@/lib/tipping";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ethers } from "ethers";

interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  address: string;
  icon: string;
}

const SUPPORTED_TOKENS = [
  { 
    symbol: "BNB", 
    address: "native", 
    decimals: 18,
    icon: "https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=035"
  },
  { 
    symbol: "USDT", 
    address: "0x55d398326f99059fF775485246999027B3197955", 
    decimals: 18,
    icon: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035"
  },
  { 
    symbol: "CAMLY", 
    address: "0x0910320181889fefde0bb1ca63962b0a8882e413", 
    decimals: 18,
    icon: "/images/camly-coin.png"
  },
  { 
    symbol: "BTC", 
    address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", 
    decimals: 18,
    icon: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=035"
  },
];

const Wallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Transfer form state
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("BNB");

  useEffect(() => {
    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (user) {
      loadTransactionHistory();
    }
  }, [user]);

  // Auto-refresh balances every 10 seconds when wallet is connected
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(() => {
      fetchBalances(address);
      if (user) {
        loadTransactionHistory();
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [isConnected, address, user]);

  // Refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (isConnected && address) {
        fetchBalances(address);
        if (user) {
          loadTransactionHistory();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isConnected, address, user]);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          await fetchBalances(accounts[0]);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (isConnecting) return; // Prevent duplicate requests
    
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "MetaMask không tìm thấy",
        description: "Vui lòng cài đặt MetaMask để sử dụng ví",
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
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x38",
                  chainName: "Binance Smart Chain",
                  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
                  rpcUrls: ["https://bsc-dataseed.binance.org/"],
                  blockExplorerUrls: ["https://bscscan.com/"],
                },
              ],
            });
          }
        }
      }

      setAddress(accounts[0]);
      setIsConnected(true);
      await fetchBalances(accounts[0]);
      
      // Save wallet address to profile
      if (user) {
        await supabase
          .from("profiles")
          .update({ wallet_address: accounts[0] })
          .eq("id", user.id);
      }
      
      toast({
        title: "Ví đã kết nối",
        description: `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (error: any) {
      toast({
        title: "Kết nối thất bại",
        description: error.message || "Không thể kết nối ví",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchBalances = async (userAddress: string) => {
    setLoading(true);
    const newBalances: TokenBalance[] = [];

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Verify we're on BSC mainnet
      const network = await provider.getNetwork();
      console.log("Current network:", network.chainId.toString());
      
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
            newBalances.push({ ...token, balance: parseFloat(bnbBalance).toFixed(6) });
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
            const [balance, contractDecimals] = await Promise.all([
              tokenContract.balanceOf(userAddress),
              tokenContract.decimals()
            ]);
            
            console.log(`${token.symbol} balance (raw):`, balance.toString());
            console.log(`${token.symbol} decimals from contract:`, contractDecimals.toString());
            
            const formattedBalance = ethers.formatUnits(balance, contractDecimals);
            console.log(`${token.symbol} balance (formatted):`, formattedBalance);
            
            newBalances.push({ 
              ...token, 
              decimals: Number(contractDecimals), // Use actual decimals from contract
              balance: parseFloat(formattedBalance).toFixed(6) 
            });
          }
        } catch (error) {
          console.error(`Error fetching ${token.symbol} balance:`, error);
          newBalances.push({ ...token, balance: "0.000000" });
        }
      }
    } catch (error) {
      console.error("Error initializing provider:", error);
      // Fallback to all zeros if provider fails
      SUPPORTED_TOKENS.forEach(token => {
        newBalances.push({ ...token, balance: "0.000000" });
      });
    }

    setBalances(newBalances);
    setLoading(false);
  };

  const loadTransactionHistory = async () => {
    if (!user) return;
    try {
      const history = await getTransactionHistory(user.id);
      setTransactions(history || []);
    } catch (error) {
      console.error("Error loading transaction history:", error);
    }
  };

  const handleSendToken = async () => {
    if (!isConnected) {
      toast({
        title: "Chưa kết nối ví",
        description: "Vui lòng kết nối ví trước",
        variant: "destructive",
      });
      return;
    }

    if (!recipientAddress || !amount) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ địa chỉ và số tiền",
        variant: "destructive",
      });
      return;
    }

    const tokenConfig = SUPPORTED_TOKENS.find(t => t.symbol === selectedToken);
    if (!tokenConfig) return;

    // Get actual decimals from balances (fetched from contract)
    const tokenBalance = balances.find(b => b.symbol === selectedToken);
    const actualDecimals = tokenBalance?.decimals || tokenConfig.decimals;

    console.log(`Sending ${amount} ${selectedToken} using ${actualDecimals} decimals`);

    setSending(true);
    try {
      await sendTip({
        toAddress: recipientAddress,
        amount: parseFloat(amount),
        tokenSymbol: tokenConfig.symbol,
        tokenAddress: tokenConfig.address,
        decimals: actualDecimals,
      });

      toast({
        title: "Chuyển thành công!",
        description: `Đã chuyển ${amount} ${selectedToken}`,
      });

      // Clear form
      setRecipientAddress("");
      setAmount("");
      
      // Refresh balances and transaction history
      await fetchBalances(address);
      await loadTransactionHistory();
    } catch (error: any) {
      toast({
        title: "Chuyển thất bại",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress("");
    setBalances([]);
    toast({
      title: "Đã ngắt kết nối",
      description: "Ví của bạn đã được ngắt kết nối",
    });
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <WalletIcon className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Kết nối Ví</CardTitle>
            <CardDescription>
              Kết nối ví MetaMask để xem số dư và chuyển tiền
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={connectWallet} 
              disabled={isConnecting}
              className="w-full" 
              size="lg"
            >
              <WalletIcon className="mr-2 h-5 w-5" />
              {isConnecting ? "Đang kết nối..." : "Kết nối MetaMask"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Ví của tôi</h1>
              <p className="text-muted-foreground mt-1">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  fetchBalances(address);
                  if (user) loadTransactionHistory();
                  toast({
                    title: "Đã làm mới",
                    description: "Số dư và lịch sử đã được cập nhật",
                  });
                }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                )}
              </Button>
              <Button variant="outline" onClick={disconnectWallet}>
                Ngắt kết nối
              </Button>
            </div>
          </div>

        <Tabs defaultValue="balance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="balance">Số dư</TabsTrigger>
            <TabsTrigger value="send">Chuyển tiền</TabsTrigger>
            <TabsTrigger value="history">Lịch sử</TabsTrigger>
          </TabsList>

          <TabsContent value="balance">
            <Card>
              <CardHeader>
                <CardTitle>Số dư ví</CardTitle>
                <CardDescription>Tất cả token trong ví của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {balances.map((token) => (
                      <div
                        key={token.symbol}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={token.icon} 
                            alt={token.symbol}
                            className="w-10 h-10 rounded-full"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/40';
                            }}
                          />
                          <div>
                            <p className="font-semibold">{token.symbol}</p>
                            <p className="text-sm text-muted-foreground">
                              {token.symbol === "BNB" ? "Binance Coin" : 
                               token.symbol === "USDT" ? "Tether USD" :
                               token.symbol === "BTC" ? "Bitcoin" :
                               token.symbol === "CAMLY" ? "Camly Coin" : token.symbol}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{token.balance}</p>
                          <p className="text-sm text-muted-foreground">{token.symbol}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle>Chuyển tiền</CardTitle>
                <CardDescription>
                  Gửi BNB, USDT, CAMLY hoặc BTC cho người dùng khác
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="token">Token</Label>
                    <Select value={selectedToken} onValueChange={setSelectedToken}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_TOKENS.map((token) => (
                          <SelectItem key={token.symbol} value={token.symbol}>
                            <div className="flex items-center gap-2">
                              <img src={token.icon} alt={token.symbol} className="w-5 h-5 rounded-full" />
                              <span>{token.symbol}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipient">Địa chỉ người nhận</Label>
                    <Input
                      id="recipient"
                      placeholder="0x..."
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Số tiền</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.000001"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleSendToken}
                    disabled={sending}
                    className="w-full"
                    size="lg"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Gửi {selectedToken}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử giao dịch</CardTitle>
                <CardDescription>Tất cả giao dịch của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Chưa có giao dịch nào</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {tx.from_user_id === user?.id ? "Đã gửi" : "Đã nhận"}{" "}
                            {tx.amount} {tx.token_type}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {tx.from_user_id === user?.id
                              ? `Đến: ${tx.to_address.slice(0, 6)}...${tx.to_address.slice(-4)}`
                              : `Từ: ${tx.from_address.slice(0, 6)}...${tx.from_address.slice(-4)}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleString("vi-VN")}
                          </p>
                        </div>
                        <div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              tx.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {tx.status === "completed" ? "Thành công" : "Thất bại"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Wallet;
