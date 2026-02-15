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
  userId?: string | null;
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
  
  // Ví tặng thưởng 1 (Treasury)
  TREASURY: {
    address: "0x9848fFc886Fb7d17C0060ff11c75997C9B2de4cC",
    displayName: "FUN PLAY TREASURY",
    username: "@user_cc9cd3a1",
    channelName: "FUN PLAY TREASURY",
    avatarUrl: "https://pub-348064b6f39043d6be2bfb92d648edb8.r2.dev/cc9cd3a1-8541-4f6f-b10e-f5619e0de832/avatars/1770830879600-play_fun.jpg",
    userId: "cc9cd3a1-8541-4f6f-b10e-f5619e0de832",
  } as SystemWalletInfo,

  // Ví tặng thưởng 2
  PERSONAL: {
    address: "0x7b32E82C64FF4f02dA024B47A8653e1707003339",
    displayName: "Ví tặng thưởng 2",
    username: "@vitangthuong2",
    channelName: "Ví tặng thưởng 2",
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
  if (normalizedAddress === SYSTEM_WALLETS.PERSONAL.address.toLowerCase()) {
    return SYSTEM_WALLETS.PERSONAL;
  }
  
  return null;
}

/**
 * Check if wallet is any system wallet
 * @param address - Wallet address to check
 * @returns true if is a system wallet
 */
// Old system sender ID used in donation_transactions for claim context
export const SYSTEM_TREASURY_SENDER_ID = "f0f0f0f0-0000-0000-0000-000000000001";

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
