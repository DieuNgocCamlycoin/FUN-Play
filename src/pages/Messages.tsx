import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/Layout/MainLayout";
import { ChatSidebar } from "@/components/Chat/ChatSidebar";
import { ChatWindow } from "@/components/Chat/ChatWindow";
import { ChatEmptyState } from "@/components/Chat/ChatEmptyState";
import { useChats } from "@/hooks/useChats";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useEffect } from "react";

const Messages = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, loading: authLoading } = useAuth();
  const { chats, loading: chatsLoading } = useChats();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { state: { from: "/messages" } });
    }
  }, [user, authLoading, navigate]);

  const handleSelectChat = (selectedChatId: string) => {
    navigate(`/messages/${selectedChatId}`);
  };

  // Mobile: Show either sidebar or chat window
  if (isMobile) {
    if (chatId) {
      return (
        <MainLayout showBottomNav={false}>
          <div className="h-dvh flex flex-col">
            <ChatWindow chatId={chatId} showBackButton />
          </div>
        </MainLayout>
      );
    }

    return (
      <MainLayout showBottomNav={false}>
        <div className="h-dvh flex flex-col">
          {/* Mobile header */}
          <div className="h-14 border-b flex items-center gap-3 px-4 bg-background/95 backdrop-blur">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-500" />
              <h1 className="text-lg font-semibold">Tin nhắn</h1>
            </div>
          </div>
          
          <ChatSidebar
            chats={chats}
            loading={chatsLoading}
            selectedChatId={chatId}
            onSelectChat={handleSelectChat}
            className="flex-1"
          />
        </div>
      </MainLayout>
    );
  }

  // Desktop: Show 2-column layout
  return (
    <MainLayout showBottomNav={false}>
      <div className="h-[calc(100vh-56px)] flex">
        {/* Sidebar */}
        <ChatSidebar
          chats={chats}
          loading={chatsLoading}
          selectedChatId={chatId}
          onSelectChat={handleSelectChat}
          className="w-80 lg:w-96 flex-shrink-0"
        />

        {/* Chat window or empty state */}
        {chatId ? (
          <ChatWindow chatId={chatId} />
        ) : (
          <ChatEmptyState />
        )}
      </div>
    </MainLayout>
  );
};

export default Messages;
