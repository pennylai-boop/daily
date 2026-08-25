import type { Metadata, Viewport } from "next";

import { AppShell } from "@/components/app-shell";
import { ServiceWorkerRegistrar } from "@/components/service-worker";
import { platformBootstrapScript } from "@/lib/platform";
import { themeBootstrapScript } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://daily.introvsita.ai"),
  title: {
    default: "天天 daily — 每日目標與定期事項的紀錄本",
    template: "%s ｜ 天天 daily",
  },
  description:
    "天天是一款為繁體中文使用者設計的日記工具。用日曆檢視每天的心情表情，並以日記、五感恩、觀心書等格式記錄每日目標與定期事項。",
  keywords: ["日記", "手帳", "五感恩", "觀心書", "習慣追蹤", "每日紀錄", "daily"],
  applicationName: "天天 daily",
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "天天 daily",
    title: "天天 daily — 每日目標與定期事項的紀錄本",
    description: "用日曆看見每一天的心情，用日記、五感恩、觀心書寫下值得留下的內容。",
  },
  appleWebApp: { capable: true, title: "天天", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 讓內容延伸到瀏海與 home indicator 之下，元件再用 env(safe-area-inset-*) 留白。
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1115" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme 與 data-platform 由下面兩支 script 在 hydration 前寫入，因此忽略這層的屬性比對。
    <html lang="zh-Hant-TW" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <script dangerouslySetInnerHTML={{ __html: platformBootstrapScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <AppShell>{children}</AppShell>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
