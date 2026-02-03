/**
 * Utility to extract a frame from a video file as a thumbnail
 */

/**
 * Trích xuất 1 frame từ video file làm thumbnail
 * @param videoFile - File video từ input
 * @param seekPercent - Vị trí lấy frame (0-1), mặc định 0.25 (25%)
 * @returns Promise<Blob | null> - JPEG blob của frame
 */
export async function extractVideoThumbnail(
  videoFile: File, 
  seekPercent: number = 0.25
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    
    const objectUrl = URL.createObjectURL(videoFile);
    video.src = objectUrl;

    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.warn('Video thumbnail extraction timed out');
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    }, 30000); // 30 second timeout

    video.onloadedmetadata = () => {
      // Seek to position (default: 25% of video duration, or 2 seconds minimum)
      const seekTime = Math.max(2, video.duration * seekPercent);
      video.currentTime = Math.min(seekTime, video.duration - 0.5);
    };

    video.onseeked = () => {
      clearTimeout(timeout);
      
      // Create canvas with video dimensions
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
        return;
      }

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to JPEG blob
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          resolve(blob);
        },
        'image/jpeg',
        0.85 // Quality 85%
      );
    };

    video.onerror = () => {
      clearTimeout(timeout);
      console.error('Error loading video for thumbnail extraction');
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
  });
}

/**
 * Trích xuất thumbnail từ video URL đã upload
 * @param videoUrl - URL của video đã upload
 * @param seekPercent - Vị trí lấy frame (0-1), mặc định 0.25 (25%)
 * @returns Promise<Blob | null> - JPEG blob của frame
 */
export async function extractVideoThumbnailFromUrl(
  videoUrl: string,
  seekPercent: number = 0.25
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;

    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.warn('Video thumbnail extraction from URL timed out');
      resolve(null);
    }, 60000); // 60 second timeout for URL-based extraction

    video.onloadedmetadata = () => {
      // Seek to position (default: 25% of video duration, or 2 seconds minimum)
      const seekTime = Math.max(2, video.duration * seekPercent);
      video.currentTime = Math.min(seekTime, video.duration - 0.5);
    };

    video.onseeked = () => {
      clearTimeout(timeout);
      
      // Create canvas with video dimensions
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to JPEG blob
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.85 // Quality 85%
      );
    };

    video.onerror = () => {
      clearTimeout(timeout);
      console.error('Error loading video from URL for thumbnail extraction');
      resolve(null);
    };
  });
}
