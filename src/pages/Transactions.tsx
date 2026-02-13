import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, History, RefreshCw, Loader2, Globe, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MainLayout } from "@/components/Layout/MainLayout";
import { useNavigate } from "react-router-dom";
import { useTransactionHistory, TransactionFilters as FilterType } from "@/hooks/useTransactionHistory";
import { TransactionCard, TransactionFilters, TransactionExport, TransactionStats, UserActivityStats } from "@/components/Transactions";
import { useIsMobile } from "@/hooks/use-mobile";

const TransactionsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<FilterType>({});
  
  const { 
    transactions, 
    loading, 
    error, 
    stats, 
    hasMore, 
    loadMore, 
    refresh 
  } = useTransactionHistory({ 
    publicMode: true, 
    limit: 200,
    filters 
  });

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 max-w-5xl">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-4 sm:mb-6"
          >
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <motion.div
                  animate={{ 
                    boxShadow: [
                      "0 0 15px hsl(var(--primary)/0.3)", 
                      "0 0 30px hsl(var(--primary)/0.5)", 
                      "0 0 15px hsl(var(--primary)/0.3)"
                    ] 
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-9 w-9 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"
                >
                  <Globe className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                </motion.div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Lịch Sử Giao Dịch</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 truncate">
                    <Link2 className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {isMobile ? "Blockchain • Web3" : "Minh bạch • Truy vết Blockchain • Chuẩn Web3"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button 
                variant="outline" 
                size="icon"
                onClick={refresh}
                disabled={loading}
                className="h-8 w-8 sm:h-9 sm:w-auto sm:px-3"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline ml-2">Làm mới</span>
              </Button>
              <TransactionExport transactions={transactions} filename="FUN_Play_Public_Transactions" />
            </div>
          </motion.div>

          {/* User Activity Stats (only for logged-in users) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <UserActivityStats className="mb-4 sm:mb-6" />
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TransactionStats stats={stats} className="mb-4 sm:mb-6" />
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isMobile ? (
              <div className="mb-4">
                <TransactionFilters filters={filters} onFiltersChange={setFilters} />
              </div>
            ) : (
              <Card className="mb-6 bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    Bộ lọc & Tìm kiếm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TransactionFilters filters={filters} onFiltersChange={setFilters} />
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Transaction List */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-3 px-3 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm sm:text-base">Danh Sách Giao Dịch</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {isMobile ? "Giao dịch onchain công khai" : "Mọi giao dịch onchain công khai (ai cũng có thể xem)"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {error && (
                  <div className="text-center py-8 text-destructive">
                    <p>Lỗi: {error}</p>
                    <Button variant="outline" size="sm" onClick={refresh} className="mt-2">
                      Thử lại
                    </Button>
                  </div>
                )}

                {loading && transactions.length === 0 ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-24 sm:h-32 w-full rounded-lg" />
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <History className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-base sm:text-lg font-medium">Chưa có giao dịch nào</p>
                    <p className="text-xs sm:text-sm mt-1">Các giao dịch công khai sẽ hiển thị ở đây</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {transactions.map((tx, index) => (
                      <TransactionCard 
                        key={tx.id} 
                        transaction={tx} 
                        showFullDetails={!isMobile}
                        index={index}
                      />
                    ))}

                    {/* Load More */}
                    {hasMore && (
                      <div className="text-center pt-4">
                        <Button 
                          variant="outline" 
                          onClick={loadMore}
                          disabled={loading}
                          className="gap-2"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                          Tải thêm giao dịch
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6 sm:mt-8 text-xs text-muted-foreground"
          >
            <p>FUN PLAY • Blockchain Transparent • Web3 Standard</p>
            <p className="mt-1">Tất cả giao dịch có thể được xác minh trên blockchain</p>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TransactionsPage;
