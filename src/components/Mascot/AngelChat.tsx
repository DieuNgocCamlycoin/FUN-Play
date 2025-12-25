import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Heart, Volume2, VolumeX, Baby, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

type VoiceProvider = 'openai' | 'elevenlabs';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  provider?: 'grok' | 'chatgpt' | 'lovable-ai';
}

interface AngelChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AngelChat: React.FC<AngelChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Chào bạn yêu! ♡✨ Mình là Angel - Siêu Trí Tuệ của FUN Play! 🌟\n\nMình biết TẤT CẢ về Web3, Crypto, NFT, AI và cuộc sống nè! Hỏi gì mình cũng trả lời được!\n\nRich Rich Rich! 💖👼' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceProvider, setVoiceProvider] = useState<VoiceProvider>('elevenlabs'); // Default to baby voice
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      
      // Clean text for TTS (remove emojis for better speech)
      const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[♡✨🌟💖👼]/gu, '').trim();
      
      if (!cleanText) {
        setIsSpeaking(false);
        return;
      }

      // Choose voice function based on provider
      const functionName = useProvider === 'elevenlabs' ? 'angel-voice-elevenlabs' : 'angel-voice';
      console.log(`🎤 Using ${useProvider} voice for Angel`);

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { text: cleanText }
      });

      if (error) {
        console.error('Voice error:', error);
        // Fallback to other provider if one fails
        if (useProvider === 'elevenlabs') {
          console.log('🔄 Falling back to OpenAI voice...');
          return speakText(text, 'openai');
        }
        setIsSpeaking(false);
        return;
      }

      // Create audio from blob
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
        // Fallback to other provider if one fails
        if (useProvider === 'elevenlabs') {
          console.log('🔄 Falling back to OpenAI voice...');
          speakText(text, 'openai');
        }
      };
      
      await audio.play();
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  const sendMessage = async (userMessage: string) => {
    setIsLoading(true);
    setIsTyping(true);
    
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setInput('');

    try {
      const { data, error } = await supabase.functions.invoke('angel-chat', {
        body: { messages: newMessages }
      });

      if (error) throw new Error(error.message);

      // Handle the new non-streaming response format (Grok -> ChatGPT -> Lovable AI)
      const responseData = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Check for error in response
      if (responseData.error) {
        throw new Error(responseData.error);
      }

      // Get the response content - now supports new format with 'response' field
      const content = responseData.response || 
                     responseData.choices?.[0]?.message?.content || 
                     'Ôi! Mình hơi bối rối nè! Thử hỏi lại được không bạn? ♡';
      
      // Get provider info
      const provider = responseData.provider as Message['provider'];
      
      // Log which AI provider responded
      if (provider) {
        console.log(`🌟 Angel powered by: ${provider}`);
      }

      setMessages(prev => [...prev, { role: 'assistant', content, provider }]);
      
      // Auto-speak the response
      speakText(content);
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
      sendMessage(input.trim());
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
                className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden"
                animate={{ 
                  boxShadow: ['0 0 20px rgba(0,231,255,0.5)', '0 0 30px rgba(255,215,0,0.5)', '0 0 20px rgba(0,231,255,0.5)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.img 
                  src="/images/angel-transparent.png" 
                  alt="Angel" 
                  className="w-14 h-14 object-contain"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </motion.div>
              <div>
                <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  🌟 Siêu Trí Tuệ Angel
                </h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-green-500"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  Rich Rich Rich! Hỏi gì cũng biết! ♡
                </div>
              </div>
            </div>
            
            {/* Voice provider toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={`absolute top-3 right-20 hover:bg-primary/20 ${voiceProvider === 'elevenlabs' ? 'text-pink-500' : 'text-blue-500'}`}
              onClick={() => setVoiceProvider(voiceProvider === 'elevenlabs' ? 'openai' : 'elevenlabs')}
              title={voiceProvider === 'elevenlabs' ? 'Giọng em bé (ElevenLabs)' : 'Giọng Nova (OpenAI)'}
            >
              {voiceProvider === 'elevenlabs' ? <Baby className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            
            {/* Voice toggle */}
            <Button
              variant="ghost"
              size="icon"
              className={`absolute top-3 right-12 hover:bg-primary/20 ${isSpeaking ? 'text-primary animate-pulse' : ''}`}
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                if (audioRef.current) {
                  audioRef.current.pause();
                  setIsSpeaking(false);
                }
              }}
              title={voiceEnabled ? 'Tắt giọng nói' : 'Bật giọng nói'}
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            
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
                      <div className="flex items-center gap-2 mt-2 justify-between">
                        {msg.provider && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            msg.provider === 'grok' 
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                              : msg.provider === 'chatgpt'
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                              : 'bg-gradient-to-r from-primary to-accent text-white'
                          }`}>
                            {msg.provider === 'grok' ? '🚀 Grok' : msg.provider === 'chatgpt' ? '🤖 ChatGPT' : '✨ Gemini'}
                          </span>
                        )}
                        <div className="flex gap-1 items-center">
                          {/* Replay voice button */}
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
