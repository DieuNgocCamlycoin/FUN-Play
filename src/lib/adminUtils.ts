/**
 * Admin utility functions
 */

/**
 * Get profile URL for a user, using username (preferred) or userId as fallback.
 * Returns null if neither is available.
 */
export function getProfileUrl(username?: string | null, userId?: string): string | null {
  const identifier = username || userId;
  if (!identifier) return null;
  return `/${identifier}`;
}
