/**
 * Vietnamese-aware slug generator using Unicode NFD normalization.
 * Converts titles to clean, SEO-friendly URL slugs.
 * 
 * Algorithm:
 * 1. Replace đ/Đ explicitly (NFD cannot decompose these)
 * 2. NFD normalize + strip combining marks (diacritics)
 * 3. Lowercase, replace non-alphanumeric with hyphens
 * 4. Truncate to 150 chars at word boundary
 * 5. Fallback for empty results
 */

const MAX_SLUG_LENGTH = 150;

export function slugify(text: string): string {
  if (!text || text.trim().length === 0) {
    return 'untitled-' + Math.random().toString(36).substring(2, 6);
  }

  let result = text
    // Step 1: Handle đ/Đ explicitly (NFD cannot decompose these)
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    // Step 2: NFD normalize + strip combining marks
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Step 3: Lowercase
    .toLowerCase()
    // Step 4: Replace non-alphanumeric with hyphens
    .replace(/[^a-z0-9]+/g, '-')
    // Step 5: Trim leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  // Step 6: Truncate at word boundary
  if (result.length > MAX_SLUG_LENGTH) {
    result = result.substring(0, MAX_SLUG_LENGTH);
    const lastHyphen = result.lastIndexOf('-');
    if (lastHyphen > 0) {
      result = result.substring(0, lastHyphen);
    }
  }

  // Step 7: Fallback for empty result
  if (!result) {
    return 'untitled-' + Math.random().toString(36).substring(2, 6);
  }

  return result;
}

/**
 * Generate a video share URL using username + slug format
 */
export function getVideoShareUrl(username: string, slug: string): string {
  return `/${username}/${slug}`;
}
