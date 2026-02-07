/**
 * FUN Money Page
 * Main user interface for PPLP Protocol mint requests
 */

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Coins, 
  Sparkles, 
  Wallet, 
  FileText,
  Plus,
  ExternalLink,
  Info,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMintRequest } from '@/hooks/useFunMoneyMintRequest';
import { useFunMoneyWallet } from '@/hooks/useFunMoneyWallet';
import { MintRequestForm, TokenLifecyclePanel, MintRequestList } from '@/components/FunMoney';
import { cn } from '@/lib/utils';
import { Navigate } from 'react-router-dom';

export default function FunMoney() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showForm, setShowForm] = useState(false);

  const { 
    loading: requestsLoading, 
    getMyRequests 
  } = useMintRequest();

  const {
    isConnected,
    address,
    connect,
    chainId,
    isCorrectChain
  } = useFunMoneyWallet();

  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Fetch user's requests
  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    const data = await getMyRequests();
    setMyRequests(data);
    setLoadingRequests(false);
  }, [getMyRequests]);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, fetchRequests]);

  // Handle form success
  const handleFormSuccess = () => {
    setShowForm(false);
    setActiveTab('history');
    fetchRequests();
    toast.success('Request submitted successfully!');
  };

  // Redirect if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              FUN Money
            </h1>
            <p className="text-muted-foreground mt-1">
              Proof of Pure Love Protocol - Nhận token từ hành động yêu thương
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Wallet Status */}
            <Badge 
              variant={isConnected ? "default" : "outline"}
              className={cn(
                "gap-1.5 py-1.5 px-3",
                isConnected && isCorrectChain && "bg-green-500/20 text-green-500 border-green-500/30",
                isConnected && !isCorrectChain && "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
              )}
            >
              <Wallet className="w-4 h-4" />
              {isConnected ? (
                <>
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                  {!isCorrectChain && " (Wrong Network)"}
                </>
              ) : (
                "Not Connected"
              )}
            </Badge>

            {!isConnected && (
              <Button onClick={connect} size="sm" className="gap-2">
                <Wallet className="w-4 h-4" />
                Connect
              </Button>
            )}

            <Button 
              onClick={() => setShowForm(true)} 
              className="gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              <Plus className="w-4 h-4" />
              New Request
            </Button>
          </div>
        </div>

        {/* Token Lifecycle Panel */}
        <TokenLifecyclePanel requests={myRequests} />

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="overview" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Tổng Quan
            </TabsTrigger>
            <TabsTrigger value="submit" className="gap-2">
              <Plus className="w-4 h-4" />
              Submit
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <FileText className="w-4 h-4" />
              Lịch Sử
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
                    <strong>Proof of Pure Love Protocol</strong> là hệ thống đánh giá 
                    và thưởng token FUN cho các hành động yêu thương đích thực trong 
                    cộng đồng.
                  </p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">5 Trụ Cột Ánh Sáng:</p>
                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
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

              {/* How it works */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Quy Trình
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { step: 1, title: 'Submit Request', desc: 'Mô tả hành động yêu thương của bạn' },
                      { step: 2, title: 'PPLP Scoring', desc: 'Hệ thống tính Light Score & Unity Score' },
                      { step: 3, title: 'Admin Review', desc: 'Admin duyệt và ký EIP-712' },
                      { step: 4, title: 'On-Chain Mint', desc: 'Token FUN được mint vào ví của bạn' }
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

          {/* Submit Tab */}
          <TabsContent value="submit" className="mt-6">
            <MintRequestForm onSuccess={handleFormSuccess} />
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

        {/* Floating Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Submit New Request</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowForm(false)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <MintRequestForm onSuccess={handleFormSuccess} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
