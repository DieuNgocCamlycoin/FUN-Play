import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MessageSquare, ChevronRight, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatSession } from '@/hooks/useAngelChatHistory';

interface ChatHistorySidebarProps {
  isOpen: boolean;
  sessions: ChatSession[];
  groupedSessions: { [key: string]: ChatSession[] };
  currentSessionId: string | null;
  isLoggedIn: boolean;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onClose: () => void;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  isOpen,
  sessions,
  groupedSessions,
  currentSessionId,
  isLoggedIn,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onClose
}) => {
  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm('Xóa cuộc trò chuyện này?')) {
      onDeleteSession(sessionId);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 140, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="h-full border-r border-primary/20 bg-white/50 backdrop-blur-sm flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-2 border-b border-primary/20">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-1 h-8"
            onClick={onNewChat}
            disabled={!isLoggedIn}
          >
            <Plus className="w-3 h-3" />
            Chat mới
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {!isLoggedIn ? (
              <div className="text-center py-4 px-2">
                <LogIn className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  Đăng nhập để lưu lịch sử chat
                </p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-4 px-2">
                <MessageSquare className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  Chưa có lịch sử chat
                </p>
              </div>
            ) : (
              Object.entries(groupedSessions).map(([group, groupSessions]) => {
                if (groupSessions.length === 0) return null;
                
                return (
                  <div key={group} className="mb-3">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1 px-1">
                      {group}
                    </p>
                    <div className="space-y-1">
                      {groupSessions.map(session => (
                        <motion.button
                          key={session.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => onSelectSession(session.id)}
                          className={`w-full text-left p-2 rounded-lg text-xs transition-colors group flex items-center gap-1 ${
                            currentSessionId === session.id
                              ? 'bg-primary/20 text-primary'
                              : 'hover:bg-primary/10'
                          }`}
                        >
                          <ChevronRight className="w-3 h-3 flex-shrink-0" />
                          <span className="flex-1 truncate text-[11px]">
                            {session.title}
                          </span>
                          <button
                            onClick={(e) => handleDelete(e, session.id)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
};
