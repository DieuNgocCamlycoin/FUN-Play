import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider } from 'wagmi';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProfileSettings from "./pages/ProfileSettings";
import Upload from "./pages/Upload";
import Watch from "./pages/Watch";
import Channel from "./pages/Channel";
import NotFound from "./pages/NotFound";
import CreatePost from "./pages/CreatePost";
import YourVideos from "./pages/YourVideos";
import EditVideo from "./pages/EditVideo";
import Wallet from "./pages/Wallet";
import ManagePosts from "./pages/ManagePosts";
import EditPost from "./pages/EditPost";
import ManagePlaylists from "./pages/ManagePlaylists";
import ManageChannel from "./pages/ManageChannel";
import Studio from "./pages/Studio";
import InstallPWA from "./pages/InstallPWA";
import Leaderboard from "./pages/Leaderboard";
import RewardHistory from "./pages/RewardHistory";
import Referral from "./pages/Referral";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NFTGallery from "./pages/NFTGallery";
import Meditate from "./pages/Meditate";
import CreateMusic from "./pages/CreateMusic";
import Playlist from "./pages/Playlist";
import WatchLater from "./pages/WatchLater";
import WatchHistory from "./pages/WatchHistory";
import Subscriptions from "./pages/Subscriptions";
import { wagmiConfig } from '@/lib/web3Config';
import { useCursorBeam } from './hooks/useCursorBeam';
import { GlobalPaymentNotifications } from './components/Web3/GlobalPaymentNotifications';
import { AngelMascot } from './components/Mascot/AngelMascot';
import { MusicPlayerProvider } from './contexts/MusicPlayerContext';
import { VideoPlaybackProvider } from './contexts/VideoPlaybackContext';
import { EnhancedMusicPlayer } from './components/Video/EnhancedMusicPlayer';

const queryClient = new QueryClient();

function AppContent() {
  useCursorBeam();
  
  return (
    <>
      <GlobalPaymentNotifications />
      <AngelMascot />
      <div>
        <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/settings" element={<ProfileSettings />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="/channel/:id" element={<Channel />} />
        <Route path="/c/:username" element={<Channel />} />
        <Route path="/@:username" element={<Channel />} />
        <Route path="/create-post" element={<CreatePost />} />
        <Route path="/your-videos" element={<YourVideos />} />
        <Route path="/edit-video/:id" element={<EditVideo />} />
        <Route path="/manage-posts" element={<ManagePosts />} />
        <Route path="/edit-post/:id" element={<EditPost />} />
        <Route path="/manage-playlists" element={<ManagePlaylists />} />
        <Route path="/playlist/:id" element={<Playlist />} />
        <Route path="/manage-channel" element={<ManageChannel />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/dashboard" element={<Studio />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/reward-history" element={<RewardHistory />} />
        <Route path="/referral" element={<Referral />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/nft-gallery" element={<NFTGallery />} />
        <Route path="/meditate" element={<Meditate />} />
        <Route path="/create-music" element={<CreateMusic />} />
        <Route path="/install" element={<InstallPWA />} />
        {/* Watch Later, History, Subscriptions */}
        <Route path="/watch-later" element={<WatchLater />} />
        <Route path="/history" element={<WatchHistory />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        {/* Temporary redirect routes for missing pages */}
        <Route path="/shorts" element={<Index />} />
        <Route path="/library" element={<Index />} />
        <Route path="/liked" element={<Index />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </div>
      <Toaster />
      <Sonner />
    </>
  );
}

const App = () => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MusicPlayerProvider>
          <VideoPlaybackProvider>
            <BrowserRouter>
              <AppContent />
              <EnhancedMusicPlayer />
            </BrowserRouter>
          </VideoPlaybackProvider>
        </MusicPlayerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
