// Default thumbnails for videos without custom thumbnails
// These rotate based on video ID for consistent display

const DEFAULT_THUMBNAILS = [
  '/images/default-thumb-1.png', // Nốt nhạc galaxy
  '/images/default-thumb-2.png', // Ngôi sao nhạc hồng
  '/images/default-thumb-3.png', // Trái tim headphone rainbow
  '/images/default-thumb-4.jpg', // Logo FUN Play
];

/**
 * Get a default thumbnail based on video ID
 * This ensures the same video always gets the same thumbnail
 * @param videoId - The video's unique ID
 * @returns A default thumbnail URL
 */
export const getDefaultThumbnail = (videoId: string): string => {
  if (!videoId) return DEFAULT_THUMBNAILS[0];
  
  // Create a simple hash from the video ID for consistent selection
  const hash = videoId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DEFAULT_THUMBNAILS[hash % DEFAULT_THUMBNAILS.length];
};

export { DEFAULT_THUMBNAILS };
