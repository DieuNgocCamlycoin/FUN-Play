import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import { bsc } from '@wagmi/core/chains';

// WalletConnect Cloud Project ID - loaded from environment variable for security
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

// Use current origin for metadata to ensure proper mobile redirects
const getMetadataUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://play.fun.rich';
};

const metadata = {
  name: 'FUN PLAY',
  description: 'FUN PLAY - Web3 Video Platform với CAMLY Token trên BSC',
  url: getMetadataUrl(),
  icons: ['/images/camly-coin.png'] // Relative path for better compatibility
};

// BSC Mainnet
export const BSC_CHAIN_ID = 56;

// Wagmi config with BSC only
export const wagmiConfig = defaultWagmiConfig({
  chains: [bsc],
  projectId,
  metadata,
});

// Wallet IDs
const METAMASK_WALLET_ID = 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96';
const BITGET_WALLET_ID = '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662';
const TRUST_WALLET_ID = '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0';

// Create Web3Modal - THE official solution that works on iPhone/iPad
let modal: ReturnType<typeof createWeb3Modal> | null = null;

export const initWeb3Modal = () => {
  if (!modal && typeof window !== 'undefined') {
    console.log('[Web3] Initializing Web3Modal with projectId:', projectId ? 'configured' : 'MISSING!');
    
    if (!projectId) {
      console.error('[Web3] CRITICAL: VITE_WALLETCONNECT_PROJECT_ID is not configured!');
    }
    
    try {
      modal = createWeb3Modal({
        wagmiConfig,
        projectId,
        themeMode: 'dark',
        themeVariables: {
          '--w3m-accent': '#facc15',
          '--w3m-border-radius-master': '12px',
          '--w3m-font-family': 'inherit',
        },
        featuredWalletIds: [METAMASK_WALLET_ID, BITGET_WALLET_ID, TRUST_WALLET_ID],
        includeWalletIds: [METAMASK_WALLET_ID, BITGET_WALLET_ID, TRUST_WALLET_ID],
        enableAnalytics: false,
        // Enable QR code for mobile devices that don't have wallet installed
        enableOnramp: false,
      });
      console.log('[Web3] Web3Modal initialized successfully');
    } catch (error) {
      console.error('[Web3] Failed to initialize Web3Modal:', error);
    }
  }
  return modal;
};

export const getWeb3Modal = () => {
  if (!modal) {
    return initWeb3Modal();
  }
  return modal;
};

// Helper to detect mobile browser
export const isMobileBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

// Helper to detect if running inside a wallet browser
export const isInWalletBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  return !!(
    win.ethereum?.isMetaMask ||
    win.ethereum?.isBitKeep ||
    win.ethereum?.isTrust ||
    navigator.userAgent.includes('MetaMask') ||
    navigator.userAgent.includes('BitKeep') ||
    navigator.userAgent.includes('Trust')
  );
};

// Deep link helpers for mobile wallets
export const getWalletDeepLink = (wallet: 'metamask' | 'bitget' | 'trust'): string => {
  const currentUrl = window.location.href;
  const host = window.location.host;
  const path = window.location.pathname;
  
  switch (wallet) {
    case 'metamask':
      return `https://metamask.app.link/dapp/${host}${path}`;
    case 'bitget':
      return `https://bkcode.vip/dapp/${encodeURIComponent(currentUrl)}`;
    case 'trust':
      return `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodeURIComponent(currentUrl)}`;
    default:
      return '';
  }
};
