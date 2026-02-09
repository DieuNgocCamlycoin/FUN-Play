// ============================================================
// SYSTEM WALLETS CONFIG - FUN PLAY
// Cấu hình các ví hệ thống với tên và avatar FUN PLAY
// ============================================================

export interface SystemWalletInfo {
  address: string;
  displayName: string;
  username: string;
  channelName: string;
  avatarUrl: string;
}

// Cấu hình các ví hệ thống FUN PLAY
export const SYSTEM_WALLETS = {
  // Ví tặng thưởng & airdrop
  REWARD: {
    address: "0x8f09073be2B5F4a953939dEBa8c5DFC8098FC0E8",
    displayName: "FUN PLAY TẶNG & THƯỞNG",
    username: "@funplayreward",
    channelName: "FUN PLAY TẶNG & THƯỞNG",
    avatarUrl: "/images/fun-play-wallet-icon.png",
  } as SystemWalletInfo,
  
  // Ví Treasury (claim, distribution)
  TREASURY: {
    address: "0x1DC24BFd99c256B12a4A4cC7732c7e3B9aA75998",
    displayName: "FUN PLAY TREASURY",
    username: "@funplaytreasury",
    channelName: "FUN PLAY TREASURY",
    avatarUrl: "/images/fun-play-wallet-icon.png",
  } as SystemWalletInfo,
} as const;

/**
 * Check if address is a system wallet and return info
 * @param address - Wallet address to check
 * @returns SystemWalletInfo if matched, null otherwise
 */
export function getSystemWalletInfo(address: string | null | undefined): SystemWalletInfo | null {
  if (!address) return null;
  
  const normalizedAddress = address.toLowerCase();
  
  if (normalizedAddress === SYSTEM_WALLETS.REWARD.address.toLowerCase()) {
    return SYSTEM_WALLETS.REWARD;
  }
  if (normalizedAddress === SYSTEM_WALLETS.TREASURY.address.toLowerCase()) {
    return SYSTEM_WALLETS.TREASURY;
  }
  
  return null;
}

/**
 * Check if wallet is any system wallet
 * @param address - Wallet address to check
 * @returns true if is a system wallet
 */
export function isSystemWallet(address: string | null | undefined): boolean {
  return getSystemWalletInfo(address) !== null;
}

/**
 * Get system wallet display info for transaction display
 * Trả về object đúng format với getUserDisplayInfo
 */
export function getSystemWalletDisplayInfo(address: string | null | undefined) {
  const systemWallet = getSystemWalletInfo(address);
  if (!systemWallet) return null;
  
  return {
    displayName: systemWallet.displayName,
    username: systemWallet.username,
    channelName: systemWallet.channelName,
    avatarUrl: systemWallet.avatarUrl,
  };
}
