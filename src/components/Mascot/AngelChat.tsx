import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AngelChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AngelChat: React.FC<AngelChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Xin chào bạn yêu! ♡ Mình là Angel - thiên thần nhỏ của FUN Play! Mình có thể giúp gì cho bạn nè? Hỏi mình bất cứ điều gì nhé! ✨🌟' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    setIsLoading(true);
    setIsTyping(true);
    
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setInput('');

    try {
      const response = await supabase.functions.invoke('angel-chat', {
        body: { messages: newMessages }
      });

      if (response.error) throw new Error(response.error.message);

      // Handle streaming response
      const reader = response.data.getReader?.();
      if (reader) {
        let assistantMessage = '';
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  assistantMessage += content;
                  setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'assistant', content: assistantMessage };
                    return updated;
                  });
                }
              } catch {}
            }
          }
        }
      } else {
        // Non-streaming fallback
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        const content = data.choices?.[0]?.message?.content || data.content || 'Ôi! Mình hơi bối rối nè! Thử hỏi lại được không bạn? ♡';
        setMessages(prev => [...prev, { role: 'assistant', content }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Ôi không! Mình gặp trục trặc rồi! Thử lại sau nhé bạn yêu! ♡ ✨' 
      }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      streamChat(input.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed z-[9998] bottom-8 right-8 w-[360px] max-w-[90vw] h-[500px] max-h-[70vh] rounded-3xl overflow-hidden shadow-2xl"
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 20 }}
          style={{
            background: 'linear-gradient(135deg, rgba(0, 231, 255, 0.1) 0%, rgba(255, 215, 0, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            border: '2px solid',
            borderImage: 'linear-gradient(135deg, #00E7FF, #FFD700, #00E7FF) 1',
          }}
        >
          {/* Header */}
          <div className="relative p-4 bg-gradient-to-r from-primary/20 to-accent/20 border-b border-primary/30">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
                animate={{ 
                  boxShadow: ['0 0 20px rgba(0,231,255,0.5)', '0 0 30px rgba(255,215,0,0.5)', '0 0 20px rgba(0,231,255,0.5)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-2xl">👼</span>
              </motion.div>
              <div>
                <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Angel của FUN Play
                </h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-green-500"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  Luôn sẵn sàng giúp bạn!
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 hover:bg-primary/20"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Floating decorations */}
            <motion.div
              className="absolute top-2 right-14 text-lg"
              animate={{ y: [-2, 2, -2], rotate: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✨
            </motion.div>
          </div>

          {/* Messages */}
          <ScrollArea className="h-[340px] p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-primary to-accent text-white rounded-br-sm'
                        : 'bg-white/80 backdrop-blur-sm border border-primary/20 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === 'assistant' && (
                      <div className="flex gap-1 mt-1 justify-end">
                        <Heart className="w-3 h-3 text-pink-400" />
                        <Sparkles className="w-3 h-3 text-primary" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/80 backdrop-blur-sm border border-primary/20 rounded-2xl rounded-bl-sm p-3 shadow-sm">
                    <div className="flex gap-1">
                      <motion.span
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                      <motion.span
                        className="w-2 h-2 rounded-full bg-accent"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
                      />
                      <motion.span
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/50 backdrop-blur-sm border-t border-primary/20">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhắn với Angel... ♡"
                className="flex-1 rounded-full border-primary/30 focus:border-primary bg-white/80"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 w-12 h-12 p-0"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AngelChat;
