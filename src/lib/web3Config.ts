/**
 * Web3 Configuration using Reown AppKit (2025)
 * Replaces deprecated @web3modal/wagmi for better mobile support
 */
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { bsc, bscTestnet } from '@reown/appkit/networks';

// WalletConnect Cloud Project ID - loaded from environment variable
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

// Get current origin for metadata
const getMetadataUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://play.fun.rich';
};

// Debug logging for wallet connection
export const logWalletDebug = (message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  console.log(`[Web3 ${timestamp}] ${message}`, data || '');
};

// BSC Mainnet Chain ID
export const BSC_CHAIN_ID = 56;

// Admin reward wallet address
export const REWARD_WALLET_ADDRESS = '0x1dc24bfd99c256b12a4a4cc7732c7e3b9aa75998';

// Wallet IDs for featured wallets
const METAMASK_WALLET_ID = 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96';
const BITGET_WALLET_ID = '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662';
const TRUST_WALLET_ID = '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0';

// Networks configuration - use mutable array for AppKit compatibility
const networks = [bsc, bscTestnet] as any;

// Metadata for WalletConnect
const metadata = {
  name: 'FUN PLAY',
  description: 'FUN PLAY - Nền tảng Video Web3 với Token CAMLY trên BSC',
  url: getMetadataUrl(),
  icons: ['/images/camly-coin.png']
};

// Create Wagmi Adapter for Reown AppKit
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

// Export wagmi config for WagmiProvider
export const wagmiConfig = wagmiAdapter.wagmiConfig;

// AppKit instance
let appKit: ReturnType<typeof createAppKit> | null = null;

/**
 * Initialize Reown AppKit
 * This replaces the deprecated createWeb3Modal
 */
export const initWeb3Modal = () => {
  if (!appKit && typeof window !== 'undefined') {
    logWalletDebug('Initializing Reown AppKit', {
      projectId: projectId ? 'configured ✓' : 'MISSING!',
      origin: window.location.origin,
      userAgent: navigator.userAgent.substring(0, 100)
    });

    if (!projectId) {
      console.error('[Web3] CRITICAL: VITE_WALLETCONNECT_PROJECT_ID is not configured!');
      return null;
    }

    try {
      appKit = createAppKit({
        adapters: [wagmiAdapter],
        networks,
        projectId,
        metadata,
        themeMode: 'dark',
        themeVariables: {
          '--w3m-accent': '#facc15',
          '--w3m-border-radius-master': '12px',
          '--w3m-font-family': 'inherit',
        },
        featuredWalletIds: [METAMASK_WALLET_ID, BITGET_WALLET_ID, TRUST_WALLET_ID],
        includeWalletIds: [METAMASK_WALLET_ID, BITGET_WALLET_ID, TRUST_WALLET_ID],
        features: {
          analytics: false,
          email: false,
          socials: [],
        }
      });
      logWalletDebug('Reown AppKit initialized successfully ✓');
    } catch (error) {
      console.error('[Web3] Failed to initialize AppKit:', error);
      logWalletDebug('AppKit initialization FAILED', error);
    }
  }
  return appKit;
};

/**
 * Get AppKit instance (lazy initialization)
 */
export const getWeb3Modal = () => {
  if (!appKit) {
    return initWeb3Modal();
  }
  return appKit;
};

/**
 * Get Web3 configuration status
 */
export const getWeb3ConfigStatus = () => {
  return {
    projectId: !!projectId,
    projectIdValue: projectId ? `${projectId.substring(0, 8)}...` : 'NOT SET',
    modalInitialized: !!appKit,
    origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
    isMobile: isMobileBrowser(),
    isInWallet: isInWalletBrowser(),
  };
};

/**
 * Detect if running on mobile browser
 */
export const isMobileBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

/**
 * Detect if running inside a wallet browser (mobile in-app browser)
 * Desktop with extensions is NOT an in-wallet browser
 */
export const isInWalletBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Only mobile can be a true in-app wallet browser
  const isMobile = isMobileBrowser();
  if (!isMobile) return false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ethereum = (window as any).ethereum;
  
  return !!(
    ethereum?.isMetaMask ||
    ethereum?.isBitKeep ||
    ethereum?.isTrust ||
    navigator.userAgent.includes('MetaMask') ||
    navigator.userAgent.includes('BitKeep') ||
    navigator.userAgent.includes('Trust')
  );
};

/**
 * Detect which wallet is available in the browser
 */
export const detectAvailableWallet = (): 'metamask' | 'bitget' | 'trust' | null => {
  if (typeof window === 'undefined') return null;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ethereum = (window as any).ethereum;

  if (ethereum?.isMetaMask) return 'metamask';
  if (ethereum?.isBitKeep) return 'bitget';
  if (ethereum?.isTrust) return 'trust';
  if (navigator.userAgent.includes('MetaMask')) return 'metamask';
  if (navigator.userAgent.includes('BitKeep')) return 'bitget';
  if (navigator.userAgent.includes('Trust')) return 'trust';

  return null;
};

/**
 * Get deep link for wallet app (backup - AppKit handles this automatically)
 * @deprecated AppKit handles deep links automatically
 */
export const getWalletDeepLink = (wallet: 'metamask' | 'bitget' | 'trust'): string => {
  const host = window.location.host;
  const path = window.location.pathname + window.location.search;
  const fullUrl = window.location.href;

  logWalletDebug(`Generating deep link for ${wallet}`, { host, path });

  switch (wallet) {
    case 'metamask':
      return `https://metamask.app.link/dapp/${host}${path}`;
    case 'bitget':
      return `https://bkcode.vip/dapp/${encodeURIComponent(fullUrl)}`;
    case 'trust':
      return `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodeURIComponent(fullUrl)}`;
    default:
      return '';
  }
};

/**
 * Open wallet connection modal
 * AppKit handles device detection and deep links automatically
 */
export const openWalletConnection = async () => {
  const isMobile = isMobileBrowser();
  const inWallet = isInWalletBrowser();

  logWalletDebug('Opening wallet connection', { isMobile, inWallet });

  const modal = getWeb3Modal();
  if (modal) {
    // AppKit automatically:
    // 1. Detects device type (desktop/iOS/Android)
    // 2. Uses appropriate connection method (injected/deep link/QR)
    // 3. Handles WalletConnect session management
    await modal.open({ view: 'Connect' });
  }
};
