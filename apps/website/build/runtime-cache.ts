export function createAppAssetCachePlugin() {
  const cacheWillUpdate = async (context: {
    request: Request;
    response: Response;
  }): Promise<Response | null> => {
    const { request, response } = context;
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
  };

  return { cacheWillUpdate };
}
