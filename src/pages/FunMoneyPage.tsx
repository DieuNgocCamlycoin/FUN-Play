/**
 * FUN Money Page
 * Main user interface for PPLP Protocol - Auto-Mint Flow
 */

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Coins, 
  Sparkles, 
  FileText,
  ExternalLink,
  Info,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMintRequest } from '@/hooks/useFunMoneyMintRequest';
import { useFunMoneyWallet } from '@/hooks/useFunMoneyWallet';
import { useMintRequestRealtime } from '@/hooks/useMintRequestRealtime';
import { useLightActivity } from '@/hooks/useLightActivity';
import { 
  TokenLifecyclePanel, 
  MintRequestList,
  MintableCard,
  LightActivityBreakdown,
  ActivitySummary
} from '@/components/FunMoney';
import { cn } from '@/lib/utils';
import { BackButton } from '@/components/ui/back-button';

export default function FunMoney() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { 
    loading: requestsLoading, 
    getMyRequests 
  } = useMintRequest();

  const {
    isConnected: isWalletConnected,
    chainId,
    isCorrectChain
  } = useFunMoneyWallet();

  // Light Activity hook for auto-mint
  const { 
    activity, 
    loading: activityLoading, 
    refetch: refetchActivity 
  } = useLightActivity(user?.id);

  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Fetch user's requests
  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    const data = await getMyRequests();
    setMyRequests(data);
    setLoadingRequests(false);
  }, [getMyRequests]);

  // Memoized callback for realtime updates - stable reference
  const handleRealtimeUpdate = useCallback(() => {
    fetchRequests();
    refetchActivity();
  }, [fetchRequests, refetchActivity]);

  // Realtime subscription
  const { isConnected, connectionStatus } = useMintRequestRealtime({
    userId: user?.id,
    onUpdate: handleRealtimeUpdate,
    enabled: !!user,
  });

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, fetchRequests]);

  // Handle mint success
  const handleMintSuccess = () => {
    setActiveTab('history');
    fetchRequests();
    refetchActivity();
  };

  // Show public content if not logged in
  if (!authLoading && !user) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 text-center py-20">
          <Coins className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Đăng nhập để sử dụng FUN Money</h2>
          <p className="text-muted-foreground mb-4">Bạn cần đăng nhập để mint token FUN từ hoạt động của mình</p>
          <Button onClick={() => window.location.href = '/auth'}>Đăng nhập</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BackButton />
            <div>
            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              FUN Money
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Proof of Pure Love Protocol - Nhận token từ hoạt động của bạn
            </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Realtime Status Indicator */}
            <Badge 
              variant="outline"
              className={cn(
                "gap-1.5 py-1.5 px-2",
                connectionStatus === 'connected' && "bg-green-500/20 text-green-500 border-green-500/30",
                connectionStatus === 'connecting' && "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
                connectionStatus === 'disconnected' && "bg-red-500/20 text-red-500 border-red-500/30"
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full",
                connectionStatus === 'connected' && "bg-green-500 animate-pulse",
                connectionStatus === 'connecting' && "bg-yellow-500 animate-pulse",
                connectionStatus === 'disconnected' && "bg-red-500"
              )} />
              {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
            </Badge>

            {/* Refresh Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                refetchActivity();
                fetchRequests();
              }}
              disabled={activityLoading || loadingRequests}
            >
              <RefreshCw className={cn(
                "w-4 h-4",
                (activityLoading || loadingRequests) && "animate-spin"
              )} />
            </Button>
          </div>
        </div>

        {/* Mintable FUN Card - Main CTA */}
        <MintableCard 
          activity={activity}
          loading={activityLoading}
          onMintSuccess={handleMintSuccess}
        />

        {/* Token Lifecycle Panel */}
        <TokenLifecyclePanel requests={myRequests} />

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
            <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="truncate">Tổng Quan</span>
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="gap-1.5 text-xs sm:text-sm">
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="truncate">Chi Tiết</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="truncate">Lịch Sử</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* What is PPLP */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    PPLP là gì?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Proof of Pure Love Protocol</strong> tự động đánh giá 
                    hoạt động của bạn trên nền tảng và cho phép bạn mint token FUN.
                  </p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">5 Trụ Cột Ánh Sáng:</p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-xs">
                      {[
                        { key: 'S', name: 'Service', emoji: '🙏' },
                        { key: 'T', name: 'Truth', emoji: '💎' },
                        { key: 'H', name: 'Healing', emoji: '💚' },
                        { key: 'C', name: 'Contribution', emoji: '🎁' },
                        { key: 'U', name: 'Unity', emoji: '🤝' }
                      ].map(pillar => (
                        <div key={pillar.key} className="p-2 bg-muted rounded-lg">
                          <span className="text-lg">{pillar.emoji}</span>
                          <p className="font-bold mt-1">{pillar.key}</p>
                          <p className="text-muted-foreground">{pillar.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How it works - Updated for Auto-Mint */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Quy Trình Mới
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { step: 1, title: 'Hoạt động', desc: 'Xem video, like, comment, upload trên nền tảng' },
                      { step: 2, title: 'Tự động tính điểm', desc: 'Hệ thống tính Light Score từ hoạt động của bạn' },
                      { step: 3, title: 'Bấm MINT', desc: 'Chỉ cần 1 click để tạo yêu cầu mint FUN' },
                      { step: 4, title: 'Nhận FUN', desc: 'Admin duyệt → Token mint vào ví của bạn' }
                    ].map(item => (
                      <div key={item.step} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {item.step}
                        </div>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Requests', value: myRequests.length, icon: FileText },
                { label: 'Pending', value: myRequests.filter(r => r.status === 'pending').length, icon: Sparkles },
                { label: 'Minted', value: myRequests.filter(r => r.status === 'minted').length, icon: Coins },
                { label: 'Rejected', value: myRequests.filter(r => r.status === 'rejected').length, icon: FileText }
              ].map(stat => (
                <Card key={stat.label}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <stat.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* BSCScan Link */}
            <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Coins className="w-6 h-6 text-primary" />
                    <div>
                      <p className="font-medium">FUN Money Contract</p>
                      <p className="text-xs text-muted-foreground">BSC Testnet</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href="https://testnet.bscscan.com/address/0x1aa8BF20E0b6aE9e5C0b36e7bF8C8Faab015ff2"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Contract
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Breakdown Tab - Light Activity Details */}
          <TabsContent value="breakdown" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LightActivityBreakdown activity={activity} />
              <ActivitySummary activity={activity} />
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            <MintRequestList 
              requests={myRequests}
              loading={loadingRequests}
              onRefresh={fetchRequests}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
