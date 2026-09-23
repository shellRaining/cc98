export function createAppAssetCachePlugin() {
  // Workbox 将回调序列化到独立的 Service Worker，回调不能引用构建模块作用域中的函数。
  const cacheWillUpdate = async ({
    request,
    response,
  }: {
    request: Request;
    response: Response;
  }): Promise<Response | null> => {
    if (response.status !== 200) return null;

    const contentType = response.headers.get("Content-Type")?.toLowerCase() ?? "";
    const pathname = new URL(request.url).pathname.toLowerCase();

    if (pathname.endsWith(".js")) {
      return contentType.includes("javascript") || contentType.includes("ecmascript")
        ? response
        : null;
    }
    if (pathname.endsWith(".css")) return contentType.startsWith("text/css") ? response : null;
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

  const cachedResponseWillBeUsed = async (context: {
    request: Request;
    cachedResponse?: Response;
  }): Promise<Response | null> => {
    const { request, cachedResponse } = context;
    if (!cachedResponse) return null;
    if (cachedResponse.status !== 200) return null;

    const contentType = cachedResponse.headers.get("Content-Type")?.toLowerCase() ?? "";
    const pathname = new URL(request.url).pathname.toLowerCase();

    if (pathname.endsWith(".js")) {
      return contentType.includes("javascript") || contentType.includes("ecmascript")
        ? cachedResponse
        : null;
    }
    if (pathname.endsWith(".css"))
      return contentType.startsWith("text/css") ? cachedResponse : null;
    if (/\.(?:woff2?|ttf)$/.test(pathname)) {
      return contentType.startsWith("font/") ||
        contentType.startsWith("application/font-") ||
        contentType.startsWith("application/x-font-") ||
        contentType.startsWith("application/octet-stream")
        ? cachedResponse
        : null;
    }
    return null;
  };

  return { cacheWillUpdate, cachedResponseWillBeUsed };
}
