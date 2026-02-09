import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, Search, ExternalLink, Download, ArrowUpRight, ArrowDownLeft, Filter, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  type: "reward" | "donation_sent" | "donation_received";
  amount: number;
  token: string;
  status: string;
  created_at: string;
  tx_hash?: string;
  sender?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  receiver?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  reward_type?: string;
}

export const TransactionHistorySection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tokenFilter, setTokenFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const allTransactions: Transaction[] = [];

      // Fetch reward transactions
      const { data: rewards } = await supabase
        .from("reward_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (rewards) {
        rewards.forEach(r => {
          allTransactions.push({
            id: r.id,
            type: "reward",
            amount: r.amount,
            token: "CAMLY",
            status: r.status,
            created_at: r.created_at,
            tx_hash: r.claim_tx_hash || r.tx_hash,
            reward_type: r.reward_type,
          });
        });
      }

      // Fetch sent donations (flat query, no joins)
      const { data: sentDonations } = await supabase
        .from("donation_transactions")
        .select("*")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      // Fetch received donations (flat query, no joins)
      const { data: receivedDonations } = await supabase
        .from("donation_transactions")
        .select("*")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      // Collect unique user IDs and token IDs for separate lookups
      const userIds = new Set<string>();
      const tokenIds = new Set<string>();

      [...(sentDonations || []), ...(receivedDonations || [])].forEach(d => {
        if (d.sender_id) userIds.add(d.sender_id);
        if (d.receiver_id) userIds.add(d.receiver_id);
        if (d.token_id) tokenIds.add(d.token_id);
      });

      // Fetch profiles and tokens in parallel
      const [profilesRes, tokensRes] = await Promise.all([
        userIds.size > 0
          ? supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", Array.from(userIds))
          : Promise.resolve({ data: [] }),
        tokenIds.size > 0
          ? supabase.from("donate_tokens").select("id, symbol").in("id", Array.from(tokenIds))
          : Promise.resolve({ data: [] }),
      ]);

      // Build lookup maps
      const profilesMap: Record<string, { id: string; username: string; display_name: string; avatar_url: string }> = {};
      (profilesRes.data || []).forEach(p => { profilesMap[p.id] = p; });

      const tokensMap: Record<string, { id: string; symbol: string }> = {};
      (tokensRes.data || []).forEach(t => { tokensMap[t.id] = t; });

      // Build sent donation transactions
      if (sentDonations) {
        sentDonations.forEach(d => {
          allTransactions.push({
            id: d.id,
            type: "donation_sent",
            amount: d.amount,
            token: tokensMap[d.token_id]?.symbol || "CAMLY",
            status: d.status,
            created_at: d.created_at,
            tx_hash: d.tx_hash,
            receiver: profilesMap[d.receiver_id] || undefined,
          });
        });
      }

      // Build received donation transactions
      if (receivedDonations) {
        receivedDonations.forEach(d => {
          allTransactions.push({
            id: d.id,
            type: "donation_received",
            amount: d.amount,
            token: tokensMap[d.token_id]?.symbol || "CAMLY",
            status: d.status,
            created_at: d.created_at,
            tx_hash: d.tx_hash,
            sender: profilesMap[d.sender_id] || undefined,
          });
        });
      }

      // Sort by date
      allTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setTransactions(allTransactions);
      setFilteredTransactions(allTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Apply filters
  useEffect(() => {
    let filtered = [...transactions];

    // Token filter
    if (tokenFilter !== "all") {
      filtered = filtered.filter(t => t.token === tokenFilter);
    }

    // Time filter
    if (timeFilter !== "all") {
      const now = new Date();
      const days = timeFilter === "7d" ? 7 : timeFilter === "30d" ? 30 : 0;
      if (days > 0) {
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(t => new Date(t.created_at) >= cutoff);
      }
    }

    // Direction filter
    if (directionFilter !== "all") {
      filtered = filtered.filter(t => {
        if (directionFilter === "sent") return t.type === "donation_sent";
        if (directionFilter === "received") return t.type === "reward" || t.type === "donation_received";
        return true;
      });
    }

    // Search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.tx_hash?.toLowerCase().includes(search) ||
        t.sender?.username?.toLowerCase().includes(search) ||
        t.receiver?.username?.toLowerCase().includes(search)
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, tokenFilter, timeFilter, directionFilter, searchTerm]);

  const exportCSV = () => {
    const headers = "Thời gian,Loại,Số tiền,Token,Trạng thái,Người gửi,Người nhận,Tx Hash,Link BSC\n";
    const rows = filteredTransactions.map(t => {
      const sender = t.sender?.username || (t.type === "reward" ? "Hệ thống" : "Bạn");
      const receiver = t.receiver?.username || (t.type === "reward" ? "Bạn" : "Không có");
      const bscLink = t.tx_hash ? `https://bscscan.com/tx/${t.tx_hash}` : "";
      return `"${new Date(t.created_at).toLocaleString("vi-VN")}","${t.type}","${t.amount}","${t.token}","${t.status}","${sender}","${receiver}","${t.tx_hash || ""}","${bscLink}"`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `FUN_Play_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({ title: "Đã xuất CSV", description: "File đã được tải xuống" });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("FUN PLAY - Lich su giao dich", 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Xuat ngay: ${new Date().toLocaleString("vi-VN")}`, 14, 28);
    
    autoTable(doc, {
      startY: 35,
      head: [["Thoi gian", "Loai", "So tien", "Token", "Trang thai"]],
      body: filteredTransactions.map(t => [
        new Date(t.created_at).toLocaleString("vi-VN"),
        t.type === "reward" ? "Thuong" : t.type === "donation_sent" ? "Gui" : "Nhan",
        t.amount.toString(),
        t.token,
        t.status === "success" ? "Thanh cong" : t.status
      ]),
      theme: "grid",
      headStyles: { fillColor: [255, 215, 0], textColor: [0, 0, 0] },
      styles: { fontSize: 8 }
    });
    
    doc.save(`FUN_Play_Transactions_${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: "Đã xuất PDF", description: "File đã được tải xuống" });
  };

  const getTypeIcon = (type: string) => {
    if (type === "donation_sent") return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
  };

  const getTypeLabel = (type: string, rewardType?: string) => {
    if (type === "reward") return `Thưởng ${rewardType || ""}`;
    if (type === "donation_sent") return "Đã gửi";
    return "Đã nhận";
  };

  return (
    <Card className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-500" />
              Lịch Sử Giao Dịch
            </CardTitle>
            <CardDescription>
              Tất cả giao dịch rewards và donations của bạn
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/transactions")} 
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              Xem Tất Cả
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF} className="gap-2">
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs mb-1 block">Tìm kiếm</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Username, Tx hash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Token</Label>
            <Select value={tokenFilter} onValueChange={setTokenFilter}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="CAMLY">CAMLY</SelectItem>
                <SelectItem value="BNB">BNB</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Thời gian</Label>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="7d">7 ngày</SelectItem>
                <SelectItem value="30d">30 ngày</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Loại</Label>
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="sent">Đã gửi</SelectItem>
                <SelectItem value="received">Đã nhận</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{transactions.length === 0 ? "Chưa có giao dịch nào" : "Không tìm thấy giao dịch"}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            <p className="text-xs text-muted-foreground">
              Hiển thị {filteredTransactions.length} / {transactions.length} giao dịch
            </p>
            {filteredTransactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all"
              >
                {/* Type Icon */}
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  tx.type === "donation_sent" ? "bg-red-500/10" : "bg-green-500/10"
                )}>
                  {getTypeIcon(tx.type)}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{getTypeLabel(tx.type, tx.reward_type)}</p>
                    <Badge variant={tx.status === "success" ? "default" : "secondary"} className="text-[10px]">
                      {tx.status === "success" ? "Thành công" : tx.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{new Date(tx.created_at).toLocaleString("vi-VN")}</span>
                    {tx.sender && (
                      <span 
                        className="cursor-pointer hover:text-primary"
                        onClick={() => navigate(`/user/${tx.sender?.id}`)}
                      >
                        Từ: @{tx.sender.username}
                      </span>
                    )}
                    {tx.receiver && (
                      <span 
                        className="cursor-pointer hover:text-primary"
                        onClick={() => navigate(`/user/${tx.receiver?.id}`)}
                      >
                        Đến: @{tx.receiver.username}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Amount */}
                <div className="text-right">
                  <p className={cn(
                    "font-bold",
                    tx.type === "donation_sent" ? "text-red-500" : "text-green-500"
                  )}>
                    {tx.type === "donation_sent" ? "-" : "+"}{tx.amount.toLocaleString()} {tx.token}
                  </p>
                  {tx.tx_hash && (
                    <a
                      href={`https://bscscan.com/tx/${tx.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 justify-end"
                    >
                      BSCScan <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
