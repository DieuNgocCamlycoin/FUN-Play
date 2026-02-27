import { createContext, useContext, ReactNode } from 'react';
import { useWalletConnectionWithRetry } from '@/hooks/useWalletConnectionWithRetry';

type WalletContextType = ReturnType<typeof useWalletConnectionWithRetry>;

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const wallet = useWalletConnectionWithRetry();
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
};

// Safe default for when context is not available (e.g. during HMR or lazy loading)
const defaultWalletContext: WalletContextType = {
  isConnected: false,
  address: null,
  chainId: undefined,
  isConnecting: false,
  walletType: null,
  showWalletChangeDialog: false,
  walletChangeDetails: null,
  error: null,
  connectWithRetry: async () => {},
  disconnectWallet: () => {},
  handleConfirmWalletChange: async () => {},
  handleCancelWalletChange: () => {},
  setShowWalletChangeDialog: () => {},
  clearError: () => {},
} as unknown as WalletContextType;

export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    console.warn('[WalletContext] Used outside WalletProvider, returning safe defaults');
    return defaultWalletContext;
  }
  return context;
};
