type UploadGenerationAssetArgs = {
  bucket: R2Bucket;
  sourceUrl: string;
  userId: string;
  generationId: string;
};

type UploadGenerationAssetResult = {
  r2Key: string;
  contentType: string;
};

type UploadReferenceAssetArgs = {
  bucket: R2Bucket;
  referenceImage: string;
  userId: string;
  runId: string;
};

const CONTENT_TYPE_EXTENSION_MAP: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/bmp": "bmp",
  "image/x-ms-bmp": "bmp",
  "image/x-bmp": "bmp",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/tiff": "tiff",
  "image/tif": "tiff",
  "image/x-tiff": "tiff",
};

export async function uploadGenerationAsset(
  args: UploadGenerationAssetArgs,
): Promise<UploadGenerationAssetResult> {
  const imageResponse = await fetch(args.sourceUrl);
  if (!imageResponse.ok || !imageResponse.body) {
    throw new Error("GENERATION_ASSET_DOWNLOAD_FAILED");
  }

  const contentType = imageResponse.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  const extension = resolveExtension(contentType, args.sourceUrl);
  const r2Key = `users/${args.userId}/generations/${args.generationId}/output.${extension}`;

  await args.bucket.put(r2Key, imageResponse.body, {
    httpMetadata: { contentType },
  });

  return { r2Key, contentType };
}

export async function uploadReferenceAsset(
  args: UploadReferenceAssetArgs,
): Promise<UploadGenerationAssetResult> {
  if (isDataUrl(args.referenceImage)) {
    const parsedDataUrl = parseDataUrl(args.referenceImage);
    const extension = resolveExtension(parsedDataUrl.contentType, "");
    const r2Key = `users/${args.userId}/product-shoot-runs/${args.runId}/source.${extension}`;

    await args.bucket.put(r2Key, parsedDataUrl.bytes, {
      httpMetadata: { contentType: parsedDataUrl.contentType },
    });

    return {
      r2Key,
      contentType: parsedDataUrl.contentType,
    };
  }

  const imageResponse = await fetch(args.referenceImage);
  if (!imageResponse.ok || !imageResponse.body) {
    throw new Error("REFERENCE_ASSET_DOWNLOAD_FAILED");
  }

  const contentType = imageResponse.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  const extension = resolveExtension(contentType, args.referenceImage);
  const r2Key = `users/${args.userId}/product-shoot-runs/${args.runId}/source.${extension}`;

  await args.bucket.put(r2Key, imageResponse.body, {
    httpMetadata: { contentType },
  });

  return { r2Key, contentType };
}

export function parseJsonText(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function resolveExtension(contentType: string, sourceUrl: string): string {
  const mapped = CONTENT_TYPE_EXTENSION_MAP[contentType.toLowerCase()];
  if (mapped) {
    return mapped;
  }

  try {
    const url = new URL(sourceUrl);
    const pathname = url.pathname;
    const lastDot = pathname.lastIndexOf(".");
    if (lastDot > -1) {
      const ext = pathname.slice(lastDot + 1).toLowerCase();
      if (/^[a-z0-9]+$/.test(ext) && ext.length <= 5) {
        return ext;
      }
    }
  } catch {
    // Ignore malformed source URL and fall back to png.
  }

  return "png";
}

function isDataUrl(value: string): boolean {
  return value.trim().startsWith("data:");
}

function parseDataUrl(value: string): { contentType: string; bytes: Uint8Array } {
  const match = /^data:([^;,]+)?;base64,([\s\S]+)$/i.exec(value.trim());
  if (!match) {
    throw new Error("REFERENCE_ASSET_INVALID_DATA_URL");
  }

  const rawContentType = match[1]?.trim().toLowerCase();
  const contentType = rawContentType && rawContentType.length > 0 ? rawContentType : "image/png";
  const base64Payload = match[2]?.replace(/\s/g, "");
  if (!base64Payload) {
    throw new Error("REFERENCE_ASSET_INVALID_DATA_URL");
  }

  const binary = atob(base64Payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return { contentType, bytes };
}
