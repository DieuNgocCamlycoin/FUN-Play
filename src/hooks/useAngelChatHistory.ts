import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  created_at: string;
}

export const useAngelChatHistory = (userId: string | null) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load all sessions for the user (max 50, ordered by updated_at DESC)
  const loadSessions = useCallback(async () => {
    if (!userId) return [];
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('angel_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const typedData = (data || []) as ChatSession[];
      setSessions(typedData);
      return typedData;
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load all messages for a specific session
  const loadMessages = useCallback(async (sessionId: string): Promise<ChatMessage[]> => {
    if (!userId) return [];
    
    try {
      const { data, error } = await supabase
        .from('angel_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return (data || []) as ChatMessage[];
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  }, [userId]);

  // Create a new session
  const createSession = useCallback(async (title?: string): Promise<string | null> => {
    if (!userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('angel_chat_sessions')
        .insert({
          user_id: userId,
          title: title || 'Cuộc trò chuyện mới'
        })
        .select('id')
        .single();

      if (error) throw error;
      
      // Reload sessions to include the new one
      await loadSessions();
      
      return data?.id || null;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }, [userId, loadSessions]);

  // Save a message to a session
  const saveMessage = useCallback(async (
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    provider?: string
  ): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const { error } = await supabase
        .from('angel_chat_messages')
        .insert({
          session_id: sessionId,
          role,
          content,
          provider
        });

      if (error) throw error;
      
      // Update session's updated_at timestamp
      await supabase
        .from('angel_chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      
      return true;
    } catch (error) {
      console.error('Error saving message:', error);
      return false;
    }
  }, [userId]);

  // Update session title
  const updateSessionTitle = useCallback(async (sessionId: string, title: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const { error } = await supabase
        .from('angel_chat_sessions')
        .update({ title: title.slice(0, 50) })
        .eq('id', sessionId);

      if (error) throw error;
      
      // Update local state
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, title: title.slice(0, 50) } : s
      ));
      
      return true;
    } catch (error) {
      console.error('Error updating session title:', error);
      return false;
    }
  }, [userId]);

  // Delete a session (cascade deletes messages)
  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      const { error } = await supabase
        .from('angel_chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      
      // Remove from local state
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }, [userId]);

  // Group sessions by date for display
  const groupSessionsByDate = useCallback((sessionList: ChatSession[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: { [key: string]: ChatSession[] } = {
      'Hôm nay': [],
      'Hôm qua': [],
      'Tuần này': [],
      'Cũ hơn': []
    };

    sessionList.forEach(session => {
      const sessionDate = new Date(session.updated_at);
      sessionDate.setHours(0, 0, 0, 0);

      if (sessionDate.getTime() === today.getTime()) {
        groups['Hôm nay'].push(session);
      } else if (sessionDate.getTime() === yesterday.getTime()) {
        groups['Hôm qua'].push(session);
      } else if (sessionDate >= lastWeek) {
        groups['Tuần này'].push(session);
      } else {
        groups['Cũ hơn'].push(session);
      }
    });

    return groups;
  }, []);

  return {
    sessions,
    isLoading,
    loadSessions,
    loadMessages,
    createSession,
    saveMessage,
    updateSessionTitle,
    deleteSession,
    groupSessionsByDate
  };
};
