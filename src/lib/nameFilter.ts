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
 * Validate username format.
 * Rules: 3-30 chars, lowercase letters, numbers, underscores only.
 * Cannot start with "user_" (reserved for system-generated).
 */
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

  const nameCheck = isNameAppropriate(username);
  if (!nameCheck.ok) {
    return nameCheck;
  }

  return { ok: true };
}
