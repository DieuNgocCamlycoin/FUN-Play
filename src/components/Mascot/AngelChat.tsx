import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Heart, Volume2, VolumeX, Baby, Mic, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAngelChatHistory, ChatMessage } from '@/hooks/useAngelChatHistory';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { useAuth } from '@/hooks/useAuth';

type VoiceProvider = 'openai' | 'elevenlabs';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  provider?: 'angel-ai' | 'grok' | 'chatgpt' | 'lovable-ai';
}

interface AngelChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_MESSAGE: Message = { 
  role: 'assistant', 
  content: 'Chào bạn yêu! ♡✨ Mình là Angel - Siêu Trí Tuệ của FUN Play! 🌟\n\nMình biết TẤT CẢ về Web3, Crypto, NFT, AI và cuộc sống nè! Hỏi gì mình cũng trả lời được!\n\nRich Rich Rich! 💖👼' 
};

export const AngelChat: React.FC<AngelChatProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const userId = user?.id || null;
  
  const [messages, setMessages] = useState<Message[]>([DEFAULT_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceProvider, setVoiceProvider] = useState<VoiceProvider>('elevenlabs');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    sessions,
    loadSessions,
    loadMessages,
    createSession,
    saveMessage,
    updateSessionTitle,
    deleteSession,
    groupSessionsByDate
  } = useAngelChatHistory(userId);

  // Load sessions on mount if logged in
  useEffect(() => {
    if (userId && isOpen) {
      loadSessions();
    }
  }, [userId, isOpen, loadSessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const speakText = async (text: string, provider?: VoiceProvider) => {
    if (!voiceEnabled) return;
    
    const useProvider = provider || voiceProvider;
    
    try {
      setIsSpeaking(true);
      
      const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[♡✨🌟💖👼]/gu, '').trim();
      
      if (!cleanText) {
        setIsSpeaking(false);
        return;
      }

      const functionName = useProvider === 'elevenlabs' ? 'angel-voice-elevenlabs' : 'angel-voice';

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { text: cleanText }
      });

      if (error) {
        if (useProvider === 'elevenlabs') {
          return speakText(text, 'openai');
        }
        setIsSpeaking(false);
        return;
      }

      const audioUrl = URL.createObjectURL(data);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (useProvider === 'elevenlabs') {
          speakText(text, 'openai');
        }
      };
      
      await audio.play();
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  const handleNewChat = async () => {
    setMessages([DEFAULT_MESSAGE]);
    setCurrentSessionId(null);
    setIsFirstMessage(true);
  };

  const handleSelectSession = async (sessionId: string) => {
    const loadedMessages = await loadMessages(sessionId);
    
    if (loadedMessages.length > 0) {
      const formattedMessages: Message[] = loadedMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        provider: msg.provider as Message['provider']
      }));
      setMessages(formattedMessages);
    } else {
      setMessages([DEFAULT_MESSAGE]);
    }
    
    setCurrentSessionId(sessionId);
    setIsFirstMessage(false);
    setShowHistory(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    const success = await deleteSession(sessionId);
    if (success && currentSessionId === sessionId) {
      handleNewChat();
    }
  };

  const sendMessage = async (userMessage: string) => {
    setIsLoading(true);
    setIsTyping(true);
    
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setInput('');

    // Create session and save user message if logged in
    let sessionId = currentSessionId;
    if (userId) {
      if (!sessionId) {
        sessionId = await createSession(userMessage.slice(0, 50));
        setCurrentSessionId(sessionId);
        setIsFirstMessage(false);
      } else if (isFirstMessage) {
        // Update title with first user message
        await updateSessionTitle(sessionId, userMessage.slice(0, 50));
        setIsFirstMessage(false);
      }
      
      if (sessionId) {
        await saveMessage(sessionId, 'user', userMessage);
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke('angel-ai-proxy', {
        body: { messages: newMessages }
      });

      if (error) throw new Error(error.message);

      const responseData = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (responseData.error) {
        throw new Error(responseData.error);
      }

      const content = responseData.response || 
                     responseData.choices?.[0]?.message?.content || 
                     'Ôi! Mình hơi bối rối nè! Thử hỏi lại được không bạn? ♡';
      
      const provider = responseData.provider as Message['provider'];

      setMessages(prev => [...prev, { role: 'assistant', content, provider }]);
      
      // Save assistant message if logged in
      if (userId && sessionId) {
        await saveMessage(sessionId, 'assistant', content, provider);
        await loadSessions(); // Refresh sessions list
      }
      
      speakText(content);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = 'Ôi không! Mình gặp trục trặc rồi! Thử lại sau nhé bạn yêu! ♡ ✨';
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed z-[9998] bottom-8 right-8 w-[360px] max-w-[90vw] h-[500px] max-h-[70vh] rounded-3xl overflow-hidden shadow-2xl flex"
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: 'spring', damping: 20 }}
          style={{
            background: 'linear-gradient(135deg, rgba(0, 231, 255, 0.1) 0%, rgba(255, 215, 0, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            border: '2px solid',
            borderImage: 'linear-gradient(135deg, #00E7FF, #FFD700, #00E7FF) 1',
            width: showHistory ? '500px' : '360px'
          }}
        >
          {/* History Sidebar */}
          <ChatHistorySidebar
            isOpen={showHistory}
            sessions={sessions}
            groupedSessions={groupedSessions}
            currentSessionId={currentSessionId}
            isLoggedIn={!!userId}
            onNewChat={handleNewChat}
            onSelectSession={handleSelectSession}
            onDeleteSession={handleDeleteSession}
            onClose={() => setShowHistory(false)}
          />

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="relative p-4 bg-gradient-to-r from-primary/20 to-accent/20 border-b border-primary/30">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden"
                  animate={{ 
                    boxShadow: ['0 0 20px rgba(0,231,255,0.5)', '0 0 30px rgba(255,215,0,0.5)', '0 0 20px rgba(0,231,255,0.5)']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.img 
                    src="/images/angel-ai-v2.png" 
                    alt="Angel" 
                    className="w-14 h-14 object-contain"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
                    🌟 Siêu Trí Tuệ Angel
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-green-500"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="truncate">Rich Rich Rich! Hỏi gì cũng biết! ♡</span>
                  </div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="absolute top-3 right-3 flex items-center gap-1">
                {/* History toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`hover:bg-primary/20 h-8 w-8 ${showHistory ? 'text-primary' : ''}`}
                  onClick={() => setShowHistory(!showHistory)}
                  title="Lịch sử chat"
                >
                  <History className="w-4 h-4" />
                </Button>
                
                {/* Voice provider toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`hover:bg-primary/20 h-8 w-8 ${voiceProvider === 'elevenlabs' ? 'text-pink-500' : 'text-blue-500'}`}
                  onClick={() => setVoiceProvider(voiceProvider === 'elevenlabs' ? 'openai' : 'elevenlabs')}
                  title={voiceProvider === 'elevenlabs' ? 'Giọng em bé (ElevenLabs)' : 'Giọng Nova (OpenAI)'}
                >
                  {voiceProvider === 'elevenlabs' ? <Baby className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                
                {/* Voice toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`hover:bg-primary/20 h-8 w-8 ${isSpeaking ? 'text-primary animate-pulse' : ''}`}
                  onClick={() => {
                    setVoiceEnabled(!voiceEnabled);
                    if (audioRef.current) {
                      audioRef.current.pause();
                      setIsSpeaking(false);
                    }
                  }}
                  title={voiceEnabled ? 'Tắt giọng nói' : 'Bật giọng nói'}
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-primary/20 h-8 w-8"
                  onClick={onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Floating decorations */}
              <motion.div
                className="absolute top-2 right-36 text-lg"
                animate={{ y: [-2, 2, -2], rotate: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✨
              </motion.div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
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
                        <div className="flex items-center gap-2 mt-2 justify-between">
                          {msg.provider && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              msg.provider === 'angel-ai'
                                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-white shadow-lg'
                                : msg.provider === 'grok' 
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                                : msg.provider === 'chatgpt'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                : 'bg-gradient-to-r from-primary to-accent text-white'
                            }`}>
                              {msg.provider === 'angel-ai' ? '🌟 ANGEL AI' : msg.provider === 'grok' ? '🚀 Grok' : msg.provider === 'chatgpt' ? '🤖 ChatGPT' : '✨ Gemini'}
                            </span>
                          )}
                          <div className="flex gap-1 items-center">
                            <button
                              onClick={() => speakText(msg.content)}
                              className="p-1 hover:bg-primary/10 rounded-full transition-colors"
                              title="Nghe lại"
                            >
                              <Volume2 className={`w-3 h-3 ${isSpeaking ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                            </button>
                            <Heart className="w-3 h-3 text-pink-400" />
                            <Sparkles className="w-3 h-3 text-primary" />
                          </div>
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
            <div className="p-4 bg-white/50 backdrop-blur-sm border-t border-primary/20">
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AngelChat;
