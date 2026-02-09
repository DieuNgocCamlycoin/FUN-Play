/**
 * User display name utilities
 * Sanitizes user names and provides user display info
 */

/**
 * Sanitize display name - removes automated suffixes like "là", "is", "'s Channel"
 */
export function sanitizeDisplayName(name: string | null | undefined): string {
  if (!name) return "User";
  return name
    .replace(/ là$/i, "")
    .replace(/ là /gi, " ")
    .replace(/ is$/i, "")
    .replace(/ is /gi, " ")
    .replace(/'s Channel$/i, "")
    .trim();
}

/**
 * Get sanitized display name from profile data
 * Falls back to username if display_name is not available
 */
export function getDisplayName(
  displayName: string | null | undefined,
  username: string | null | undefined,
  fallback: string = "User"
): string {
  const name = displayName || username || fallback;
  return sanitizeDisplayName(name);
}

// ============ NEW: User Display Info for Transaction History ============

export interface UserDisplayInfo {
  displayName: string;     // Tên kênh (ưu tiên)
  username: string;        // @username (từ tên kênh)
  avatarUrl: string | null;
  walletAddress: string | null;
  channelName: string;     // Tên kênh chính thức
}

export interface ProfileData {
  id?: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  wallet_address?: string | null;
}

export interface ChannelData {
  id?: string;
  user_id?: string;
  name?: string | null;
}

/**
 * Generate @username from channel/display name
 * Normalizes Vietnamese characters and removes special chars
 */
export function generateUsername(name: string): string {
  return "@" + name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // Bỏ dấu (é → e)
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9]/g, "")        // Chỉ giữ chữ + số
    .slice(0, 20);
}

/**
 * Get user display information combining profile and channel data
 * Priority: Channel name > Profile display_name > Profile username > "Ẩn danh"
 */
export function getUserDisplayInfo(
  profile: ProfileData | null | undefined,
  channel: ChannelData | null | undefined
): UserDisplayInfo {
  // Ưu tiên tên kênh từ bảng channels
  const rawDisplayName = channel?.name || profile?.display_name || profile?.username || "Ẩn danh";
  const displayName = sanitizeDisplayName(rawDisplayName);
  
  // Tạo @username từ tên kênh
  const username = generateUsername(displayName);
  
  return {
    displayName,
    username,
    avatarUrl: profile?.avatar_url || null,
    walletAddress: profile?.wallet_address || null,
    channelName: channel?.name ? sanitizeDisplayName(channel.name) : displayName,
  };
}
