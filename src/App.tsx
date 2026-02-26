import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";

// Legacy redirect components
const LegacyUserRedirect = () => {
  const { userId } = useParams();
  return <Navigate to={`/${userId || ''}`} replace />;
};
const LegacyChannelRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/${id || ''}`} replace />;
};
const LegacyUsernameRedirect = () => {
  const { username } = useParams();
  return <Navigate to={`/${username}`} replace />;
};
const LegacyCRedirect = () => {
  const { username } = useParams();
  return <Navigate to={`/${username}`} replace />;
};
const LegacyCVideoRedirect = () => {
  const { username, slug } = useParams();
  return <Navigate to={`/${username}/${slug}`} replace />;
};

// Legacy /watch/:id redirect - fetches video data and redirects to clean URL
const WatchLegacyRedirect = lazy(() => import("./pages/WatchLegacyRedirect"));
import { WagmiProvider } from 'wagmi';
import { VersionCheck } from './components/VersionCheck';
import Index from "./pages/Index";
import Auth from "./pages/Auth";

import Channel from "./pages/Channel";
import NotFound from "./pages/NotFound";
import Wallet from "./pages/Wallet";
import Shorts from "./pages/Shorts";
import Profile from "./pages/Profile";

import { wagmiConfig, initWeb3Modal } from '@/lib/web3Config';
import { GlobalPaymentNotifications } from './components/Web3/GlobalPaymentNotifications';
import { MusicPlayerProvider } from './contexts/MusicPlayerContext';
import { MusicProvider } from './contexts/MusicContext';
import { VideoPlaybackProvider } from './contexts/VideoPlaybackContext';
import { MiniPlayerProvider } from './contexts/MiniPlayerContext';
import { UploadProvider } from './contexts/UploadContext';
import { WalletProvider } from './contexts/WalletContext';
import { AuthProvider } from './contexts/AuthContext';
import { EnhancedMusicPlayer } from './components/Video/EnhancedMusicPlayer';
import { GlobalVideoPlayer } from './components/Video/GlobalVideoPlayer';
import { GlobalMiniPlayer } from './components/Video/GlobalMiniPlayer';
import { BackgroundUploadIndicator } from './components/Upload/BackgroundUploadIndicator';
import { useRewardRealtimeNotification } from './hooks/useRewardRealtimeNotification';
import { useMusicCompletionNotification } from './hooks/useMusicCompletionNotification';
import { RecoveryModeGuard } from './components/Auth/RecoveryModeGuard';
import { BannedScreen } from './components/BannedScreen';
import { useAuth } from './hooks/useAuth';
import { Skeleton } from "./components/ui/skeleton";
// import { ValentineMusicButton } from './components/ValentineMusicButton';
import { ProfileOnboardingModal } from './components/Onboarding/ProfileOnboardingModal';

// Lazy loaded pages - Less frequently used
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));

const CreatePost = lazy(() => import("./pages/CreatePost"));
const YourVideos = lazy(() => import("./pages/YourVideos"));
const EditVideo = lazy(() => import("./pages/EditVideo"));
const LikedVideos = lazy(() => import("./pages/LikedVideos"));
const ManagePosts = lazy(() => import("./pages/ManagePosts"));
const EditPost = lazy(() => import("./pages/EditPost"));
const ManagePlaylists = lazy(() => import("./pages/ManagePlaylists"));
const ManageChannel = lazy(() => import("./pages/ManageChannel"));
const Studio = lazy(() => import("./pages/Studio"));
const InstallPWA = lazy(() => import("./pages/InstallPWA"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const RewardHistory = lazy(() => import("./pages/RewardHistory"));
const Referral = lazy(() => import("./pages/Referral"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const UnifiedAdminDashboard = lazy(() => import("./pages/UnifiedAdminDashboard"));
const NFTGallery = lazy(() => import("./pages/NFTGallery"));
const FunWallet = lazy(() => import("./pages/FunWallet"));
const Meditate = lazy(() => import("./pages/Meditate"));
const CreateMusic = lazy(() => import("./pages/CreateMusic"));
const Playlist = lazy(() => import("./pages/Playlist"));
const WatchLater = lazy(() => import("./pages/WatchLater"));
const WatchHistory = lazy(() => import("./pages/WatchHistory"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const CAMLYPrice = lazy(() => import("./pages/CAMLYPrice"));
const MusicDetail = lazy(() => import("./pages/MusicDetail"));
const BrowseMusic = lazy(() => import("./pages/BrowseMusic"));
const PlatformDocs = lazy(() => import("./pages/PlatformDocs"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const PostBySlug = lazy(() => import("./pages/PostBySlug"));
const PostLegacyRedirect = lazy(() => import("./pages/PostLegacyRedirect"));
const VideoRedirect = lazy(() => import("./pages/VideoRedirect"));
const VideoBySlug = lazy(() => import("./pages/VideoBySlug"));
const YourVideosMobile = lazy(() => import("./pages/YourVideosMobile"));
const DownloadedVideos = lazy(() => import("./pages/DownloadedVideos"));
const Bounty = lazy(() => import("./pages/Bounty"));
const MyAIMusic = lazy(() => import("./pages/MyAIMusic"));
const Receipt = lazy(() => import("./pages/Receipt"));
const AIMusicDetail = lazy(() => import("./pages/AIMusicDetail"));
const Messages = lazy(() => import("./pages/Messages"));
const FunMoneyPage = lazy(() => import("./pages/FunMoneyPage"));
const Search = lazy(() => import("./pages/Search"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Library = lazy(() => import("./pages/Library"));
const Transactions = lazy(() => import("./pages/Transactions"));
const PreviewCelebration = lazy(() => import("./pages/PreviewCelebration"));
const UsersDirectory = lazy(() => import("./pages/UsersDirectory"));
const UIPreview = lazy(() => import("./pages/UIPreview"));
const SuspendedUsers = lazy(() => import("./pages/SuspendedUsers"));
const MyReports = lazy(() => import("./pages/MyReports"));
const GenerateOG = lazy(() => import("./pages/GenerateOG"));
const Whitepaper = lazy(() => import("./pages/Whitepaper"));
const Constitution = lazy(() => import("./pages/Constitution"));

const queryClient = new QueryClient();

// Initialize Web3Modal at app start - CRITICAL for modal to work
initWeb3Modal();

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="space-y-4 w-full max-w-md p-8">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

function AppContent() {
  const { isBanned, banReason, signOut } = useAuth();
  useRewardRealtimeNotification();
  useMusicCompletionNotification();

  // Global handler for unhandled promise rejections (e.g. MetaMask inpage.js errors)
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = reason?.message || String(reason) || '';
      // Suppress known MetaMask/wallet connection rejections to prevent blank screen
      if (
        msg.includes('MetaMask') ||
        msg.includes('user rejected') ||
        msg.includes('User denied') ||
        msg.includes('wallet_') ||
        msg.includes('eth_requestAccounts')
      ) {
        console.warn('[Global] Suppressed wallet rejection:', msg);
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  if (isBanned) {
    return <BannedScreen banReason={banReason} onSignOut={signOut} />;
  }

  return (
    <>
      <RecoveryModeGuard>
        <VersionCheck />
        <GlobalPaymentNotifications />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Core pages - not lazy loaded for instant access */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/watch/:id" element={<WatchLegacyRedirect />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/shorts" element={<Shorts />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/library" element={<Library />} />
            
            {/* Lazy loaded pages */}
            <Route path="/settings" element={<ProfileSettings />} />
            <Route path="/upload" element={<Navigate to="/" replace />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/your-videos" element={<YourVideos />} />
            <Route path="/edit-video/:id" element={<EditVideo />} />
            <Route path="/manage-posts" element={<ManagePosts />} />
            <Route path="/edit-post/:id" element={<EditPost />} />
            <Route path="/manage-playlists" element={<ManagePlaylists />} />
            <Route path="/playlist/:id" element={<Playlist />} />
            <Route path="/manage-channel" element={<ManageChannel />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/dashboard" element={<Studio />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/reward-history" element={<RewardHistory />} />
            <Route path="/referral" element={<Referral />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/admin" element={<UnifiedAdminDashboard />} />
            <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/video-stats" element={<Navigate to="/admin?section=videos" replace />} />
            <Route path="/admin/reward-config" element={<Navigate to="/admin?section=config" replace />} />
            <Route path="/admin/manage" element={<Navigate to="/admin?section=users" replace />} />
            <Route path="/admin-manage" element={<Navigate to="/admin?section=users" replace />} />
            <Route path="/admin/video-approval" element={<Navigate to="/admin?section=videos" replace />} />
            <Route path="/admin/claim-history" element={<Navigate to="/admin?section=rewards" replace />} />
            <Route path="/admin/claim" element={<Navigate to="/admin?section=rewards" replace />} />
            <Route path="/nft-gallery" element={<NFTGallery />} />
            <Route path="/fun-wallet" element={<FunWallet />} />
            <Route path="/fun-money" element={<FunMoneyPage />} />
            <Route path="/meditate" element={<Meditate />} />
            <Route path="/create-music" element={<CreateMusic />} />
            <Route path="/music/:id" element={<MusicDetail />} />
            <Route path="/browse/music" element={<BrowseMusic />} />
            <Route path="/install" element={<InstallPWA />} />
            <Route path="/watch-later" element={<WatchLater />} />
            <Route path="/history" element={<WatchHistory />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/camly-price" element={<CAMLYPrice />} />
            <Route path="/v/:id" element={<VideoRedirect />} />
            <Route path="/liked" element={<LikedVideos />} />
            <Route path="/post/:id" element={<PostLegacyRedirect />} />
            <Route path="/docs/platform" element={<PlatformDocs />} />
            <Route path="/your-videos-mobile" element={<YourVideosMobile />} />
            <Route path="/downloads" element={<DownloadedVideos />} />
            <Route path="/build-bounty" element={<Bounty />} />
            <Route path="/bounty" element={<Navigate to="/build-bounty" replace />} />
            <Route path="/my-ai-music" element={<MyAIMusic />} />
            <Route path="/ai-music/:id" element={<AIMusicDetail />} />
            <Route path="/receipt/:receiptPublicId" element={<Receipt />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:chatId" element={<Messages />} />
            <Route path="/search" element={<Search />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/preview-celebration" element={<PreviewCelebration />} />
            <Route path="/users" element={<UsersDirectory />} />
            <Route path="/ui-preview" element={<UIPreview />} />
            <Route path="/suspended" element={<SuspendedUsers />} />
            <Route path="/my-reports" element={<MyReports />} />
            <Route path="/generate-og" element={<GenerateOG />} />
            <Route path="/whitepaper" element={<Whitepaper />} />
            <Route path="/constitution" element={<Constitution />} />
            {/* Legacy redirects */}
            <Route path="/user/:userId" element={<LegacyUserRedirect />} />
            <Route path="/u/:username" element={<LegacyUsernameRedirect />} />
            <Route path="/channel/:id" element={<LegacyChannelRedirect />} />
            <Route path="/c/:username/video/:slug" element={<LegacyCVideoRedirect />} />
            <Route path="/c/:username" element={<LegacyCRedirect />} />
            <Route path="/@:username" element={<LegacyUsernameRedirect />} />
            {/* Dynamic profile & video & post routes - MUST be last before catch-all */}
            <Route path="/:username/post/:slug" element={<PostBySlug />} />
            <Route path="/:username/video/:slug" element={<VideoBySlug />} />
            <Route path="/:username/:slug" element={<VideoBySlug />} />
            <Route path="/:username" element={<Channel />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </RecoveryModeGuard>
      <ProfileOnboardingModal />
      <GlobalMiniPlayer />
      {/* <ValentineMusicButton /> */}
      <BackgroundUploadIndicator />
      <Toaster />
      <Sonner />
    </>
  );
}

const App = () => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MusicProvider>
          <MusicPlayerProvider>
            <VideoPlaybackProvider>
              <MiniPlayerProvider>
                <UploadProvider>
                  <BrowserRouter>
                    <AuthProvider>
                      <WalletProvider>
                        <AppContent />
                        <EnhancedMusicPlayer />
                        <GlobalVideoPlayer />
                      </WalletProvider>
                    </AuthProvider>
                  </BrowserRouter>
                </UploadProvider>
              </MiniPlayerProvider>
            </VideoPlaybackProvider>
          </MusicPlayerProvider>
        </MusicProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
