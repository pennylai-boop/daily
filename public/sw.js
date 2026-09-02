/*
 * 離線支援。
 *
 * 這個 app 的資料在 localStorage，所以只要外殼（HTML／JS／CSS）能離線載入，
 * 沒有網路也能照樣寫紀錄。策略刻意保守：
 * - 頁面：先連網，失敗才用快取，最後退回快取裡的首頁
 * - /_next/static 與圖示：內容有雜湊，直接快取優先
 * - /api、/support*、/divination/credits*、/adfree* 與 /auth*：完全不碰。付款、登入與訂閱一定要即時。
 *
 * 改動這個檔案時記得同時改 VERSION，舊快取才會在啟用階段被清掉。
 * NEXT_PUBLIC_* 是建置期烤進 bundle 的，換掉它們的值等於換掉一批 chunk 的內容；
 * 這種部署也要跟著進 VERSION，否則舊 chunk 會一直留在 ASSET_CACHE 裡被 cache-first 命中。
 */

const VERSION = "v10";
const SHELL_CACHE = `daily-shell-${VERSION}`;
const ASSET_CACHE = `daily-assets-${VERSION}`;
const SHELL_ROUTES = ["/", "/routines", "/focus", "/insights", "/divination", "/shared", "/settings"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // 逐一處理：其中一頁抓不到時不要讓整個安裝失敗。
      await Promise.all(
        SHELL_ROUTES.map(async (route) => {
          try {
            await cache.add(new Request(route, { cache: "reload" }));
          } catch (error) {
            console.warn("[sw] 預先快取失敗", route, error);
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const stale = keys.filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE);
      await Promise.all(stale.map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/support") ||
    url.pathname.startsWith("/divination/credits") ||
    url.pathname.startsWith("/adfree") ||
    url.pathname.startsWith("/auth")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || isIcon(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});

async function networkFirstPage(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    // cache: "reload" 跳過瀏覽器自己的 HTTP 快取。頁面回應帶的是 s-maxage，
    // 少了這個，舊的 HTML 可能被撈出來、又被寫回 SHELL_CACHE，指向的還是舊 chunk。
    const response = await fetch(request, { cache: "reload" });
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ?? (await cache.match("/")) ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

function isIcon(pathname) {
  return pathname === "/icon.svg" || pathname === "/apple-icon" || pathname === "/manifest.webmanifest";
}
