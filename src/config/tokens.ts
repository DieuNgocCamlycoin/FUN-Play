/**
 * Centralized Token Configuration for BSC Mainnet
 * 
 * This file contains the official token contract addresses and configurations
 * used across the entire FUN Play platform. All components should import from
 * this file to ensure consistency.
 * 
 * IMPORTANT: Always verify addresses on BSCScan before making changes.
 */

export interface TokenConfig {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
}

/**
 * Official CAMLY Token Contract Address on BSC Mainnet
 * This address is synchronized with backend claim-camly edge function
 * Verified at: https://bscscan.com/address/0x0910320181889fefde0bb1ca63962b0a8882e413
 */
export const CAMLY_TOKEN_ADDRESS = "0x0910320181889fefde0bb1ca63962b0a8882e413";
export const CAMLY_DECIMALS = 3; // Đúng với contract thực tế (đã verify từ console log)

/**
 * Wrapped BNB (WBNB) for swap operations
 */
export const WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

/**
 * USDT (Tether) on BSC
 */
export const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

/**
 * BTCB (Bitcoin BEP20) on BSC
 */
export const BTC_ADDRESS = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c";

/**
 * PancakeSwap Router V2 Address
 */
export const PANCAKESWAP_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

/**
 * Supported tokens for wallet operations (tipping, transfers, balance display)
 */
export const SUPPORTED_TOKENS: TokenConfig[] = [
  { 
    symbol: "BNB", 
    name: "Binance Coin",
    address: "native", 
    decimals: 18,
    icon: "https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=035"
  },
  { 
    symbol: "USDT", 
    name: "Tether USD",
    address: USDT_ADDRESS, 
    decimals: 18,
    icon: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035"
  },
  { 
    symbol: "CAMLY", 
    name: "Camly Coin",
    address: CAMLY_TOKEN_ADDRESS, 
    decimals: CAMLY_DECIMALS,
    icon: "/images/camly-coin.png"
  },
  { 
    symbol: "BTC", 
    name: "Bitcoin",
    address: BTC_ADDRESS, 
    decimals: 18,
    icon: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=035"
  },
];

/**
 * Tokens available for swap operations (uses WBNB instead of native BNB)
 */
export const SWAP_TOKENS: TokenConfig[] = [
  { 
    symbol: "BNB", 
    name: "Binance Coin",
    address: WBNB_ADDRESS, 
    decimals: 18,
    icon: "https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=035"
  },
  { 
    symbol: "USDT", 
    name: "Tether USD",
    address: USDT_ADDRESS, 
    decimals: 18,
    icon: "https://cryptologos.cc/logos/tether-usdt-logo.svg?v=035"
  },
  { 
    symbol: "CAMLY", 
    name: "Camly Coin",
    address: CAMLY_TOKEN_ADDRESS, 
    decimals: CAMLY_DECIMALS,
    icon: "/images/camly-coin.png"
  },
  { 
    symbol: "BTC", 
    name: "Bitcoin",
    address: BTC_ADDRESS, 
    decimals: 18,
    icon: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=035"
  },
];

/**
 * CoinGecko IDs for price fetching
 */
export const COINGECKO_IDS: { [key: string]: string } = {
  BNB: "binancecoin",
  USDT: "tether",
  BTC: "bitcoin",
};

/**
 * Get token config by symbol
 */
export const getTokenBySymbol = (symbol: string): TokenConfig | undefined => {
  return SUPPORTED_TOKENS.find(t => t.symbol === symbol);
};

/**
 * Get token config by address
 */
export const getTokenByAddress = (address: string): TokenConfig | undefined => {
  return SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === address.toLowerCase());
};
