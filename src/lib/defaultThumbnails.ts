// Default thumbnail images for videos without custom thumbnails
// 10 hình Khóa Thiền Du học Vũ Trụ - FUN PLAY
// Version number - change this when updating thumbnails to bust browser cache
const THUMBNAIL_VERSION = 'v2';

const DEFAULT_THUMBNAILS = [
  `/images/default-thumbnails/default-thumb-1.png?${THUMBNAIL_VERSION}`,
  `/images/default-thumbnails/default-thumb-2.png?${THUMBNAIL_VERSION}`,
  `/images/default-thumbnails/default-thumb-3.png?${THUMBNAIL_VERSION}`,
  `/images/default-thumbnails/default-thumb-4.png?${THUMBNAIL_VERSION}`,
  `/images/default-thumbnails/default-thumb-5.png?${THUMBNAIL_VERSION}`,
  `/images/default-thumbnails/default-thumb-6.png?${THUMBNAIL_VERSION}`,
  `/images/default-thumbnails/default-thumb-7.png?${THUMBNAIL_VERSION}`,
  `/images/default-thumbnails/default-thumb-8.png?${THUMBNAIL_VERSION}`,
  `/images/default-thumbnails/default-thumb-9.png?${THUMBNAIL_VERSION}`,
  `/images/default-thumbnails/default-thumb-10.png?${THUMBNAIL_VERSION}`,
];

/**
 * Get a default thumbnail for videos without custom thumbnails
 * Uses video ID to ensure consistent thumbnail selection per video
 * @param videoId - Optional video ID for consistent selection
 * @returns Path to a default thumbnail image
 */
export function getDefaultThumbnail(videoId?: string): string {
  if (videoId) {
    // Use video ID to select thumbnail - ensures same video always shows same thumbnail
    const hash = videoId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return DEFAULT_THUMBNAILS[hash % DEFAULT_THUMBNAILS.length];
  }
  // Random selection if no ID provided
  return DEFAULT_THUMBNAILS[Math.floor(Math.random() * DEFAULT_THUMBNAILS.length)];
}

export { DEFAULT_THUMBNAILS };
