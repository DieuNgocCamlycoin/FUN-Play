import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi';
import { bsc } from '@wagmi/core/chains';

// WalletConnect Cloud Project ID - works globally on all devices
const projectId = '8c5a8b7f9d6e4c3b2a1f0e9d8c7b6a5f';

const metadata = {
  name: 'FUN PLAY',
  description: 'FUN PLAY - Web3 Video Platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://funplay.app',
  icons: ['/images/camly-coin.png']
};

// BSC Mainnet
export const BSC_CHAIN_ID = 56;

// Wagmi config with BSC only
export const wagmiConfig = defaultWagmiConfig({
  chains: [bsc],
  projectId,
  metadata,
});

// MetaMask wallet ID
const METAMASK_WALLET_ID = 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96';
// Bitget Wallet ID
const BITGET_WALLET_ID = '38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662';

// Create Web3Modal - THE official solution that works on iPhone/iPad
let modal: ReturnType<typeof createWeb3Modal> | null = null;

export const initWeb3Modal = () => {
  if (!modal && typeof window !== 'undefined') {
    modal = createWeb3Modal({
      wagmiConfig,
      projectId,
      themeMode: 'dark',
      themeVariables: {
        '--w3m-accent': '#facc15',
        '--w3m-border-radius-master': '12px',
        '--w3m-font-family': 'inherit',
      },
      featuredWalletIds: [METAMASK_WALLET_ID, BITGET_WALLET_ID],
      includeWalletIds: [METAMASK_WALLET_ID, BITGET_WALLET_ID],
      enableAnalytics: false,
    });
  }
  return modal;
};

export const getWeb3Modal = () => {
  if (!modal) {
    return initWeb3Modal();
  }
  return modal;
};
