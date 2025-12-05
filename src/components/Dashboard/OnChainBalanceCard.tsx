import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, RefreshCw, ExternalLink } from "lucide-react";
import { useOnChainBalance } from "@/hooks/useOnChainBalance";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";

interface OnChainBalanceCardProps {
  walletAddress: string | null;
}

export const OnChainBalanceCard = ({ walletAddress }: OnChainBalanceCardProps) => {
  const { balances, loading, error, refetch } = useOnChainBalance(walletAddress);
  const { prices } = useCryptoPrices();

  const tokens = [
    { symbol: "CAMLY", balance: balances.camly, icon: "/images/camly-coin.png", priceKey: "camly" },
    { symbol: "BNB", balance: balances.bnb, icon: "https://cryptologos.cc/logos/bnb-bnb-logo.svg", priceKey: "binancecoin" },
    { symbol: "USDT", balance: balances.usdt, icon: "https://cryptologos.cc/logos/tether-usdt-logo.svg", priceKey: "tether" },
    { symbol: "BTC", balance: balances.btc, icon: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg", priceKey: "bitcoin" },
  ];

  const calculateUsdValue = (symbol: string, balance: string) => {
    const priceKey = tokens.find(t => t.symbol === symbol)?.priceKey;
    if (!priceKey || !prices[priceKey]) return null;
    return (parseFloat(balance) * prices[priceKey]).toFixed(2);
  };

  const totalUsdValue = tokens.reduce((sum, token) => {
    const usdValue = calculateUsdValue(token.symbol, token.balance);
    return sum + (usdValue ? parseFloat(usdValue) : 0);
  }, 0);

  if (!walletAddress) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/30">
        <CardContent className="p-8 text-center">
          <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Connect your wallet to view on-chain balances</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-[#00E7FF]/10 via-[#7A2BFF]/10 to-[#FF00E5]/10 border-2 border-[#FFD700]/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#FFD700]" />
          On-Chain Wallet Balance
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <a
            href={`https://bscscan.com/address/${walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00E7FF] hover:underline text-sm flex items-center gap-1"
          >
            <ExternalLink className="w-4 h-4" />
            BscScan
          </a>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-destructive text-center py-4">{error}</div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-sm text-muted-foreground">Total Portfolio Value</div>
              <div className="text-4xl font-black bg-gradient-to-r from-[#FFD700] to-[#FF9500] bg-clip-text text-transparent">
                ${totalUsdValue.toLocaleString()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {tokens.map((token) => {
                const usdValue = calculateUsdValue(token.symbol, token.balance);
                return (
                  <div
                    key={token.symbol}
                    className="p-4 rounded-lg bg-background/50 border border-border/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <img src={token.icon} alt={token.symbol} className="w-6 h-6" />
                      <span className="font-medium">{token.symbol}</span>
                    </div>
                    <div className="text-xl font-bold">
                      {loading ? "..." : parseFloat(token.balance).toLocaleString()}
                    </div>
                    {usdValue && (
                      <div className="text-sm text-muted-foreground">
                        ≈ ${parseFloat(usdValue).toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-center text-xs text-muted-foreground">
              Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
