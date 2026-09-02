import type { MetadataRoute } from "next";

/**
 * 網頁版「加到主畫面」用的 manifest。
 *
 * 上架到 App Store／Play 的版本是原生殼包這個網站，圖示與名稱由各自的原生專案設定，
 * 這份 manifest 只影響直接從瀏覽器安裝的情境。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "天天 daily",
    short_name: "天天",
    description: "用日曆看見每一天的心情，用日記、五感恩、觀心書寫下值得留下的內容。",
    lang: "zh-Hant-TW",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f3f4f6",
    theme_color: "#f3f4f6",
    categories: ["lifestyle", "productivity"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
