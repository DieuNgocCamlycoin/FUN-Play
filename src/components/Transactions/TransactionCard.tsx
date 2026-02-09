import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ArrowDownLeft, ExternalLink, Copy, Check, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UnifiedTransaction } from "@/hooks/useTransactionHistory";
import { WalletAddressDisplay } from "./WalletAddressDisplay";
import { useState } from "react";

interface TransactionCardProps {
  transaction: UnifiedTransaction;
  currentUserId?: string;
  showFullDetails?: boolean;
  index?: number;
}

export const TransactionCard = memo(function TransactionCard({
  transaction,
  currentUserId,
  showFullDetails = true,
  index = 0,
}: TransactionCardProps) {
  const navigate = useNavigate();
  const [txCopied, setTxCopied] = useState(false);

  const isSender = currentUserId === transaction.sender_user_id;
  const isReceiver = currentUserId === transaction.receiver_user_id;
  const isIncoming = isReceiver && !isSender;

  const getTypeLabel = () => {
    switch (transaction.transaction_type) {
      case "tip": return "Tip";
      case "donate": return "Ủng hộ";
      case "reward": return "Thưởng";
      case "claim": return "Rút thưởng";
      case "transfer": return "Chuyển tiền";
      default: return "Giao dịch";
    }
  };

  const getTypeBadgeColor = () => {
    switch (transaction.transaction_type) {
      case "tip": return "bg-pink-500/10 text-pink-500 border-pink-500/20";
      case "donate": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "reward": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "claim": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "transfer": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-muted";
    }
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case "success": return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case "pending": return <Clock className="h-3.5 w-3.5 text-amber-500" />;
      case "failed": return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      default: return null;
    }
  };

  const getStatusLabel = () => {
    switch (transaction.status) {
      case "success": return "Thành công";
      case "pending": return "Chờ xử lý";
      case "failed": return "Thất bại";
      default: return transaction.status;
    }
  };

  const handleCopyTxHash = async () => {
    if (!transaction.tx_hash) return;
    try {
      await navigator.clipboard.writeText(transaction.tx_hash);
      setTxCopied(true);
      toast.success("Đã sao chép mã giao dịch!");
      setTimeout(() => setTxCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
    >
      <Card className="p-4 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-200">
        <div className="space-y-3">
          {/* Header: Sender → Receiver */}
          <div className="flex items-center justify-between gap-4">
            {/* Sender */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar 
                className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={() => transaction.sender_user_id && navigate(`/user/${transaction.sender_user_id}`)}
              >
                <AvatarImage src={transaction.sender_avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {transaction.sender_display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p 
                  className="text-sm font-medium truncate cursor-pointer hover:text-primary transition-colors"
                  onClick={() => transaction.sender_user_id && navigate(`/user/${transaction.sender_user_id}`)}
                >
                  {transaction.sender_display_name}
                </p>
                {showFullDetails && transaction.wallet_from && (
                  <WalletAddressDisplay
                    address={transaction.wallet_from}
                    fullAddress={transaction.wallet_from_full}
                    chain={transaction.chain}
                    size="sm"
                  />
                )}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Receiver */}
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <div className="min-w-0 text-right">
                <p 
                  className="text-sm font-medium truncate cursor-pointer hover:text-primary transition-colors"
                  onClick={() => transaction.receiver_user_id && navigate(`/user/${transaction.receiver_user_id}`)}
                >
                  {transaction.receiver_display_name}
                </p>
                {showFullDetails && transaction.wallet_to && (
                  <WalletAddressDisplay
                    address={transaction.wallet_to}
                    fullAddress={transaction.wallet_to_full}
                    chain={transaction.chain}
                    size="sm"
                    className="justify-end"
                  />
                )}
              </div>
              <Avatar 
                className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={() => transaction.receiver_user_id && navigate(`/user/${transaction.receiver_user_id}`)}
              >
                <AvatarImage src={transaction.receiver_avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {transaction.receiver_display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Amount & Type */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-[10px] font-medium", getTypeBadgeColor())}>
                {getTypeLabel()}
              </Badge>
              {transaction.is_onchain && (
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  Onchain
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1.5">
              {currentUserId && (
                isIncoming ? (
                  <ArrowDownLeft className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                )
              )}
              <span className={cn(
                "text-lg font-bold",
                currentUserId 
                  ? (isIncoming ? "text-green-500" : "text-red-500")
                  : "text-primary"
              )}>
                {currentUserId && (isIncoming ? "+" : "-")}{formatAmount(transaction.amount)}
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                {transaction.token_symbol}
              </span>
            </div>
          </div>

          {/* Message */}
          {transaction.message && (
            <p className="text-sm text-muted-foreground italic bg-muted/30 rounded-md px-3 py-2">
              "{transaction.message}"
            </p>
          )}

          {/* Footer: Status, Time, TX Hash */}
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-1 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {getStatusIcon()}
                <span>{getStatusLabel()}</span>
              </div>
              <span>•</span>
              <span>{formatDate(transaction.created_at)}</span>
              {transaction.chain && (
                <>
                  <span>•</span>
                  <span className="uppercase font-medium">{transaction.chain}</span>
                </>
              )}
            </div>

            {transaction.tx_hash && (
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        TX: {transaction.tx_hash.slice(0, 8)}...
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-mono text-xs break-all max-w-xs">{transaction.tx_hash}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={handleCopyTxHash}
                >
                  {txCopied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => window.open(transaction.explorer_url!, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
});
