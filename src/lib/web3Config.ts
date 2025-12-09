import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import { bsc } from '@wagmi/core/chains';

// WalletConnect Project ID - Get yours at https://cloud.walletconnect.com
const projectId = '8c5a8b7f9d6e4c3b2a1f0e9d8c7b6a5f';

const metadata = {
  name: 'FUN PLAY',
  description: 'FUN PLAY - Web3 Video Platform for Billions of Souls',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://funplay.app',
  icons: ['/images/camly-coin.png']
};

// BSC Mainnet configuration
export const BSC_CHAIN_ID = 56;
export const BSC_CONFIG = {
  chainId: `0x${BSC_CHAIN_ID.toString(16)}`,
  chainName: 'BNB Smart Chain',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: ['https://bsc-dataseed1.binance.org'],
  blockExplorerUrls: ['https://bscscan.com'],
};

// Wagmi config with BSC
export const wagmiConfig = defaultWagmiConfig({
  chains: [bsc],
  projectId,
  metadata,
});

// MetaMask wallet ID for Web3Modal
export const METAMASK_WALLET_ID = 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96';
// Bitget Wallet ID for Web3Modal  
export const BITGET_WALLET_ID = '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662';

// Create Web3Modal instance
let modal: ReturnType<typeof createWeb3Modal> | null = null;

export const getWeb3Modal = () => {
  if (!modal && typeof window !== 'undefined') {
    modal = createWeb3Modal({
      wagmiConfig,
      projectId,
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#FFD700',
        '--w3m-border-radius-master': '12px',
        '--w3m-font-family': 'inherit',
      },
      featuredWalletIds: [
        METAMASK_WALLET_ID,
        BITGET_WALLET_ID,
      ],
      includeWalletIds: [
        METAMASK_WALLET_ID,
        BITGET_WALLET_ID,
      ],
      enableAnalytics: false,
      allowUnsupportedChain: false,
    });
  }
  return modal;
};

// Detect if running in mobile browser
export const isMobileBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
};

// Detect if running inside wallet's in-app browser
export const isInWalletBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ethereum = (window as any).ethereum;
  return !!(ethereum?.isMetaMask || ethereum?.isBitget || ethereum?.isBitKeep);
};

// Check if MetaMask is available
export const isMetaMaskAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).ethereum?.isMetaMask;
};

// Check if Bitget Wallet is available
export const isBitgetAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ethereum = (window as any).ethereum;
  return !!(ethereum?.isBitget || ethereum?.isBitKeep);
};

// Deep link URLs for mobile wallets
export const WALLET_DEEP_LINKS = {
  metamask: {
    ios: 'metamask://',
    android: 'metamask://',
    universal: 'https://metamask.app.link',
    appStore: 'https://apps.apple.com/app/metamask/id1438144202',
    playStore: 'https://play.google.com/store/apps/details?id=io.metamask',
  },
  bitget: {
    ios: 'bitkeep://',
    android: 'bitkeep://',
    universal: 'https://bkcode.vip',
    appStore: 'https://apps.apple.com/app/bitget-wallet/id1395301115',
    playStore: 'https://play.google.com/store/apps/details?id=com.bitkeep.wallet',
  },
};

// Get the deep link URL for connecting via mobile wallet
export const getMobileWalletDeepLink = (walletType: 'metamask' | 'bitget'): string => {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(currentUrl);
  
  if (walletType === 'metamask') {
    return `https://metamask.app.link/dapp/${currentUrl.replace('https://', '').replace('http://', '')}`;
  } else {
    return `https://bkcode.vip/dapp?url=${encodedUrl}`;
  }
};

// Check if running on iOS
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Check if running on Android
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
};

// Get app store link based on platform
export const getAppStoreLink = (walletType: 'metamask' | 'bitget'): string => {
  const links = WALLET_DEEP_LINKS[walletType];
  if (isIOS()) return links.appStore;
  if (isAndroid()) return links.playStore;
  return links.appStore; // Default to iOS
};
