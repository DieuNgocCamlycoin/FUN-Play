/**
 * Client-side image resize utility using HTML Canvas.
 * Resizes images to specified dimensions and compresses as JPEG.
 */
export function resizeImage(
  file: File,
  maxWidth = 200,
  maxHeight = 200,
  quality = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate dimensions maintaining aspect ratio with center crop
      let sw = img.width;
      let sh = img.height;
      let sx = 0;
      let sy = 0;

      // Center-crop to square
      if (sw > sh) {
        sx = (sw - sh) / 2;
        sw = sh;
      } else {
        sy = (sh - sw) / 2;
        sh = sw;
      }

      const canvas = document.createElement("canvas");
      canvas.width = maxWidth;
      canvas.height = maxHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, maxWidth, maxHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }
          const resizedFile = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
            type: "image/jpeg",
          });
          resolve(resizedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}
