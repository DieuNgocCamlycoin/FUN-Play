import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const CAMLY_TOKEN = {
  name: "CAMLY Coin",
  symbol: "CAMLY",
  address: "0x0910320181889fefde0bb1ca63962b0a8882e413",
  chain: "BNB Smart Chain (BSC)",
  chainId: 56,
  decimals: 18,
  logo: "/images/camly-coin.png",
};

export const CAMLYTokenInfo = () => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyAddress = () => {
    navigator.clipboard.writeText(CAMLY_TOKEN.address);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Token address copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const addToMetaMask = async () => {
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to add the token",
        variant: "destructive",
      });
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: CAMLY_TOKEN.address,
            symbol: CAMLY_TOKEN.symbol,
            decimals: CAMLY_TOKEN.decimals,
            image: window.location.origin + CAMLY_TOKEN.logo,
          },
        },
      });
      toast({
        title: "Token added!",
        description: "CAMLY has been added to MetaMask",
      });
    } catch (error: any) {
      toast({
        title: "Failed to add token",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-gradient-to-br from-[#FFD700]/10 via-[#FF9500]/10 to-[#FFD700]/5 border-2 border-[#FFD700]/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <img src={CAMLY_TOKEN.logo} alt="CAMLY" className="w-8 h-8" />
          <span className="bg-gradient-to-r from-[#FFD700] to-[#FF9500] bg-clip-text text-transparent">
            {CAMLY_TOKEN.name}
          </span>
          <Badge variant="outline" className="ml-auto text-[#00E7FF] border-[#00E7FF]">
            BEP-20
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Symbol</span>
            <span className="font-medium">{CAMLY_TOKEN.symbol}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Network</span>
            <span className="font-medium">{CAMLY_TOKEN.chain}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Decimals</span>
            <span className="font-medium">{CAMLY_TOKEN.decimals}</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-background/50 border">
          <div className="text-xs text-muted-foreground mb-1">Contract Address</div>
          <div className="flex items-center gap-2">
            <code className="text-xs flex-1 truncate">{CAMLY_TOKEN.address}</code>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyAddress}
              className="h-8 w-8 p-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={addToMetaMask}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
              alt="MetaMask"
              className="w-4 h-4 mr-2"
            />
            Add to MetaMask
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href={`https://bscscan.com/token/${CAMLY_TOKEN.address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>

        <div className="pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            <strong>About CAMLY:</strong> The native reward token of FUN PLAY Web3 platform. 
            Users earn CAMLY through watching videos, commenting, sharing, and creating content.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
