/**
 * Lightweight Vietnamese + English offensive name filter.
 * Normalizes input (removes diacritics, lowercases) and checks against a blocklist.
 */

const OFFENSIVE_WORDS: string[] = [
  // Vietnamese offensive terms
  "dit", "đĩ", "di me", "dit me", "đụ", "du ma", "đụ má", "cặc", "buồi", "lồn",
  "lon", "cave", "điếm", "diem", "chó", "ngu", "đần", "khốn", "khon",
  "mại dâm", "mai dam", "gái gọi", "gai goi", "đĩ điếm", "di diem",
  "chết mẹ", "chet me", "thằng ngu", "thang ngu", "con đĩ", "con di",
  "đồ chó", "do cho", "mặt lồn", "mat lon", "đồ ngu", "do ngu",
  "súc vật", "suc vat", "thú vật", "thu vat",
  // English offensive terms
  "fuck", "shit", "bitch", "asshole", "dick", "pussy", "whore",
  "slut", "bastard", "nigger", "faggot", "cunt", "porn", "prostitut",
  "retard", "idiot", "stupid",
];

/**
 * Remove Vietnamese diacritics for normalized comparison
 */
function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/**
 * Check if a name contains inappropriate content.
 * Returns { ok: true } if the name is appropriate,
 * or { ok: false, reason: string } if it contains offensive content.
 */
export function isNameAppropriate(name: string): { ok: boolean; reason?: string } {
  if (!name || name.trim().length === 0) {
    return { ok: true };
  }

  const normalized = removeDiacritics(name.toLowerCase().trim());

  for (const word of OFFENSIVE_WORDS) {
    const normalizedWord = removeDiacritics(word.toLowerCase());
    if (normalized.includes(normalizedWord)) {
      return {
        ok: false,
        reason: `Tên chứa từ ngữ không phù hợp. Vui lòng chọn tên khác.`,
      };
    }
  }

  return { ok: true };
}

/**
 * Validate display name quality.
 * Blocks: all-numeric, repeated chars (3+), keyboard spam, default-like names.
 */
export function validateDisplayName(name: string): { ok: boolean; reason?: string } {
  if (!name || name.trim().length === 0) {
    return { ok: false, reason: "Tên hiển thị không được để trống" };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { ok: false, reason: "Tên hiển thị phải có ít nhất 2 ký tự" };
  }

  if (trimmed.length > 50) {
    return { ok: false, reason: "Tên hiển thị không được vượt quá 50 ký tự" };
  }

  // Block all-numeric names
  if (/^\d+$/.test(trimmed)) {
    return { ok: false, reason: "Tên hiển thị không được chỉ chứa số" };
  }

  // Block 3+ consecutive identical characters (e.g., "aaaaaa", "xxxxx")
  if (/(.)\1{2,}/i.test(trimmed)) {
    return { ok: false, reason: "Tên hiển thị không được chứa ký tự lặp lại liên tiếp" };
  }

  // Block keyboard spam patterns
  const keyboardSpam = ["qwerty", "asdfgh", "zxcvbn", "qazwsx", "abcdef", "123456"];
  const lower = trimmed.toLowerCase();
  for (const spam of keyboardSpam) {
    if (lower.includes(spam)) {
      return { ok: false, reason: "Tên hiển thị không hợp lệ" };
    }
  }

  // Block default-like names (user + numbers only)
  if (/^user[_\s]?\d*$/i.test(trimmed)) {
    return { ok: false, reason: "Vui lòng đặt tên hiển thị riêng, không sử dụng tên mặc định" };
  }

  // Check offensive content
  const nameCheck = isNameAppropriate(trimmed);
  if (!nameCheck.ok) {
    return nameCheck;
  }

  return { ok: true };
}

/**
 * Validate username format.
 * Rules: 3-30 chars, lowercase letters, numbers, underscores only.
 * Cannot start with "user_" (reserved for system-generated).
 */
const RESERVED_WORDS: string[] = [
  "auth", "watch", "channel", "wallet", "shorts", "profile",
  "library", "settings", "upload", "create-post", "your-videos",
  "manage-posts", "manage-playlists", "manage-channel", "studio",
  "dashboard", "leaderboard", "reward-history", "referral",
  "user-dashboard", "admin", "nft-gallery", "fun-wallet",
  "fun-money", "meditate", "create-music", "music", "browse",
  "install", "watch-later", "history", "subscriptions",
  "camly-price", "liked", "post", "docs", "your-videos-mobile",
  "downloads", "build-bounty", "bounty", "my-ai-music", "ai-music",
  "receipt", "messages", "search", "notifications", "transactions",
  "preview-celebration", "users", "c", "u", "user", "v",
  "edit-video", "edit-post", "playlist", "video",
];

export function validateUsernameFormat(username: string): { ok: boolean; reason?: string } {
  if (!username || username.trim().length === 0) {
    return { ok: false, reason: "Username không được để trống" };
  }

  if (username.length < 3) {
    return { ok: false, reason: "Username phải có ít nhất 3 ký tự" };
  }

  if (username.length > 30) {
    return { ok: false, reason: "Username không được vượt quá 30 ký tự" };
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return { ok: false, reason: "Username chỉ được chứa chữ thường, số và dấu gạch dưới" };
  }

  if (username.startsWith("user_")) {
    return { ok: false, reason: "Username không được bắt đầu bằng 'user_' (dành cho hệ thống)" };
  }

  // Block reserved route names
  if (RESERVED_WORDS.includes(username)) {
    return { ok: false, reason: "Username này đã được hệ thống sử dụng, vui lòng chọn tên khác" };
  }

  // Block all-numeric usernames
  if (/^\d+$/.test(username)) {
    return { ok: false, reason: "Username không được chỉ chứa số" };
  }

  // Block 3+ consecutive identical characters
  if (/(.)\1{2,}/.test(username)) {
    return { ok: false, reason: "Username không được chứa ký tự lặp lại liên tiếp" };
  }

  const nameCheck = isNameAppropriate(username);
  if (!nameCheck.ok) {
    return nameCheck;
  }

  return { ok: true };
}
