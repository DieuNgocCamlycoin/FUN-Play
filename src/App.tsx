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
import { wagmiConfig } from '@/lib/web3Config';
import { useCursorBeam } from './hooks/useCursorBeam';
import { GlobalPaymentNotifications } from './components/Web3/GlobalPaymentNotifications';
import { Honobar } from './components/Layout/Honobar';

const queryClient = new QueryClient();

function AppContent() {
  useCursorBeam();
  
  return (
    <>
      <Honobar />
      <GlobalPaymentNotifications />
      <div className="pt-24 md:pt-28">
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
        <Route path="/manage-channel" element={<ManageChannel />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/dashboard" element={<Studio />} />
        <Route path="/install" element={<InstallPWA />} />
        {/* Temporary redirect routes for missing pages */}
        <Route path="/shorts" element={<Index />} />
        <Route path="/subscriptions" element={<Index />} />
        <Route path="/library" element={<Index />} />
        <Route path="/history" element={<Index />} />
        <Route path="/watch-later" element={<Index />} />
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
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
