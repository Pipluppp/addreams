const MEGABYTE = 1024 * 1024;

export const MAX_IMAGE_BYTES = 10 * MEGABYTE;

export const ACCEPTED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/bmp",
  "image/webp",
  "image/tiff",
  "image/gif",
]);

export type ImageValidationResult = {
  valid: boolean;
  error?: string;
};

export function validateReferenceImageFile(file: File): ImageValidationResult {
  if (!ACCEPTED_IMAGE_MIME_TYPES.has(file.type)) {
    return {
      valid: false,
      error: "Unsupported file type. Use jpg, jpeg, png, bmp, webp, tiff, or gif.",
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      valid: false,
      error: "File size exceeds 10MB. Please choose a smaller image.",
    };
  }

  return { valid: true };
}

export function isValidCustomSize(width: number, height: number): ImageValidationResult {
  if (width < 512 || width > 2048 || height < 512 || height > 2048) {
    return {
      valid: false,
      error: "Custom size width and height must each be between 512 and 2048.",
    };
  }

  if (width % 16 !== 0 || height % 16 !== 0) {
    return {
      valid: false,
      error: "Custom size width and height must be multiples of 16.",
    };
  }

  const area = width * height;
  if (area < 262144 || area > 4194304) {
    return {
      valid: false,
      error: "Custom size area must be between 262144 and 4194304 pixels.",
    };
  }

  return { valid: true };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Unable to read the selected image."));
    };
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}
