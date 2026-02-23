/**
 * Video Upload Validation - Shared validation logic for web and mobile upload flows
 * Part of the Video Quality Control System to combat spam uploads
 */

import { isNameAppropriate } from "@/lib/nameFilter";

/** PPLP reminder text for title fields */
export const TITLE_PPLP_TEXT = "Một tiêu đề đẹp là khởi đầu của phụng sự và ánh sáng ✨";

const KEYBOARD_SPAM_PATTERNS = [
  "qwerty", "asdfgh", "zxcvbn", "qazwsx", "abcdef",
  "123456", "qwertz", "ytrewq", "asdf", "zxcv",
];

/**
 * Validate video title quality (client-side only).
 * Returns { ok: true } or { ok: false, reason: string } with specific error.
 */
export function validateVideoTitle(title: string): { ok: boolean; reason?: string } {
  const trimmed = title.trim();

  if (trimmed.length === 0) {
    return { ok: true }; // empty = not yet typed, don't show error
  }

  if (trimmed.length < 5) {
    return { ok: false, reason: "Tiêu đề phải có ít nhất 5 ký tự" };
  }

  // Must contain at least one letter (Latin or Vietnamese Unicode)
  if (!/[a-zA-ZÀ-ỹ]/u.test(trimmed)) {
    return { ok: false, reason: "Tiêu đề phải chứa ít nhất một chữ cái" };
  }

  // Block all-numeric titles
  if (/^\d+$/.test(trimmed)) {
    return { ok: false, reason: "Tiêu đề không được chỉ chứa số" };
  }

  // Block 3+ consecutive identical characters
  if (/(.)\1{2,}/i.test(trimmed)) {
    return { ok: false, reason: "Vui lòng không sử dụng ký tự lặp lại liên tiếp" };
  }

  // Block keyboard spam
  const lower = trimmed.toLowerCase();
  for (const spam of KEYBOARD_SPAM_PATTERNS) {
    if (lower.includes(spam)) {
      return { ok: false, reason: "Tiêu đề không hợp lệ" };
    }
  }

  // Check offensive content
  const nameCheck = isNameAppropriate(trimmed);
  if (!nameCheck.ok) {
    return { ok: false, reason: "Tiêu đề chứa từ ngữ không phù hợp. Vui lòng chọn tiêu đề khác." };
  }

  return { ok: true };
}

export const MIN_VIDEO_DURATION = 60; // seconds
export const MIN_DESCRIPTION_LENGTH = 50; // characters
export const MAX_DESCRIPTION_LENGTH = 500; // characters

export const DESCRIPTION_PLACEHOLDER = "Hãy chia sẻ cảm hứng của bạn về video này (tối thiểu 50 ký tự)...";

/**
 * Validate video description quality (client-side only).
 * Returns { ok: true } or { ok: false, reason: string } with specific error.
 */
export function validateVideoDescription(description: string): { ok: boolean; reason?: string } {
  const trimmed = description.trim();

  if (trimmed.length === 0) {
    return { ok: false, reason: "Mô tả cần ít nhất 50 ký tự để chia sẻ giá trị tốt hơn" };
  }

  if (trimmed.length < MIN_DESCRIPTION_LENGTH) {
    const remaining = MIN_DESCRIPTION_LENGTH - trimmed.length;
    return { ok: false, reason: `Mô tả cần ít nhất ${MIN_DESCRIPTION_LENGTH} ký tự để chia sẻ giá trị tốt hơn (còn thiếu ${remaining} ký tự)` };
  }

  // Must contain at least one letter (Latin or Vietnamese Unicode)
  if (!/[a-zA-ZÀ-ỹ]/u.test(trimmed)) {
    return { ok: false, reason: "Mô tả phải chứa ít nhất một chữ cái có nghĩa" };
  }

  // Block 15+ consecutive identical letters (spam), allow punctuation/emoji repeats
  if (/([a-zA-ZÀ-ỹ])\1{14,}/iu.test(trimmed)) {
    return { ok: false, reason: "Vui lòng không sử dụng ký tự lặp lại liên tiếp trong mô tả" };
  }

  return { ok: true };
}

/**
 * Get hashtag hint if description doesn't contain '#'
 */
export function getHashtagHint(description: string): string | null {
  if (description.trim().length > 0 && !description.includes('#')) {
    return "Thêm hashtag để video của bạn dễ tìm hơn! 🔍";
  }
  return null;
}

// Blocked filename patterns - sample video sites
export const BLOCKED_FILENAME_PATTERNS = [
  "mixkit",
  "pexels",
  "pixabay",
  "coverr",
  "videezy",
  "videvo",
  "sample-video",
  "test-video",
  "sample_video",
  "test_video",
  "stock-video",
  "stock_video",
  "snaptik",
  "snaptick",
  "ssstik",
  "tikdown",
  "musicaldown",
];

/**
 * Check if a filename contains blocked patterns from sample video sites
 */
export function isBlockedFilename(filename: string): boolean {
  const lowerName = filename.toLowerCase();
  return BLOCKED_FILENAME_PATTERNS.some((pattern) => lowerName.includes(pattern));
}

/**
 * Get the blocked filename error message
 */
export function getBlockedFilenameError(): string {
  return "Video mẫu từ các trang tải video miễn phí không được chấp nhận 🚫";
}

/**
 * Check if video duration meets minimum requirement
 */
export function isDurationValid(durationSeconds: number): boolean {
  return durationSeconds >= MIN_VIDEO_DURATION;
}

/**
 * Check if description meets minimum length requirement
 */
export function isDescriptionValid(description: string): boolean {
  return validateVideoDescription(description).ok;
}

/**
 * Get duration warning message
 */
export function getDurationWarning(durationSeconds: number): string {
  const remaining = MIN_VIDEO_DURATION - Math.floor(durationSeconds);
  return `Video phải dài ít nhất ${MIN_VIDEO_DURATION} giây (còn thiếu ${remaining} giây) ⏱️`;
}

/**
 * Get description warning message
 */
export function getDescriptionWarning(description: string): string {
  const validation = validateVideoDescription(description);
  return validation.reason || `Mô tả cần ít nhất ${MIN_DESCRIPTION_LENGTH} ký tự ✍️`;
}
