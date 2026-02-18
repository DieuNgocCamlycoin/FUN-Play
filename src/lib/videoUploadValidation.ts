/**
 * Video Upload Validation - Shared validation logic for web and mobile upload flows
 * Part of the Video Quality Control System to combat spam uploads
 */

export const MIN_VIDEO_DURATION = 60; // seconds
export const MIN_DESCRIPTION_LENGTH = 50; // characters

// Blocked filename patterns - sample video sites
const BLOCKED_FILENAME_PATTERNS = [
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
  return description.trim().length >= MIN_DESCRIPTION_LENGTH;
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
export function getDescriptionWarning(currentLength: number): string {
  const remaining = MIN_DESCRIPTION_LENGTH - currentLength;
  return `Mô tả cần ít nhất ${MIN_DESCRIPTION_LENGTH} ký tự (còn thiếu ${remaining} ký tự) ✍️`;
}
