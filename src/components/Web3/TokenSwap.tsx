import { useState } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownUp, Loader2, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SWAP_TOKENS, PANCAKESWAP_ROUTER, TokenConfig } from "@/config/tokens";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { getWalletClient } from "@wagmi/core";
import { wagmiConfig } from "@/lib/web3Config";

const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)"
];

export const TokenSwap = () => {
  const { isConnected, address, connectWallet, isLoading: isConnecting } = useWalletConnection();
  const [fromToken, setFromToken] = useState<TokenConfig>(SWAP_TOKENS[1]); // USDT
  const [toToken, setToToken] = useState<TokenConfig>(SWAP_TOKENS[2]); // CAMLY
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  const calculateOutputAmount = async (inputAmount: string) => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setToAmount("");
      return;
    }

    setIsCalculating(true);
    try {
      const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
      const router = new ethers.Contract(PANCAKESWAP_ROUTER, ROUTER_ABI, provider);

      const amountIn = ethers.parseUnits(inputAmount, fromToken.decimals);
      const path = [fromToken.address, toToken.address];

      const amounts = await router.getAmountsOut(amountIn, path);
      const outputAmount = ethers.formatUnits(amounts[1], toToken.decimals);
      setToAmount(outputAmount);
    } catch (error) {
      console.error("Error calculating output amount:", error);
      toast({
        title: "Lỗi tính toán",
        description: "Không thể tính toán số lượng token nhận được",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSwap = async () => {
    if (!fromAmount || !toAmount) return;

    // Check wallet connection first
    if (!isConnected) {
      toast({
        title: "Chưa kết nối ví",
        description: "Vui lòng kết nối ví để hoán đổi token",
      });
      await connectWallet();
      return;
    }

    setIsSwapping(true);
    try {
      // Get wallet client from wagmi
      const walletClient = await getWalletClient(wagmiConfig);
      if (!walletClient) {
        throw new Error("Không tìm thấy ví");
      }

      // Create ethers provider - use window.ethereum if available, otherwise fallback
      const provider = new ethers.BrowserProvider((window as any).ethereum || walletClient.transport);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Check and approve token spending
      const tokenContract = new ethers.Contract(fromToken.address, ERC20_ABI, signer);
      const amountIn = ethers.parseUnits(fromAmount, fromToken.decimals);
      
      const allowance = await tokenContract.allowance(userAddress, PANCAKESWAP_ROUTER);
      if (allowance < amountIn) {
        toast({
          title: "Đang chấp thuận token...",
          description: "Vui lòng xác nhận trong ví của bạn",
        });
        const approveTx = await tokenContract.approve(PANCAKESWAP_ROUTER, amountIn);
        await approveTx.wait();
      }

      // Execute swap
      const router = new ethers.Contract(PANCAKESWAP_ROUTER, ROUTER_ABI, signer);
      const path = [fromToken.address, toToken.address];
      const amountOutMin = ethers.parseUnits(
        (parseFloat(toAmount) * 0.95).toString(), // 5% slippage
        toToken.decimals
      );
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

      toast({
        title: "Đang hoán đổi...",
        description: "Vui lòng xác nhận giao dịch trong ví của bạn",
      });

      const swapTx = await router.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        userAddress,
        deadline
      );

      toast({
        title: "Đang xử lý...",
        description: "Giao dịch đang được xác nhận trên blockchain",
      });

      const receipt = await swapTx.wait();

      toast({
        title: "Hoán đổi thành công!",
        description: `Đã swap ${fromAmount} ${fromToken.symbol} sang ${toAmount} ${toToken.symbol}`,
      });

      // Reset form
      setFromAmount("");
      setToAmount("");
    } catch (error: any) {
      console.error("Swap error:", error);
      toast({
        title: "Lỗi hoán đổi",
        description: error.message || "Không thể hoán đổi token",
        variant: "destructive",
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const handleSwitchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hoán đổi Token</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection status */}
        {!isConnected && (
          <Button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full mb-4"
            variant="outline"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {isConnecting ? "Đang kết nối..." : "Kết nối ví để swap"}
          </Button>
        )}

        <div className="space-y-2">
          <Label>Từ</Label>
          <Select
            value={fromToken.symbol}
            onValueChange={(value) => {
              const token = SWAP_TOKENS.find(t => t.symbol === value);
              if (token) setFromToken(token);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SWAP_TOKENS.map((token) => (
                <SelectItem key={token.symbol} value={token.symbol}>
                  {token.symbol} - {token.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="0.0"
            value={fromAmount}
            onChange={(e) => {
              setFromAmount(e.target.value);
              calculateOutputAmount(e.target.value);
            }}
          />
        </div>

        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwitchTokens}
            className="rounded-full"
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Sang</Label>
          <Select
            value={toToken.symbol}
            onValueChange={(value) => {
              const token = SWAP_TOKENS.find(t => t.symbol === value);
              if (token) setToToken(token);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SWAP_TOKENS.map((token) => (
                <SelectItem key={token.symbol} value={token.symbol}>
                  {token.symbol} - {token.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="0.0"
            value={toAmount}
            readOnly
            disabled={isCalculating}
          />
        </div>

        <Button
          className="w-full"
          onClick={handleSwap}
          disabled={!fromAmount || !toAmount || isSwapping || isCalculating || !isConnected}
        >
          {isSwapping ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang hoán đổi...
            </>
          ) : isCalculating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tính toán...
            </>
          ) : !isConnected ? (
            "Kết nối ví trước"
          ) : (
            "Hoán đổi"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Sử dụng PancakeSwap Router v2 trên BSC
        </p>
      </CardContent>
    </Card>
  );
};
