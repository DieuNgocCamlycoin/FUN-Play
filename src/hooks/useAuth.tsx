import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
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
        console.error('[useAuth] Ban check failed:', err);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          // Defer ban check to avoid Supabase auth deadlock
          setTimeout(() => checkBanStatus(session.user.id), 0);
        } else {
          setIsBanned(false);
          setBanReason(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        checkBanStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsBanned(false);
    setBanReason(null);
    navigate("/auth");
  };

  return { user, session, loading, signOut, isBanned, banReason };
};
