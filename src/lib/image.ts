export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export type PreparedImage = {
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
};

/**
 * Turns a picked file into a data URL small enough to live in localStorage.
 *
 * A phone photo is often 3000px+ on the long edge; base64 of that would blow
 * the ~5MB origin quota on its own. Downscaling to `maxEdge` and re-encoding
 * as JPEG keeps a coach portrait around 150-300KB while still looking sharp
 * on a retina screen at the size we render it.
 */
export async function prepareImage(
  file: File,
  maxEdge = 1400,
  quality = 0.82,
): Promise<PreparedImage> {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error(
      "Use a JPG, PNG, WebP or AVIF image. (HEIC from an iPhone needs converting first.)",
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("That file is over 15MB. Try a smaller export.");
  }

  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("This browser could not process the image.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", quality);

  return {
    dataUrl,
    width,
    height,
    // A base64 payload is ~4/3 the size of the bytes it encodes.
    bytes: Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75),
  };
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
