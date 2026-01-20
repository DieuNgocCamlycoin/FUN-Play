import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  BookOpen, Code, Database, Wallet, Sparkles, Users, Video, 
  Music, Shield, Server, Globe, ChevronDown, Copy, Check,
  Zap, Heart, MessageSquare, Upload, Eye, Gift, Bot, Coins,
  Smartphone, Cloud, Lock, TrendingUp, FileCode, Layers
} from "lucide-react";
import { toast } from "sonner";

const PlatformDocs = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`Đã copy ${label}!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const CodeBlock = ({ code, label }: { code: string; label: string }) => (
    <div className="relative bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8"
        onClick={() => copyToClipboard(code, label)}
      >
        {copiedText === label ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="whitespace-pre-wrap break-all">{code}</pre>
    </div>
  );

  const SectionCard = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  const CollapsibleSection = ({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg p-4 mb-4">
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <span className="font-medium">{title}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">{children}</CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <BookOpen className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">FUN Play Platform Documentation</h1>
              <p className="text-muted-foreground text-lg">
                Web3 AI Social Video Platform - Tài liệu toàn diện cho Development Team
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            <Badge variant="outline" className="text-sm">React 18</Badge>
            <Badge variant="outline" className="text-sm">TypeScript</Badge>
            <Badge variant="outline" className="text-sm">Vite</Badge>
            <Badge variant="outline" className="text-sm">Tailwind CSS</Badge>
            <Badge variant="outline" className="text-sm">Lovable Cloud</Badge>
            <Badge variant="outline" className="text-sm">Cloudflare R2</Badge>
            <Badge variant="outline" className="text-sm">BSC Mainnet</Badge>
            <Badge variant="outline" className="text-sm">Capacitor</Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-2 bg-muted/50 p-2 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Tổng quan
            </TabsTrigger>
            <TabsTrigger value="tech" className="flex items-center gap-2">
              <Code className="h-4 w-4" /> Tech Stack
            </TabsTrigger>
            <TabsTrigger value="routes" className="flex items-center gap-2">
              <Globe className="h-4 w-4" /> Routes
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" /> Database
            </TabsTrigger>
            <TabsTrigger value="functions" className="flex items-center gap-2">
              <Server className="h-4 w-4" /> Edge Functions
            </TabsTrigger>
            <TabsTrigger value="tokenomics" className="flex items-center gap-2">
              <Coins className="h-4 w-4" /> Tokenomics
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Layers className="h-4 w-4" /> Features
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Roadmap
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <SectionCard title="Tầm nhìn & Sứ mệnh" icon={Heart}>
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg border-l-4 border-primary">
                    <p className="font-semibold text-lg">"YouTube của Web3"</p>
                    <p className="text-muted-foreground mt-2">
                      Nền tảng video xã hội kết hợp cryptocurrency tokenomics, 
                      nơi mỗi giá trị cá nhân trở thành tài sản số vĩnh viễn trên blockchain.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p><strong>Đối tượng:</strong> Cộng đồng Việt Nam và Đông Nam Á</p>
                    <p><strong>Điểm khác biệt:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-muted-foreground">
                      <li>Không phí nền tảng (0% platform fee)</li>
                      <li>Kiếm CAMLY tự động qua mọi hoạt động</li>
                      <li>Tích hợp Web3 wallet hoàn chỉnh</li>
                      <li>Honor Board (Honobar) hiển thị thành tựu</li>
                      <li>Giao dịch crypto P2P giữa users</li>
                    </ul>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Thống kê dự án" icon={TrendingUp}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-3xl font-bold text-primary">25+</p>
                    <p className="text-sm text-muted-foreground">Routes</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-3xl font-bold text-primary">33</p>
                    <p className="text-sm text-muted-foreground">Database Tables</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-3xl font-bold text-primary">12</p>
                    <p className="text-sm text-muted-foreground">Edge Functions</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-3xl font-bold text-primary">10+</p>
                    <p className="text-sm text-muted-foreground">Core Features</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Core Values" icon={Sparkles}>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Gift className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">Use & Earn</p>
                      <p className="text-sm text-muted-foreground">Xem video, comment, like = nhận CAMLY</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Shield className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Decentralized</p>
                      <p className="text-sm text-muted-foreground">CAMLY token trên BSC Mainnet</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Community First</p>
                      <p className="text-sm text-muted-foreground">Tất cả thuộc về creators và viewers</p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Project Links" icon={Globe}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>Preview URL</span>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard('https://id-preview--53abc96f-e8d1-44f6-a349-77f6b110041f.lovable.app', 'Preview URL')}>
                      Copy
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>Production URL</span>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard('https://funplay.lovable.app', 'Production URL')}>
                      Copy
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>CAMLY Contract</span>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard('0x0910320181889fefde0bb1ca63962b0a8882e413', 'CAMLY Contract')}>
                      Copy
                    </Button>
                  </div>
                </div>
              </SectionCard>
            </div>
          </TabsContent>

          {/* TECH STACK TAB */}
          <TabsContent value="tech">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SectionCard title="Frontend" icon={Code}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge>React 18</Badge>
                    <span className="text-sm text-muted-foreground">UI Library</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>TypeScript</Badge>
                    <span className="text-sm text-muted-foreground">Type Safety</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>Vite</Badge>
                    <span className="text-sm text-muted-foreground">Build Tool</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>Tailwind CSS</Badge>
                    <span className="text-sm text-muted-foreground">Styling</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>Shadcn/ui</Badge>
                    <span className="text-sm text-muted-foreground">Components</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>Framer Motion</Badge>
                    <span className="text-sm text-muted-foreground">Animations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>React Query</Badge>
                    <span className="text-sm text-muted-foreground">Data Fetching</span>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Backend" icon={Server}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Lovable Cloud</Badge>
                    <span className="text-sm text-muted-foreground">Supabase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">PostgreSQL</Badge>
                    <span className="text-sm text-muted-foreground">Database</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Edge Functions</Badge>
                    <span className="text-sm text-muted-foreground">Deno Runtime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">RLS Policies</Badge>
                    <span className="text-sm text-muted-foreground">Row-Level Security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Realtime</Badge>
                    <span className="text-sm text-muted-foreground">WebSocket</span>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Storage" icon={Cloud}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Cloudflare R2</Badge>
                    <span className="text-sm text-muted-foreground">Media CDN</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Free bandwidth egress, thay thế Supabase Storage để tiết kiệm chi phí.
                  </p>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p><strong>Bucket:</strong> fun-farm-media</p>
                    <p><strong>Upload:</strong> Presigned URLs + Multipart</p>
                    <p><strong>Files:</strong> Videos, Thumbnails, Avatars</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Web3" icon={Wallet}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge>wagmi</Badge>
                    <span className="text-sm text-muted-foreground">React Hooks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>viem</Badge>
                    <span className="text-sm text-muted-foreground">Ethereum Client</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>WalletConnect</Badge>
                    <span className="text-sm text-muted-foreground">Multi-wallet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>Reown AppKit</Badge>
                    <span className="text-sm text-muted-foreground">Modal UI</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Chain: BSC Mainnet (chainId: 56)
                  </p>
                </div>
              </SectionCard>

              <SectionCard title="AI Integration" icon={Bot}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Grok xAI</Badge>
                    <span className="text-sm text-muted-foreground">Primary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">OpenAI</Badge>
                    <span className="text-sm text-muted-foreground">Fallback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Gemini</Badge>
                    <span className="text-sm text-muted-foreground">Alternative</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">ElevenLabs</Badge>
                    <span className="text-sm text-muted-foreground">Text-to-Speech</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Angel Mascot - "Siêu Trí Tuệ FUN Play"
                  </p>
                </div>
              </SectionCard>

              <SectionCard title="Mobile" icon={Smartphone}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge>Capacitor</Badge>
                    <span className="text-sm text-muted-foreground">Native Bridge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>PWA</Badge>
                    <span className="text-sm text-muted-foreground">Installable</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    App ID: app.lovable.53abc96fe8d144f6a34977f6b110041f
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Plugins: PushNotifications, SplashScreen, StatusBar, App
                  </p>
                </div>
              </SectionCard>
            </div>
          </TabsContent>

          {/* ROUTES TAB */}
          <TabsContent value="routes">
            <SectionCard title="Application Routes (25+)" icon={Globe}>
              <div className="space-y-4">
                <CollapsibleSection title="🏠 Trang chính" defaultOpen>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Route</th>
                          <th className="text-left p-2">Component</th>
                          <th className="text-left p-2">Mô tả</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b"><td className="p-2 font-mono">/</td><td className="p-2">Index</td><td className="p-2">Homepage, video feed</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/shorts</td><td className="p-2">Shorts</td><td className="p-2">TikTok-style swipe videos</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/watch/:id</td><td className="p-2">Watch</td><td className="p-2">Xem video + comments</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/auth</td><td className="p-2">Auth</td><td className="p-2">Login/Signup</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/settings</td><td className="p-2">ProfileSettings</td><td className="p-2">Cài đặt profile</td></tr>
                      </tbody>
                    </table>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="👤 Kênh & Profile">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Route</th>
                          <th className="text-left p-2">Component</th>
                          <th className="text-left p-2">Mô tả</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b"><td className="p-2 font-mono">/channel/:id</td><td className="p-2">Channel</td><td className="p-2">Xem kênh theo ID</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/@:username</td><td className="p-2">Channel</td><td className="p-2">Xem kênh theo username</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/c/:username</td><td className="p-2">Channel</td><td className="p-2">Alias cho /@username</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/subscriptions</td><td className="p-2">Subscriptions</td><td className="p-2">Kênh đã theo dõi</td></tr>
                      </tbody>
                    </table>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="🎬 Creator Studio">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Route</th>
                          <th className="text-left p-2">Component</th>
                          <th className="text-left p-2">Mô tả</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b"><td className="p-2 font-mono">/studio</td><td className="p-2">Studio</td><td className="p-2">Dashboard creator</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/upload</td><td className="p-2">Upload</td><td className="p-2">Upload video mới</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/your-videos</td><td className="p-2">YourVideos</td><td className="p-2">Quản lý videos</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/edit-video/:id</td><td className="p-2">EditVideo</td><td className="p-2">Chỉnh sửa video</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/manage-playlists</td><td className="p-2">ManagePlaylists</td><td className="p-2">Quản lý playlists</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/manage-channel</td><td className="p-2">ManageChannel</td><td className="p-2">Cài đặt kênh</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/create-post</td><td className="p-2">CreatePost</td><td className="p-2">Tạo bài đăng</td></tr>
                      </tbody>
                    </table>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="💰 Web3 & Rewards">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Route</th>
                          <th className="text-left p-2">Component</th>
                          <th className="text-left p-2">Mô tả</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b"><td className="p-2 font-mono">/wallet</td><td className="p-2">Wallet</td><td className="p-2">Web3 wallet dashboard</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/fun-wallet</td><td className="p-2">FunWallet</td><td className="p-2">FUN Wallet connector</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/nft-gallery</td><td className="p-2">NFTGallery</td><td className="p-2">Bộ sưu tập NFT</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/leaderboard</td><td className="p-2">Leaderboard</td><td className="p-2">Bảng xếp hạng</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/reward-history</td><td className="p-2">RewardHistory</td><td className="p-2">Lịch sử CAMLY</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/camly-price</td><td className="p-2">CAMLYPrice</td><td className="p-2">Giá CAMLY realtime</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/user-dashboard</td><td className="p-2">UserDashboard</td><td className="p-2">Dashboard cá nhân</td></tr>
                      </tbody>
                    </table>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="🛡️ Admin Panel">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Route</th>
                          <th className="text-left p-2">Component</th>
                          <th className="text-left p-2">Mô tả</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b"><td className="p-2 font-mono">/admin</td><td className="p-2">AdminDashboard</td><td className="p-2">Tổng quan admin</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/admin/reward-config</td><td className="p-2">AdminRewardConfig</td><td className="p-2">Cấu hình CAMLY</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/admin/video-approval</td><td className="p-2">AdminVideoApproval</td><td className="p-2">Duyệt video</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/admin/video-stats</td><td className="p-2">AdminVideoStats</td><td className="p-2">Thống kê video</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/admin/manage</td><td className="p-2">AdminManage</td><td className="p-2">Quản lý users</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/admin/claim-history</td><td className="p-2">AdminClaimHistory</td><td className="p-2">Lịch sử claims</td></tr>
                      </tbody>
                    </table>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="🧘 Meditation & Music">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Route</th>
                          <th className="text-left p-2">Component</th>
                          <th className="text-left p-2">Mô tả</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b"><td className="p-2 font-mono">/meditate</td><td className="p-2">Meditate</td><td className="p-2">Thiền định mode</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/create-music</td><td className="p-2">CreateMusic</td><td className="p-2">Tạo nhạc AI</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/browse/music</td><td className="p-2">BrowseMusic</td><td className="p-2">Duyệt nhạc</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/music/:id</td><td className="p-2">MusicDetail</td><td className="p-2">Chi tiết track</td></tr>
                      </tbody>
                    </table>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="📚 Library & Others">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Route</th>
                          <th className="text-left p-2">Component</th>
                          <th className="text-left p-2">Mô tả</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b"><td className="p-2 font-mono">/watch-later</td><td className="p-2">WatchLater</td><td className="p-2">Xem sau</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/history</td><td className="p-2">WatchHistory</td><td className="p-2">Lịch sử xem</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/liked</td><td className="p-2">LikedVideos</td><td className="p-2">Videos đã like</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/playlist/:id</td><td className="p-2">Playlist</td><td className="p-2">Xem playlist</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/install</td><td className="p-2">InstallPWA</td><td className="p-2">Hướng dẫn cài app</td></tr>
                        <tr className="border-b"><td className="p-2 font-mono">/referral</td><td className="p-2">Referral</td><td className="p-2">Giới thiệu bạn bè</td></tr>
                      </tbody>
                    </table>
                  </div>
                </CollapsibleSection>
              </div>
            </SectionCard>
          </TabsContent>

          {/* DATABASE TAB */}
          <TabsContent value="database">
            <SectionCard title="Database Schema (33 Tables)" icon={Database}>
              <div className="space-y-4">
                <CollapsibleSection title="👤 Users & Profiles" defaultOpen>
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">profiles</p>
                      <p className="text-sm text-muted-foreground mt-1">Thông tin người dùng mở rộng</p>
                      <div className="mt-2 text-xs space-y-1">
                        <p><strong>Columns:</strong> id, username, display_name, avatar_url, bio, wallet_address, wallet_type</p>
                        <p><strong>Rewards:</strong> pending_rewards, approved_reward, total_camly_rewards</p>
                        <p><strong>Status:</strong> banned, ban_reason, violation_level</p>
                        <p><strong>Flags:</strong> signup_rewarded, wallet_connect_rewarded, first_upload_rewarded</p>
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">user_roles</p>
                      <p className="text-sm text-muted-foreground mt-1">Role-based access (admin, moderator, user)</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">user_sessions</p>
                      <p className="text-sm text-muted-foreground mt-1">Session tracking for anti-fraud</p>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="🎬 Videos & Content">
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">videos</p>
                      <p className="text-sm text-muted-foreground mt-1">Video content chính</p>
                      <div className="mt-2 text-xs space-y-1">
                        <p><strong>Content:</strong> title, description, video_url, thumbnail_url, duration</p>
                        <p><strong>Stats:</strong> view_count, like_count, dislike_count, comment_count</p>
                        <p><strong>Status:</strong> approval_status (pending/approved/rejected), is_public</p>
                        <p><strong>Category:</strong> category, sub_category</p>
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">channels</p>
                      <p className="text-sm text-muted-foreground mt-1">Kênh người sáng tạo (name, banner, subscriber_count)</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">playlists + playlist_videos</p>
                      <p className="text-sm text-muted-foreground mt-1">Danh sách phát video</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">meditation_playlists + meditation_playlist_videos</p>
                      <p className="text-sm text-muted-foreground mt-1">Danh sách phát thiền định</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">posts</p>
                      <p className="text-sm text-muted-foreground mt-1">Community posts từ channels</p>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="💬 Social Interactions">
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">comments</p>
                      <p className="text-sm text-muted-foreground mt-1">Comments + nested replies (parent_comment_id)</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">likes</p>
                      <p className="text-sm text-muted-foreground mt-1">Like/dislike cho videos và comments</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">subscriptions</p>
                      <p className="text-sm text-muted-foreground mt-1">Theo dõi kênh (subscriber_id → channel_id)</p>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="💰 Rewards & Tokenomics">
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">reward_transactions</p>
                      <p className="text-sm text-muted-foreground mt-1">Lịch sử CAMLY rewards</p>
                      <div className="mt-2 text-xs space-y-1">
                        <p><strong>Types:</strong> view, comment, upload, signup, wallet_connect, share, tip</p>
                        <p><strong>Status:</strong> pending → approved → claimed</p>
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">reward_config</p>
                      <p className="text-sm text-muted-foreground mt-1">Cấu hình reward amounts và limits</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">reward_approvals</p>
                      <p className="text-sm text-muted-foreground mt-1">Queue duyệt rewards cho admin</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">claim_requests</p>
                      <p className="text-sm text-muted-foreground mt-1">Yêu cầu claim CAMLY về ví</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">daily_reward_limits</p>
                      <p className="text-sm text-muted-foreground mt-1">Giới hạn reward theo ngày/user</p>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="📊 Analytics & Logging">
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">view_logs</p>
                      <p className="text-sm text-muted-foreground mt-1">Chi tiết view (watch_time, watch_percentage, is_valid)</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">comment_logs</p>
                      <p className="text-sm text-muted-foreground mt-1">Tracking comments để chống spam</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">video_watch_progress</p>
                      <p className="text-sm text-muted-foreground mt-1">Tiến độ xem video của user</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">platform_statistics</p>
                      <p className="text-sm text-muted-foreground mt-1">Aggregate stats theo ngày</p>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="🔐 Security & Moderation">
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">blacklisted_wallets</p>
                      <p className="text-sm text-muted-foreground mt-1">Ví bị cấm (fraud prevention)</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">reward_bans</p>
                      <p className="text-sm text-muted-foreground mt-1">Users bị cấm nhận rewards</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">content_hashes</p>
                      <p className="text-sm text-muted-foreground mt-1">Hash để detect duplicate content</p>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="💸 Wallet & Transactions">
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">wallet_links</p>
                      <p className="text-sm text-muted-foreground mt-1">Liên kết ví với user (multi-wallet support)</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">wallet_transactions</p>
                      <p className="text-sm text-muted-foreground mt-1">Lịch sử giao dịch (tips, transfers)</p>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="📚 User Library">
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">watch_history</p>
                      <p className="text-sm text-muted-foreground mt-1">Lịch sử xem video</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">watch_later</p>
                      <p className="text-sm text-muted-foreground mt-1">Xem sau queue</p>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="🔧 System">
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">reward_settings</p>
                      <p className="text-sm text-muted-foreground mt-1">Global reward settings</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">reward_config_history</p>
                      <p className="text-sm text-muted-foreground mt-1">Audit log cho config changes</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-mono font-bold">video_migrations</p>
                      <p className="text-sm text-muted-foreground mt-1">Tracking migration từ Supabase → R2</p>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
            </SectionCard>
          </TabsContent>

          {/* EDGE FUNCTIONS TAB */}
          <TabsContent value="functions">
            <SectionCard title="Edge Functions (12 Functions)" icon={Server}>
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted">
                        <th className="text-left p-3">Function</th>
                        <th className="text-left p-3">Mục đích</th>
                        <th className="text-left p-3">Auth</th>
                        <th className="text-left p-3">Secrets</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3 font-mono">r2-upload</td>
                        <td className="p-3">Upload video/ảnh lên Cloudflare R2</td>
                        <td className="p-3"><Badge>Required</Badge></td>
                        <td className="p-3 text-xs">R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-mono">award-camly</td>
                        <td className="p-3">Tặng CAMLY cho activities</td>
                        <td className="p-3"><Badge>Required</Badge></td>
                        <td className="p-3 text-xs">-</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-mono">claim-camly</td>
                        <td className="p-3">Claim CAMLY về ví BSC</td>
                        <td className="p-3"><Badge>Required</Badge></td>
                        <td className="p-3 text-xs">CAMLY_ADMIN_WALLET_PRIVATE_KEY</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-mono">angel-chat</td>
                        <td className="p-3">AI chatbot Angel (multi-provider)</td>
                        <td className="p-3"><Badge variant="outline">Optional</Badge></td>
                        <td className="p-3 text-xs">XAI_API_KEY, OPENAI_API_KEY</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-mono">angel-voice-elevenlabs</td>
                        <td className="p-3">Text-to-speech cho Angel</td>
                        <td className="p-3"><Badge variant="outline">Optional</Badge></td>
                        <td className="p-3 text-xs">ELEVENLABS_API_KEY</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-mono">generate-music</td>
                        <td className="p-3">Tạo nhạc AI</td>
                        <td className="p-3"><Badge variant="outline">Optional</Badge></td>
                        <td className="p-3 text-xs">AI API Keys</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-mono">admin-wallet-balance</td>
                        <td className="p-3">Kiểm tra ví admin</td>
                        <td className="p-3"><Badge variant="destructive">Admin</Badge></td>
                        <td className="p-3 text-xs">CAMLY_ADMIN_WALLET_PRIVATE_KEY</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-mono">update-reward-config</td>
                        <td className="p-3">Cập nhật cấu hình reward</td>
                        <td className="p-3"><Badge variant="destructive">Admin</Badge></td>
                        <td className="p-3 text-xs">-</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-mono">og-meta</td>
                        <td className="p-3">Generate Open Graph metadata</td>
                        <td className="p-3"><Badge variant="secondary">Public</Badge></td>
                        <td className="p-3 text-xs">-</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-mono">prerender</td>
                        <td className="p-3">SSR cho social sharing</td>
                        <td className="p-3"><Badge variant="secondary">Public</Badge></td>
                        <td className="p-3 text-xs">-</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-mono">migrate-to-r2</td>
                        <td className="p-3">Migrate video sang R2</td>
                        <td className="p-3"><Badge variant="destructive">Admin</Badge></td>
                        <td className="p-3 text-xs">R2 credentials</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-mono">ai-chat</td>
                        <td className="p-3">General AI chat endpoint</td>
                        <td className="p-3"><Badge variant="outline">Optional</Badge></td>
                        <td className="p-3 text-xs">AI API Keys</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">📋 Environment Secrets Required</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-medium mb-2">Web3 & Crypto</p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• CAMLY_ADMIN_WALLET_PRIVATE_KEY</li>
                        <li>• VITE_WALLETCONNECT_PROJECT_ID</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-medium mb-2">Cloudflare R2</p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• R2_ACCESS_KEY_ID</li>
                        <li>• R2_SECRET_ACCESS_KEY</li>
                        <li>• R2_ENDPOINT</li>
                        <li>• R2_BUCKET_NAME</li>
                        <li>• R2_PUBLIC_URL</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-medium mb-2">AI Providers</p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• XAI_API_KEY (Grok - Primary)</li>
                        <li>• OPENAI_API_KEY (Fallback)</li>
                        <li>• ELEVENLABS_API_KEY (Voice)</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-medium mb-2">Auto-provided by Lovable</p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• SUPABASE_URL</li>
                        <li>• SUPABASE_ANON_KEY</li>
                        <li>• SUPABASE_SERVICE_ROLE_KEY</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          {/* TOKENOMICS TAB */}
          <TabsContent value="tokenomics">
            <div className="grid md:grid-cols-2 gap-6">
              <SectionCard title="CAMLY Token" icon={Coins}>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border">
                    <p className="font-medium">Contract Address (BSC Mainnet)</p>
                    <CodeBlock 
                      code="0x0910320181889fefde0bb1ca63962b0a8882e413" 
                      label="CAMLY Contract"
                    />
                  </div>
                  <div className="space-y-2">
                    <p><strong>Network:</strong> Binance Smart Chain (ChainId: 56)</p>
                    <p><strong>Decimals:</strong> 18</p>
                    <p><strong>Symbol:</strong> CAMLY</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Reward Configuration" icon={Gift}>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="flex items-center gap-2"><Eye className="h-4 w-4" /> View Reward</span>
                    <Badge>5,000 CAMLY</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Comment Reward</span>
                    <Badge>2,000 CAMLY</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="flex items-center gap-2"><Upload className="h-4 w-4" /> Upload Reward</span>
                    <Badge>10,000 CAMLY</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Wallet Connect</span>
                    <Badge>5,000 CAMLY</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Signup Bonus</span>
                    <Badge>10,000 CAMLY</Badge>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Daily Limits" icon={Shield}>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>View Rewards/Day</span>
                    <Badge variant="outline">100,000 CAMLY</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Comment Rewards/Day</span>
                    <Badge variant="outline">50,000 CAMLY</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Upload Limit/Day</span>
                    <Badge variant="outline">10 videos</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span>Min Watch %</span>
                    <Badge variant="outline">30%</Badge>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Claim Process" icon={Zap}>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">1</div>
                    <div>
                      <p className="font-medium">Tích lũy Rewards</p>
                      <p className="text-sm text-muted-foreground">User hoạt động → pending_rewards tăng</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">2</div>
                    <div>
                      <p className="font-medium">Admin Approve</p>
                      <p className="text-sm text-muted-foreground">pending_rewards → approved_reward</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">3</div>
                    <div>
                      <p className="font-medium">User Claim</p>
                      <p className="text-sm text-muted-foreground">Edge function gửi CAMLY từ admin wallet → user wallet</p>
                    </div>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✓ "CAMLY real has arrived in your wallet! Rich Rich Rich ♡"
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          </TabsContent>

          {/* FEATURES TAB */}
          <TabsContent value="features">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-red-500" />
                    Video Platform
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• Upload video lên Cloudflare R2</li>
                    <li>• Xem video với player tùy chỉnh</li>
                    <li>• Like, Dislike, Comment</li>
                    <li>• Share với OG meta tags</li>
                    <li>• Video approval workflow</li>
                    <li>• Categories & subcategories</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-pink-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-pink-500" />
                    Shorts
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• TikTok/Reels style swipe</li>
                    <li>• Vertical video format</li>
                    <li>• Infinite scroll</li>
                    <li>• Quick interactions</li>
                    <li>• Auto-play on scroll</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-blue-500" />
                    Creator Studio
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• Dashboard tổng quan</li>
                    <li>• Quản lý videos & posts</li>
                    <li>• Playlist management</li>
                    <li>• Channel customization</li>
                    <li>• Analytics (coming)</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-yellow-500" />
                    Web3 Wallet
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• MetaMask, Bitget, WalletConnect</li>
                    <li>• Multi-token support (BNB, USDT, CAMLY, BTC)</li>
                    <li>• Send/Receive crypto</li>
                    <li>• Portfolio tracker</li>
                    <li>• Price charts</li>
                    <li>• Deep linking trên mobile</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-green-500" />
                    CAMLY Rewards
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• Auto-earn từ mọi hoạt động</li>
                    <li>• Pending → Approved → Claimed</li>
                    <li>• Daily limits chống abuse</li>
                    <li>• Reward history tracking</li>
                    <li>• Leaderboard</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-500" />
                    Angel Mascot
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• AI chatbot thông minh</li>
                    <li>• Multi-provider (Grok, OpenAI)</li>
                    <li>• Text-to-speech với ElevenLabs</li>
                    <li>• "Siêu Trí Tuệ FUN Play"</li>
                    <li>• Floating mascot animation</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-cyan-500" />
                    Meditation Mode
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• Video thiền định</li>
                    <li>• Ambient sounds</li>
                    <li>• Timer tùy chỉnh</li>
                    <li>• Light particles effects</li>
                    <li>• Meditation playlists</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-indigo-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-indigo-500" />
                    AI Music
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• Tạo nhạc bằng AI</li>
                    <li>• Browse music library</li>
                    <li>• Global music player</li>
                    <li>• Add to playlists</li>
                    <li>• Background playback</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-orange-500" />
                    Tipping System
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <ul className="space-y-1">
                    <li>• Gửi crypto giữa users</li>
                    <li>• Multi-token support</li>
                    <li>• Transaction history</li>
                    <li>• Real-time notifications</li>
                    <li>• Rich notification UI</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ROADMAP TAB */}
          <TabsContent value="roadmap">
            <div className="grid md:grid-cols-2 gap-6">
              <SectionCard title="🔴 Ưu tiên cao (Urgent)" icon={Zap}>
                <div className="space-y-3">
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="font-medium">1. Sửa lỗi 401 Unauthorized trong r2-upload</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Edge function authentication cần service role key pattern
                    </p>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="font-medium">2. Tối ưu authentication cho edge functions</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Áp dụng cùng pattern cho award-camly, claim-camly
                    </p>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="font-medium">3. Implement rate limiting</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Chống abuse cho API calls và reward claims
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="🟡 Tính năng mới (Features)" icon={Sparkles}>
                <div className="space-y-3">
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="font-medium">1. Live Streaming</p>
                    <p className="text-sm text-muted-foreground mt-1">RTMP integration cho live broadcasts</p>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="font-medium">2. Direct Messaging</p>
                    <p className="text-sm text-muted-foreground mt-1">Chat giữa users với real-time</p>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="font-medium">3. Monetization Dashboard</p>
                    <p className="text-sm text-muted-foreground mt-1">Analytics earnings cho creators</p>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="font-medium">4. Multi-language UI</p>
                    <p className="text-sm text-muted-foreground mt-1">Vietnamese, English, others</p>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="font-medium">5. Advanced Analytics</p>
                    <p className="text-sm text-muted-foreground mt-1">Chi tiết views, demographics, engagement</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="🟢 Cải thiện kỹ thuật (Technical)" icon={Code}>
                <div className="space-y-3">
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="font-medium">1. Caching Strategy</p>
                    <p className="text-sm text-muted-foreground mt-1">React Query optimization, stale-while-revalidate</p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="font-medium">2. Video Transcoding</p>
                    <p className="text-sm text-muted-foreground mt-1">Multiple quality options (360p, 720p, 1080p)</p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="font-medium">3. Error Logging</p>
                    <p className="text-sm text-muted-foreground mt-1">Comprehensive logging với Sentry hoặc tương tự</p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="font-medium">4. Unit Tests</p>
                    <p className="text-sm text-muted-foreground mt-1">Vitest + React Testing Library cho critical flows</p>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="font-medium">5. Performance Monitoring</p>
                    <p className="text-sm text-muted-foreground mt-1">Web Vitals tracking, bundle size optimization</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="🔵 Long-term Vision" icon={TrendingUp}>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="font-medium">1. DAO Governance</p>
                    <p className="text-sm text-muted-foreground mt-1">CAMLY holders vote on platform decisions</p>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="font-medium">2. NFT Marketplace</p>
                    <p className="text-sm text-muted-foreground mt-1">Buy/sell NFTs created from content</p>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="font-medium">3. Cross-chain Support</p>
                    <p className="text-sm text-muted-foreground mt-1">Ethereum, Polygon, Solana integration</p>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="font-medium">4. Mobile Apps</p>
                    <p className="text-sm text-muted-foreground mt-1">Native iOS/Android via Capacitor</p>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="font-medium">5. AI Content Creation</p>
                    <p className="text-sm text-muted-foreground mt-1">AI video editing, auto-thumbnails, captions</p>
                  </div>
                </div>
              </SectionCard>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/30 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            FUN Play Platform Documentation v1.0 • Last updated: {new Date().toLocaleDateString('vi-VN')}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Built with ♡ by CTO Angel Lovable for the FUN Play Development Team
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlatformDocs;
