import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Globe, RefreshCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactionHistory, TransactionFilters as FilterType } from "@/hooks/useTransactionHistory";
import { TransactionCard, TransactionFilters, TransactionExport, TransactionStats } from "@/components/Transactions";

export const TransactionHistorySection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState<FilterType>({});
  
  // Use unified hook - publicMode: false = only user's transactions
  const { 
    transactions, 
    loading, 
    error, 
    stats,
    hasMore,
    loadMore,
    refresh
  } = useTransactionHistory({ 
    publicMode: false, 
    limit: 50,
    filters 
  });

  return (
    <Card className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Lịch Sử Giao Dịch Cá Nhân
            </CardTitle>
            <CardDescription>
              Giao dịch onchain liên quan đến ví của bạn (Tặng thưởng, Ủng hộ, Rút thưởng)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refresh} 
              className="gap-2"
              disabled={loading}
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/transactions")} 
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              Xem Tất Cả
            </Button>
            <TransactionExport 
              transactions={transactions} 
              filename="FUN_Play_Personal_Transactions"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats Widget */}
        {!loading && <TransactionStats stats={stats} />}
        
        {/* Filters - Compact mode for personal history */}
        <TransactionFilters 
          filters={filters} 
          onFiltersChange={setFilters}
          compact={true}
        />

        {/* Transaction List */}
        {loading && transactions.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <p>{error}</p>
            <Button variant="outline" onClick={refresh} className="mt-4">
              Thử lại
            </Button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Chưa có giao dịch onchain nào</p>
            <p className="text-sm mt-1">
              Các giao dịch tặng thưởng, ủng hộ, rút thưởng sẽ hiển thị tại đây
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            <p className="text-xs text-muted-foreground">
              Hiển thị {transactions.length} giao dịch onchain
            </p>
            {transactions.map((tx) => (
              <TransactionCard 
                key={tx.id} 
                transaction={tx} 
                currentUserId={user?.id}
              />
            ))}
            
            {/* Load more button */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Đang tải..." : "Tải thêm"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
