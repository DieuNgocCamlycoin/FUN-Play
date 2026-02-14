import { useEffect, useState } from "react";
import funplayPlanetLogo from "@/assets/funplay-planet-logo.png";
import { useParams, Link } from "react-router-dom";
import { Gift, ExternalLink, Copy, ArrowRight, Play, FileText, Loader2, Wallet, CheckCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

function ClaimReceipt({ claimId }: { claimId: string }) {
  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-claim-receipt?claim_id=${claimId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );
        const data = await response.json();
        if (!response.ok || !data.success) {
          setError(data.error || "Không tìm thấy biên nhận claim");
        } else {
          setClaim(data.claim);
        }
      } catch {
        setError("Lỗi khi tải biên nhận");
      } finally {
        setLoading(false);
      }
    };
    fetchClaim();
  }, [claimId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Đã copy link biên nhận!" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4">
        <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy biên nhận</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Link to="/">
          <Button>Về trang chủ</Button>
        </Link>
      </div>
    );
  }

  const profile = claim.profiles;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-xl border-green-200 dark:border-green-800 overflow-hidden">
        {/* Premium gradient header */}
        <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-6 text-white text-center">
          <div className="flex justify-center mb-3">
            <img src={funplayPlanetLogo} alt="FUN Play" className="h-14 w-14 rounded-full object-cover border-2 border-white/50" />
          </div>
          <h1 className="text-lg font-bold tracking-wide">FUN PLAY - BIÊN NHẬN CLAIM</h1>
          <p className="text-xs text-white/70 mt-1">Rút thưởng CAMLY thành công</p>
        </div>

        <CardContent className="p-6 space-y-5">
          {/* User info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-green-200">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback>{profile?.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profile?.display_name || profile?.username}</p>
              <p className="text-sm text-muted-foreground">@{profile?.username}</p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
          </div>

          <Separator />

          {/* Amount */}
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-1">Số CAMLY đã rút</p>
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-7 w-7 text-green-500" />
              <span className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                {new Intl.NumberFormat("vi-VN").format(claim.amount)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">CAMLY</p>
          </div>

          <Separator />

          {/* Wallet */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ví nhận</span>
              <span className="font-mono text-xs">{claim.wallet_address?.slice(0, 10)}...{claim.wallet_address?.slice(-8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Thời gian</span>
              <span>{format(new Date(claim.created_at), "HH:mm dd/MM/yyyy", { locale: vi })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trạng thái</span>
              <span className={`font-medium ${
                claim.status === "success" ? "text-green-600" : 
                claim.status === "pending" ? "text-amber-600" : "text-red-600"
              }`}>
                {claim.status === "success" ? "✅ Thành công" : 
                 claim.status === "pending" ? "⏳ Đang xử lý" : "❌ Thất bại"}
              </span>
            </div>
            {claim.tx_hash && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">TX Hash</span>
                <a
                  href={`https://bscscan.com/tx/${claim.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary flex items-center gap-1"
                >
                  {claim.tx_hash.substring(0, 8)}...{claim.tx_hash.substring(claim.tx_hash.length - 6)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Sao chép link
            </Button>
            <Link to="/" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                Về FUN Play
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DonationReceipt({ receiptPublicId }: { receiptPublicId: string }) {
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-donation-receipt?receipt_public_id=${receiptPublicId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );
        const data = await response.json();
        if (!response.ok || !data.success) {
          setError(data.error || "Không tìm thấy biên nhận");
        } else {
          setReceipt(data.receipt);
        }
      } catch {
        setError("Lỗi khi tải biên nhận");
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [receiptPublicId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Đã copy link biên nhận!" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <Gift className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy biên nhận</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Link to="/">
          <Button>Về trang chủ</Button>
        </Link>
      </div>
    );
  }

  const sender = receipt.sender;
  const receiver = receipt.receiver;
  const token = receipt.token;
  const contextInfo = receipt.context_info;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-xl border-amber-200">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <img src={funplayPlanetLogo} alt="FUN Play" className="h-12 w-12 rounded-full object-cover" />
            </div>
            <h1 className="text-xl font-bold">FUN PLAY - Biên Nhận Tặng</h1>
            <p className="text-sm text-muted-foreground">#{receipt.receipt_public_id}</p>
          </div>

          <Separator />

          {/* Sender → Receiver */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-amber-200">
                <AvatarImage src={sender?.avatar_url || ""} />
                <AvatarFallback>{sender?.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{sender?.display_name || sender?.username}</p>
                <p className="text-sm text-muted-foreground">@{sender?.username}</p>
              </div>
            </div>
            
            <ArrowRight className="h-6 w-6 text-amber-500" />
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-medium">{receiver?.display_name || receiver?.username}</p>
                <p className="text-sm text-muted-foreground">@{receiver?.username}</p>
              </div>
              <Avatar className="h-12 w-12 border-2 border-amber-200">
                <AvatarImage src={receiver?.avatar_url || ""} />
                <AvatarFallback>{receiver?.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <Separator />

          {/* Amount */}
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              {token?.icon_url && (
                <img src={token.icon_url} alt={token.symbol} className="h-8 w-8" />
              )}
              <span className="text-3xl font-bold text-amber-600">
                {receipt.amount} {token?.symbol}
              </span>
            </div>
            {receipt.amount_usd && (
              <p className="text-muted-foreground">≈ ${receipt.amount_usd.toFixed(2)} USD</p>
            )}
          </div>

          {/* Message */}
          {receipt.message && (
            <>
              <Separator />
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Lời nhắn:</p>
                <p className="italic">"{receipt.message}"</p>
              </div>
            </>
          )}

          {/* Context */}
          {contextInfo && (
            <>
              <Separator />
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {contextInfo.type === "video" ? (
                  <>
                    {contextInfo.thumbnail_url && (
                      <img
                        src={contextInfo.thumbnail_url}
                        alt=""
                        className="h-12 w-20 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Tặng tại video</p>
                      <p className="font-medium truncate">{contextInfo.title}</p>
                    </div>
                    <Link to={`/watch/${contextInfo.id}`}>
                      <Button size="sm" variant="ghost">
                        <Play className="h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                ) : contextInfo.type === "post" ? (
                  <>
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Tặng tại bài viết</p>
                      <p className="truncate">{contextInfo.content?.substring(0, 50)}...</p>
                    </div>
                    <Link to={`/post/${contextInfo.id}`}>
                      <Button size="sm" variant="ghost">Xem</Button>
                    </Link>
                  </>
                ) : null}
              </div>
            </>
          )}

          <Separator />

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Thời gian</span>
              <span>{format(new Date(receipt.created_at), "HH:mm dd/MM/yyyy", { locale: vi })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loại</span>
              <span className="capitalize">{receipt.chain === "internal" ? "Nội bộ" : "BSC"}</span>
            </div>
            {receipt.tx_hash && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">TX Hash</span>
                <a
                  href={receipt.explorer_url || `https://bscscan.com/tx/${receipt.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary flex items-center gap-1"
                >
                  {receipt.tx_hash.substring(0, 8)}...{receipt.tx_hash.substring(receipt.tx_hash.length - 6)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trạng thái</span>
              <span className={`font-medium ${
                receipt.status === "success" ? "text-green-600" : 
                receipt.status === "pending" ? "text-amber-600" : "text-red-600"
              }`}>
                {receipt.status === "success" ? "Thành công" : 
                 receipt.status === "pending" ? "Đang xử lý" : "Thất bại"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Sao chép link
            </Button>
            <Link to="/" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500">
                Về FUN Play
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Receipt() {
  const { receiptPublicId } = useParams<{ receiptPublicId: string }>();

  if (!receiptPublicId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Gift className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy biên nhận</h1>
        <Link to="/"><Button>Về trang chủ</Button></Link>
      </div>
    );
  }

  // Detect claim receipt vs donation receipt
  if (receiptPublicId.startsWith("claim-")) {
    const claimId = receiptPublicId.replace("claim-", "");
    return <ClaimReceipt claimId={claimId} />;
  }

  return <DonationReceipt receiptPublicId={receiptPublicId} />;
}
