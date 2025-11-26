import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wallet as WalletIcon, Send, History, Loader2, Copy, QrCode, ExternalLink, Search, Filter, ArrowLeft, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { sendTip, getTransactionHistory } from "@/lib/tipping";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ethers } from "ethers";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { MultiTokenWallet } from "@/components/Web3/MultiTokenWallet";
import { TokenSwap } from "@/components/Web3/TokenSwap";
import { PriceChart } from "@/components/Web3/PriceChart";
import { PortfolioTracker } from "@/components/Web3/PortfolioTracker";
import { Badge } from "@/components/ui/badge";
import { RichNotification } from "@/components/Web3/RichNotification";
import camlyCoinLogo from "@/assets/camly-coin-rainbow.png";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { requestNotificationPermission, showLocalNotification } from "@/lib/pushNotifications";

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
  const { prices, loading: pricesLoading } = useCryptoPrices();
  const navigate = useNavigate();

  // Transfer form state
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("BNB");
  const [previousBalances, setPreviousBalances] = useState<TokenBalance[]>([]);
  const [showRichNotification, setShowRichNotification] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [receivedToken, setReceivedToken] = useState("");
  const [receivedCount, setReceivedCount] = useState(0);
  const [receivedTransactions, setReceivedTransactions] = useState<any[]>([]);
  const [filteredReceivedTxs, setFilteredReceivedTxs] = useState<any[]>([]);
  const [receivedFilterToken, setReceivedFilterToken] = useState<string>("all");
  const [receivedSearchTerm, setReceivedSearchTerm] = useState("");

  useEffect(() => {
    checkWalletConnection();
    // Request notification permission on load
    requestNotificationPermission();
  }, []);

  // Real-time monitoring for incoming transactions
  useEffect(() => {
    if (!user || !address) return;

    const channel = supabase
      .channel('wallet-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `to_address=eq.${address.toLowerCase()}`
        },
        (payload) => {
          console.log('New transaction received:', payload);
          const transaction = payload.new;
          
          // Play Angel voice notification
          const utterance = new SpeechSynthesisUtterance("Bạn vừa nhận được tiền");
          utterance.lang = "vi-VN";
          utterance.pitch = 2; // High pitch for baby voice
          utterance.rate = 1.2; // Slightly faster
          window.speechSynthesis.speak(utterance);
          
          // Show Rich notification
          setReceivedAmount(transaction.amount.toString());
          setReceivedToken(transaction.token_type);
          setShowRichNotification(true);

          // Send push notification (PWA)
          showLocalNotification(
            `💰 Nhận được ${transaction.amount} ${transaction.token_type}!`,
            {
              body: "Chúc mừng bạn! Bạn vừa nhận được tiền vào ví FUN PLAY 🎉",
              tag: "crypto-received",
              requireInteraction: true,
            }
          );

          // Send message to service worker for background notification
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'CRYPTO_RECEIVED',
              amount: transaction.amount,
              token: transaction.token_type
            });
          }

          // Refresh balances and transaction history
          fetchBalances(address);
          loadTransactionHistory();
          loadReceivedTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, address]);

  useEffect(() => {
    if (user && address) {
      loadTransactionHistory();
      loadReceivedTransactions();
    }
  }, [user, address]);

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

    // Check for balance increases (incoming funds)
    if (previousBalances.length > 0) {
      newBalances.forEach(newBal => {
        const prevBal = previousBalances.find(pb => pb.symbol === newBal.symbol);
        if (prevBal && parseFloat(newBal.balance) > parseFloat(prevBal.balance)) {
          const increase = (parseFloat(newBal.balance) - parseFloat(prevBal.balance)).toFixed(6);
          // Show Rich notification for balance increase
          setReceivedAmount(increase);
          setReceivedToken(newBal.symbol);
          setShowRichNotification(true);
        }
      });
    }
    
    setPreviousBalances(newBalances);
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

  const loadReceivedTransactions = async () => {
    if (!user || !address) return;
    try {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("to_address", address.toLowerCase())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReceivedTransactions(data || []);
      setFilteredReceivedTxs(data || []);
      setReceivedCount(data?.length || 0);
    } catch (error) {
      console.error("Error loading received transactions:", error);
    }
  };

  // Filter and search received transactions
  useEffect(() => {
    let filtered = receivedTransactions;
    
    // Filter by token
    if (receivedFilterToken !== "all") {
      filtered = filtered.filter(tx => tx.token_type === receivedFilterToken);
    }
    
    // Search by TxID or sender address
    if (receivedSearchTerm) {
      const searchLower = receivedSearchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.tx_hash?.toLowerCase().includes(searchLower) ||
        tx.from_address?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredReceivedTxs(filtered);
  }, [receivedTransactions, receivedFilterToken, receivedSearchTerm]);

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
      await loadReceivedTransactions();
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

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Đã copy",
      description: "Địa chỉ ví đã được copy vào clipboard",
    });
  };

  if (!isConnected) {
    return (
      <div 
        className="container mx-auto px-4 py-8 min-h-screen"
        style={{
          background: "linear-gradient(135deg, #00E7FF 0%, #7A2BFF 33%, #FF00E5 66%, #FFD700 100%)"
        }}
      >
        <Card className="max-w-md mx-auto glass-card">
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
    <div 
      className="container mx-auto px-4 py-8 relative min-h-screen"
      style={{
        background: "linear-gradient(135deg, #00E7FF 0%, #7A2BFF 33%, #FF00E5 66%, #FFD700 100%)"
      }}
    >
      {/* Back Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 z-50"
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      <RichNotification
        show={showRichNotification}
        amount={receivedAmount}
        token={receivedToken}
        count={receivedCount}
        onClose={() => setShowRichNotification(false)}
      />
      
      {/* Received History Notification Badge */}
      {receivedCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed top-20 right-4 z-50 bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] text-background px-4 py-2 rounded-full shadow-2xl"
          style={{
            boxShadow: "0 0 20px #FFD700, 0 0 40px #FFA500",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="font-bold">💰 Lịch sử nhận:</span>
            <div className="relative">
              <img 
                src={camlyCoinLogo} 
                alt="CAMLY Coin" 
                className="w-8 h-8 rounded-full animate-pulse"
                style={{
                  boxShadow: "0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 165, 0, 0.6)",
                  filter: "drop-shadow(0 0 10px #FFD700)",
                }}
              />
              <span 
                className="absolute -top-1 -right-1 text-[#00FF00] font-black text-sm bg-background rounded-full w-5 h-5 flex items-center justify-center" 
                style={{ 
                  textShadow: "0 0 10px #00FF00",
                  boxShadow: "0 0 10px #00FF00",
                }}
              >
                {receivedCount}
              </span>
            </div>
          </div>
        </motion.div>
      )}
      
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 
                className="text-3xl font-bold"
                style={{
                  background: "linear-gradient(135deg, #00E7FF, #7A2BFF, #FF00E5, #FFD700)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Ví của tôi
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-background/80 font-medium">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={copyAddress}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <QrCode className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Mã QR địa chỉ ví</DialogTitle>
                      <DialogDescription>
                        Quét mã này để nhận tiền vào ví của bạn
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-4">
                      <QRCodeSVG value={address} size={256} />
                      <p className="text-sm text-muted-foreground break-all text-center">
                        {address}
                      </p>
                      <Button onClick={copyAddress} className="w-full">
                        <Copy className="mr-2 h-4 w-4" />
                        Copy địa chỉ
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="balance">Số dư</TabsTrigger>
            <TabsTrigger value="send">Chuyển tiền</TabsTrigger>
            <TabsTrigger value="swap">Hoán đổi</TabsTrigger>
            <TabsTrigger value="charts">Biểu đồ</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="history">Lịch sử</TabsTrigger>
            <TabsTrigger value="received">
              <div className="flex items-center gap-2">
                <span>Lịch sử nhận</span>
                {receivedCount > 0 && (
                  <div className="relative">
                    <img 
                      src={camlyCoinLogo} 
                      alt="CAMLY" 
                      className="w-5 h-5 rounded-full"
                      style={{ filter: "drop-shadow(0 0 5px #FFD700)" }}
                    />
                    <span 
                      className="absolute -top-1 -right-1 text-[#00FF00] font-bold text-[10px] bg-background rounded-full w-4 h-4 flex items-center justify-center" 
                      style={{ 
                        textShadow: "0 0 5px #00FF00",
                        boxShadow: "0 0 5px #00FF00",
                      }}
                    >
                      {receivedCount}
                    </span>
                  </div>
                )}
              </div>
            </TabsTrigger>
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
                          <p className="font-bold">{parseFloat(token.balance).toFixed(3)}</p>
                          <p className="text-sm text-muted-foreground">{token.symbol}</p>
                          {prices[token.symbol] && (
                            <p className="text-xs text-muted-foreground">
                              ≈ ${(parseFloat(token.balance) * prices[token.symbol]).toFixed(2)} USD
                            </p>
                          )}
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

          <TabsContent value="swap">
            <TokenSwap />
          </TabsContent>

          <TabsContent value="charts" className="space-y-4">
            <PriceChart tokenSymbol="BNB" tokenName="Binance Coin" />
            <PriceChart tokenSymbol="USDT" tokenName="Tether USD" />
            <PriceChart tokenSymbol="BTC" tokenName="Bitcoin" />
            <PriceChart tokenSymbol="CAMLY" tokenName="Camly Coin" />
          </TabsContent>

          <TabsContent value="portfolio">
            <PortfolioTracker balances={balances} prices={prices} />
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
                        className="flex flex-col gap-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {tx.from_user_id === user?.id ? "Đã gửi" : "Đã nhận"}{" "}
                                {tx.amount} {tx.token_type}
                              </p>
                              <Badge variant={tx.status === "completed" ? "default" : "destructive"}>
                                {tx.status === "completed" ? "Thành công" : "Thất bại"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {tx.from_user_id === user?.id
                                ? `Đến: ${tx.to_address.slice(0, 6)}...${tx.to_address.slice(-4)}`
                                : `Từ: ${tx.from_address.slice(0, 6)}...${tx.from_address.slice(-4)}`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(tx.created_at).toLocaleString("vi-VN")}
                            </p>
                          </div>
                        </div>
                        {tx.tx_hash && tx.tx_hash !== "failed" && (
                          <a
                            href={`https://bscscan.com/tx/${tx.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Xem trên BscScan
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="received">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">💰</span>
                      Lịch sử nhận tiền
                    </CardTitle>
                    <CardDescription>Tất cả tiền đã nhận vào ví</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Export as CSV
                        const csvHeader = "Thời gian,Số tiền,Token,Từ địa chỉ,TxHash,Trạng thái\n";
                        const csvData = filteredReceivedTxs.map(tx => 
                          `"${new Date(tx.created_at).toLocaleString("vi-VN")}","${tx.amount}","${tx.token_type}","${tx.from_address}","${tx.tx_hash}","${tx.status}"`
                        ).join("\n");
                        const blob = new Blob([csvHeader + csvData], { type: "text/csv;charset=utf-8;" });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = `FUN_Play_Received_${new Date().toISOString().split('T')[0]}.csv`;
                        link.click();
                        toast({ title: "Đã xuất CSV", description: "File đã được tải xuống" });
                      }}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Export as PDF
                        const doc = new jsPDF();
                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(18);
                        doc.text("FUN PLAY - Lich su nhan tien", 14, 20);
                        doc.setFontSize(10);
                        doc.setFont("helvetica", "normal");
                        doc.text(`Xuat ngay: ${new Date().toLocaleString("vi-VN")}`, 14, 28);
                        
                        autoTable(doc, {
                          startY: 35,
                          head: [["Thoi gian", "So tien", "Token", "Tu dia chi", "Trang thai"]],
                          body: filteredReceivedTxs.map(tx => [
                            new Date(tx.created_at).toLocaleString("vi-VN"),
                            tx.amount.toString(),
                            tx.token_type,
                            `${tx.from_address.slice(0, 8)}...${tx.from_address.slice(-6)}`,
                            tx.status === "completed" ? "Thanh cong" : "That bai"
                          ]),
                          theme: "grid",
                          headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0] },
                          styles: { fontSize: 8 }
                        });
                        
                        doc.save(`FUN_Play_Received_${new Date().toISOString().split('T')[0]}.pdf`);
                        toast({ title: "Đã xuất PDF", description: "File đã được tải xuống" });
                      }}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filter and Search Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <Label htmlFor="search-received" className="text-xs mb-1 block">Tìm kiếm (TxID hoặc địa chỉ)</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-received"
                        placeholder="Tìm theo TxID hoặc địa chỉ gửi..."
                        value={receivedSearchTerm}
                        onChange={(e) => setReceivedSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="w-full sm:w-[180px]">
                    <Label htmlFor="filter-token" className="text-xs mb-1 block">Lọc theo token</Label>
                    <Select value={receivedFilterToken} onValueChange={setReceivedFilterToken}>
                      <SelectTrigger id="filter-token">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="BNB">BNB</SelectItem>
                        <SelectItem value="USDT">USDT</SelectItem>
                        <SelectItem value="CAMLY">CAMLY</SelectItem>
                        <SelectItem value="BTC">BTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filteredReceivedTxs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>
                      {receivedTransactions.length === 0 
                        ? "Chưa nhận tiền nào" 
                        : "Không tìm thấy giao dịch phù hợp"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-2">
                      Hiển thị {filteredReceivedTxs.length} / {receivedTransactions.length} giao dịch
                    </p>
                    {filteredReceivedTxs.map((tx) => (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-2 p-4 border-2 rounded-lg hover:bg-accent/50 transition-all"
                        style={{
                          borderColor: "#FFD700",
                          boxShadow: "0 0 10px rgba(255, 215, 0, 0.3)",
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-[#FFD700] text-lg">
                                Đã nhận {tx.amount} {tx.token_type}
                              </p>
                              <Badge 
                                variant={tx.status === "completed" ? "default" : "destructive"}
                                className={tx.status === "completed" ? "bg-[#FFD700] text-background hover:bg-[#FFD700]" : ""}
                              >
                                {tx.status === "completed" ? "Thành công" : "Thất bại"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Từ: {tx.from_address.slice(0, 8)}...{tx.from_address.slice(-6)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(tx.created_at).toLocaleString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        {tx.tx_hash && tx.tx_hash !== "failed" && (
                          <a
                            href={`https://bscscan.com/tx/${tx.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-[#FFD700] hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Xem trên BscScan
                          </a>
                        )}
                      </motion.div>
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
