import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

export function useRequireAuth() {
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const requireAuth = useCallback(
    (action: () => void) => {
      if (user) {
        action();
      } else {
        setShowAuthDialog(true);
      }
    },
    [user]
  );

  return { requireAuth, showAuthDialog, setShowAuthDialog, user };
}
