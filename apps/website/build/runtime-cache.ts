interface AppAssetResponseContext {
  request: Request;
  response: Response;
}

function validateAppAssetResponse({ request, response }: AppAssetResponseContext): Response | null {
  if (response.status !== 200) return null;

  const contentType = response.headers.get("Content-Type")?.toLowerCase() ?? "";
  const pathname = new URL(request.url).pathname.toLowerCase();

  if (pathname.endsWith(".js")) {
    return contentType.includes("javascript") || contentType.includes("ecmascript")
      ? response
      : null;
  }
  if (pathname.endsWith(".css")) {
    return contentType.startsWith("text/css") ? response : null;
  }
  if (/\.(?:woff2?|ttf)$/.test(pathname)) {
    return contentType.startsWith("font/") ||
      contentType.startsWith("application/font-") ||
      contentType.startsWith("application/x-font-") ||
      contentType.startsWith("application/octet-stream")
      ? response
      : null;
  }
  return null;
}

export function createAppAssetCachePlugin() {
  const cacheWillUpdate = async (context: AppAssetResponseContext): Promise<Response | null> =>
    validateAppAssetResponse(context);

  const cachedResponseWillBeUsed = async (context: {
    request: Request;
    cachedResponse?: Response;
  }): Promise<Response | null> => {
    const { request, cachedResponse } = context;
    if (!cachedResponse) return null;
    return validateAppAssetResponse({ request, response: cachedResponse });
  };

  return { cacheWillUpdate, cachedResponseWillBeUsed };
}
