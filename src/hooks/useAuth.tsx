import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let resolved = false;

    const resolve = (s: Session | null) => {
      if (resolved) return;
      resolved = true;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        resolve(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => resolve(session))
      .catch((err) => {
        console.error("[useAuth] getSession failed:", err);
        resolve(null);
      });

    // Safety timeout – never stay on loading screen forever
    const timeout = setTimeout(() => {
      if (!resolved) {
        console.warn("[useAuth] Auth timed out after 5s, rendering as logged out");
        resolve(null);
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return { user, session, loading, signOut };
};
