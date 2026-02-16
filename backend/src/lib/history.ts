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

const CONTENT_TYPE_EXTENSION_MAP: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
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
