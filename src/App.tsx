import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/wallet" element={<Wallet />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
