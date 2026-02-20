import { createContext, useEffect, useState, useMemo, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isBanned: boolean;
  banReason: string | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkBanStatus = async (userId: string) => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('banned, ban_reason')
          .eq('id', userId)
          .single();

        if (data) {
          setIsBanned(data.banned === true);
          setBanReason(data.ban_reason || null);
        }
      } catch (err) {
        console.error('[AuthProvider] Ban check failed:', err);
      }
    };

    // Single subscription for the entire app
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (event === 'SIGNED_OUT') {
          // Clean up all state on sign out - prevent memory leaks
          setSession(null);
          setUser(null);
          setIsBanned(false);
          setBanReason(null);
          setLoading(false);
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        if (currentSession?.user) {
          // Defer ban check to avoid Supabase auth deadlock
          setTimeout(() => checkBanStatus(currentSession.user.id), 0);
        } else {
          setIsBanned(false);
          setBanReason(null);
        }
      }
    );

    // Check for existing session once
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);

      if (existingSession?.user) {
        checkBanStatus(existingSession.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsBanned(false);
    setBanReason(null);
    navigate("/auth");
  }, [navigate]);

  const value = useMemo(
    () => ({ user, session, loading, signOut, isBanned, banReason }),
    [user, session, loading, signOut, isBanned, banReason]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
