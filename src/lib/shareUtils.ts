export const PRODUCTION_URL = 'https://official-funplay.lovable.app';

export function getShareUrl(path: string): string {
  return `${PRODUCTION_URL}${path}`;
}

/**
 * Generate a SEO-friendly video share URL
 * Format: /c/username/video/slug
 */
export function getVideoShareUrl(username: string, slug: string): string {
  return `${PRODUCTION_URL}/c/${username}/video/${slug}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (fallbackErr) {
      console.error('All copy methods failed:', fallbackErr);
      return false;
    }
  }
}
