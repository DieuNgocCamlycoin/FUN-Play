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

// Debug logging for wallet connection
export const logWalletDebug = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[Web3 ${timestamp}] ${message}`, data || '');
};

const metadata = {
  name: 'FUN PLAY',
  description: 'FUN PLAY - Web3 Video Platform với CAMLY Token trên BSC',
  url: getMetadataUrl(),
  icons: ['/images/camly-coin.png'] // Relative path for better compatibility
};

// BSC Mainnet
export const BSC_CHAIN_ID = 56;

// Admin reward wallet address for reference
export const REWARD_WALLET_ADDRESS = '0x1dc24bfd99c256b12a4a4cc7732c7e3b9aa75998';

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
    logWalletDebug('Initializing Web3Modal', { 
      projectId: projectId ? 'configured ✓' : 'MISSING!',
      origin: window.location.origin,
      userAgent: navigator.userAgent.substring(0, 100)
    });
    
    if (!projectId) {
      console.error('[Web3] CRITICAL: VITE_WALLETCONNECT_PROJECT_ID is not configured!');
      return null;
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
      logWalletDebug('Web3Modal initialized successfully ✓');
    } catch (error) {
      console.error('[Web3] Failed to initialize Web3Modal:', error);
      logWalletDebug('Web3Modal initialization FAILED', error);
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

// Get WalletConnect configuration status
export const getWeb3ConfigStatus = () => {
  return {
    projectId: !!projectId,
    projectIdValue: projectId ? `${projectId.substring(0, 8)}...` : 'NOT SET',
    modalInitialized: !!modal,
    origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
    isMobile: isMobileBrowser(),
    isInWallet: isInWalletBrowser(),
  };
};

// Helper to detect mobile browser
export const isMobileBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

// Helper to detect if running inside a wallet browser (mobile only)
// Desktop with extensions is NOT an in-wallet browser
export const isInWalletBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Only mobile can be a true in-app wallet browser
  // Desktop with MetaMask extension should NOT trigger this
  const isMobile = isMobileBrowser();
  if (!isMobile) return false;
  
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

// Detect which wallet is available in the browser
export const detectAvailableWallet = (): 'metamask' | 'bitget' | 'trust' | null => {
  if (typeof window === 'undefined') return null;
  const win = window as any;
  
  if (win.ethereum?.isMetaMask) return 'metamask';
  if (win.ethereum?.isBitKeep) return 'bitget';
  if (win.ethereum?.isTrust) return 'trust';
  if (navigator.userAgent.includes('MetaMask')) return 'metamask';
  if (navigator.userAgent.includes('BitKeep')) return 'bitget';
  if (navigator.userAgent.includes('Trust')) return 'trust';
  
  return null;
};

// Deep link helpers for mobile wallets - IMPROVED FORMAT
export const getWalletDeepLink = (wallet: 'metamask' | 'bitget' | 'trust'): string => {
  const host = window.location.host;
  const path = window.location.pathname + window.location.search;
  const fullUrl = window.location.href;
  
  logWalletDebug(`Generating deep link for ${wallet}`, { host, path });
  
  switch (wallet) {
    case 'metamask':
      // MetaMask deep link format
      return `https://metamask.app.link/dapp/${host}${path}`;
    case 'bitget':
      // Bitget Wallet deep link format
      return `https://bkcode.vip/dapp/${encodeURIComponent(fullUrl)}`;
    case 'trust':
      // Trust Wallet deep link format - uses BSC coin ID
      return `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodeURIComponent(fullUrl)}`;
    default:
      return '';
  }
};

// Universal link for wallet connection (opens Web3Modal or redirects to wallet app)
export const openWalletConnection = async (preferredWallet?: 'metamask' | 'bitget' | 'trust') => {
  const isMobile = isMobileBrowser();
  const inWallet = isInWalletBrowser();
  
  logWalletDebug('Opening wallet connection', { isMobile, inWallet, preferredWallet });
  
  // If already in wallet browser, use Web3Modal directly
  if (inWallet) {
    logWalletDebug('In wallet browser - using Web3Modal');
    const modal = getWeb3Modal();
    if (modal) {
      await modal.open();
    }
    return;
  }
  
  // On mobile with preferred wallet, use deep link
  if (isMobile && preferredWallet) {
    const deepLink = getWalletDeepLink(preferredWallet);
    logWalletDebug(`Redirecting to ${preferredWallet} via deep link`, { deepLink });
    window.location.href = deepLink;
    return;
  }
  
  // Default: use Web3Modal
  const modal = getWeb3Modal();
  if (modal) {
    await modal.open();
  }
};
