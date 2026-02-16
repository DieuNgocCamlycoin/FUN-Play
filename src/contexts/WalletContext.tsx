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

export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};
