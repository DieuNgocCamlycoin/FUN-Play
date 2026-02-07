/**
 * User display name utilities
 * Sanitizes user names by removing automated suffixes
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
