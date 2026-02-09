import { useState, useEffect } from "react";

/**
 * Detect if the app is running in PWA / standalone mode
 * (Add to Home Screen on iOS/Android)
 */
export const useIsPWA = (): boolean => {
  const [isPWA, setIsPWA] = useState(() => {
    if (typeof window === "undefined") return false;
    // iOS Safari standalone
    if ((navigator as any).standalone === true) return true;
    // Standard display-mode check
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia("(display-mode: standalone)");
    const handler = (e: MediaQueryListEvent) => setIsPWA(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isPWA;
};
