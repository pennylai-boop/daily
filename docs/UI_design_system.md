# 飛鴿傳薪 UI 設計系統 — Cursor / AI 建立指示

## 自包含說明（僅需本 MD 即可重現 UI）

**本文件已包含重現目前所有 UI 細節所需的內容，不需另行開啟任何 component 或 CSS 檔案。**

- 所有樣式皆以 **Tailwind CSS class 字串** 或 **可複製的 HTML/JSX + class** 給出，不依賴既有元件庫。
- 字體設定、根 Layout、Tailwind 主題、globals.css 變數、側欄/底欄、按鈕、表單、表格、分頁、空狀態等，皆在本文件內有完整 class 或程式碼片段。
- 若新專案使用 Shadcn/Radix 等元件，可將本文件中的 class 套用到對應元件上；若純手寫，直接使用文件內的原生標籤與 class 即可。

---

## 從空資料夾建構（僅需本 MD，無需 Tailwind／2.1／15 等額外設定）

**只要有一個空資料夾與本 MD 檔案，依下列步驟執行即可建出完整 UI 環境。** 不需事先安裝 Tailwind、不需另找字體或 CSS 設定——本節已內含所有須覆寫的**完整檔案內容**，直接複製貼上即可。

### 前置需求

- Node.js 18 以上
- npm 或 pnpm

### 步驟一：建立 Next.js 專案（內建 Tailwind）

在終端機執行（請將 `my-app` 改為你的專案名稱）：

```bash
npx create-next-app@latest my-app --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

建立時若詢問問題，可全部選預設（Yes）。完成後進入專案目錄：`cd my-app`。

### 步驟二：覆寫／新增以下檔案

以下每個程式碼區塊即為**該檔案的完整內容**。請依標題的檔案路徑，在專案中建立或覆寫該檔案，並將區塊內程式碼整段複製貼上。

---

#### 檔案：`tailwind.config.ts`

若專案預設為 `tailwind.config.js`，請刪除該 js 檔，改建此 ts 檔。

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-noto-sans-tc)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        brand: {
          50: '#fef5f0', 100: '#fde8dd', 200: '#fad4c2', 300: '#f5b399', 400: '#ed8a5c',
          500: '#e86e2c', 600: '#d95a1a', 700: '#b44716', 800: '#8f3a18', 900: '#753318',
        },
        navy: {
          50: '#eef0f5', 100: '#dde1eb', 200: '#b9c0d4', 300: '#8a96b8', 400: '#5c6b9a',
          500: '#3d4a7c', 600: '#262f8b', 700: '#202872', 800: '#1a2159', 900: '#141a42',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}

export default config
```

---

#### 檔案：`postcss.config.mjs` 或 `postcss.config.js`

若專案產生的是 `postcss.config.js`，請改為以下內容（CommonJS）：

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

若為 `postcss.config.mjs`（ESM），則使用：

```js
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
export default config
```

---

#### 檔案：`app/globals.css`

**完整內容**，直接覆寫專案內既有 `app/globals.css`。

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.145 0 0);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.145 0 0);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.145 0 0);
    --primary: oklch(0.62 0.17 45);
    --primary-foreground: oklch(0.985 0 0);
    --secondary: oklch(0.97 0 0);
    --secondary-foreground: oklch(0.205 0 0);
    --muted: oklch(0.97 0 0);
    --muted-foreground: oklch(0.556 0 0);
    --accent: oklch(0.97 0 0);
    --accent-foreground: oklch(0.205 0 0);
    --destructive: oklch(0.577 0.245 27.325);
    --destructive-foreground: 0 0% 100%;
    --border: oklch(0.922 0 0);
    --input: oklch(0.922 0 0);
    --ring: oklch(0.708 0 0);
    --radius: 0.625rem;
  }
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

#### 檔案：`app/layout.tsx`

**完整內容**，含字體載入、metadata、body 的 class（灰底黑字）。無需 Toaster 或其它元件。

```tsx
import type { Metadata } from 'next'
import { Noto_Sans_TC } from 'next/font/google'
import './globals.css'

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-sans-tc',
})

export const metadata: Metadata = {
  title: { default: '產品名 | 副標', template: '%s | 產品名' },
  description: '本設計系統示範頁',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className={`${notoSansTC.className} antialiased bg-[#f3f4f6] text-black`}>
        {children}
      </body>
    </html>
  )
}
```

---

#### 檔案：`app/page.tsx`（首頁示範，驗證 UI 是否正確）

此頁用於確認：頁面灰底、白框、橘按鈕、藍連結皆依本設計系統呈現。

```tsx
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-0 p-4 md:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">設計系統示範</h1>
          <p className="text-sm text-gray-500 mb-6">
            此頁面為灰底、白底圓角內容框、主色按鈕與次色連結，符合本文件規範。
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="bg-[#e86e2c] text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:opacity-90"
            >
              主按鈕（橘）
            </button>
            <Link
              href="#"
              className="inline-flex items-center border-2 border-[#262f8b] text-[#262f8b] py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              次要按鈕（藍框）
            </Link>
            <Link href="#" className="text-[#262f8b] text-sm hover:underline">
              連結
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### 步驟三：執行並驗證

在專案目錄執行：

```bash
npm run dev
```

瀏覽器開啟 `http://localhost:3000`，應看到灰底、白框、橘/藍按鈕與連結。其餘頁面與元件請依本文件「1. 色彩規範」及後續章節的 class 與程式碼實作。

### 小結

- **不需**事先單獨安裝 Tailwind 或另備 2.1／15 的設定；本節已內含完整 `tailwind.config.ts`、`app/globals.css`、`app/layout.tsx` 與示範首頁。
- **僅需**：空資料夾 + 本 MD + 上述指令與複製貼上，即可從零建構出與本設計系統一致的 UI 環境。

---

## 給 AI 的使用方式

- **建立新產品或新頁面時**：請先完整讀取本文件，再開始撰寫或修改 UI。
- **所有按鈕、連結、背景、邊框、狀態**：僅能使用本文件「1. 色彩規範」中的色碼與 class，不得使用未列出的顏色（如 `blue-500`、`green-*`、`red-*` 等）。
- **版面結構**：根 layout、儀表板 layout、認證頁 layout 請依「4. 版面架構」的 DOM 與 class 實作；主內容必須包在「主內容白框」內。
- **元件**：按鈕、輸入框、卡片、下拉、Badge、摘要列等請直接複製「對應章節」的 class 或程式碼片段，僅替換文字與邏輯，不修改色系與圓角/陰影。
- **檢查**：完成 UI 後請依「16. 檢查清單」逐項確認。

> **用途**：此文件供 Cursor 或其它 AI 讀取，作為建立新產品或新頁面時保持 UI 一致的唯一規範。  
> **原則**：僅使用「黑、白、灰、橘、藍」五色；所有中間內容區以白底圓角框呈現；按鈕與強調色嚴格遵守色碼。

---

## 1. 色彩規範（不可偏離）

### 1.1 允許的顏色

| 用途 | 色碼 | Tailwind 使用方式 | 說明 |
|------|------|-------------------|------|
| **主色（按鈕、CTA、強調）** | `#e86e2c` | `bg-[#e86e2c]`、`text-[#e86e2c]`、`border-[#e86e2c]` | 橘色 |
| **次色（連結、次要按鈕、選中）** | `#262f8b` | `bg-[#262f8b]`、`text-[#262f8b]`、`border-[#262f8b]`、`ring-[#262f8b]` | 深藍 |
| **頁面背景** | `#f3f4f6` | `bg-[#f3f4f6]` | 淺灰（等同 Tailwind gray-100） |
| **文字主色** | 黑 | `text-black`、`text-gray-900` | 標題、內文 |
| **文字次要** | 灰 | `text-gray-600`、`text-gray-500`、`text-gray-400` | 說明、placeholder |
| **邊框** | 灰 | `border-gray-200`、`border-gray-300` | 卡片、輸入框 |
| **背景（卡片內淺區塊）** | 灰 | `bg-gray-50`、`bg-gray-100` | 區塊、禁用態 |

### 1.2 禁止的顏色

- 勿使用：`blue-500`、`green-*`、`red-*`、`amber-*`、`emerald-*`、`purple-*`、`indigo-*` 等未在 1.1 列出的顏色。
- 錯誤/警示：用灰階表示，例如 `bg-gray-100 text-gray-800`、`text-gray-600`，不要用紅色按鈕或紅色邊框。

---

## 2. 字體與根 Layout

### 2.1 字體（完整可複製）

- **中文 / 介面**：Noto Sans TC（Google Fonts），weights: 400, 500, 700。
- **變數**：`--font-noto-sans-tc`。以下為 Next.js 載入方式，僅需本段即可，不需另開檔案：

```tsx
import { Noto_Sans_TC } from 'next/font/google'

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-sans-tc',
})

// 在根 layout 的 <body> 上：className={`${notoSansTC.className} antialiased bg-[#f3f4f6] text-black`}
```

### 2.2 根 body（app/layout.tsx）

```tsx
<body className={`${notoSansTC.className} antialiased bg-[#f3f4f6] text-black`}>
```

- 全站背景一律 `bg-[#f3f4f6]`，文字預設黑。

### 2.3 Metadata 與 favicon

```tsx
export const metadata: Metadata = {
  title: { default: '產品名 | 副標', template: '%s | 產品名' },
  description: '...',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
}
```

- 若有品牌 icon，放在 `public/icon.svg`，並在 metadata 指定。

---

## 3. Tailwind 主題延伸（tailwind.config.ts）

在 `theme.extend.colors` 中保留與主色/次色對應的 palette，供需要階層時使用：

```ts
// 主色：橘 #e86e2c（按鈕/強調）
brand: {
  50:  '#fef5f0',
  100: '#fde8dd',
  200: '#fad4c2',
  300: '#f5b399',
  400: '#ed8a5c',
  500: '#e86e2c',
  600: '#d95a1a',
  700: '#b44716',
  800: '#8f3a18',
  900: '#753318',
},
// 次色：藍 #262f8b（按鈕/連結）
navy: {
  50:  '#eef0f5',
  100: '#dde1eb',
  200: '#b9c0d4',
  300: '#8a96b8',
  400: '#5c6b9a',
  500: '#3d4a7c',
  600: '#262f8b',
  700: '#202872',
  800: '#1a2159',
  900: '#141a42',
},
```

- 實際按鈕與連結仍**直接使用** `#e86e2c` / `#262f8b` 的 Tailwind 任意值（見下）。

---

## 4. 版面架構

### 4.1 儀表板 Layout（有側欄 + 主內容）

外層與主內容區：

```tsx
<div className="flex h-screen bg-[#f3f4f6] overflow-hidden">
  {/* 左側欄：桌面才顯示 */}
  <aside className="hidden md:flex w-60 flex-shrink-0 bg-white border-r border-gray-200 flex-col">
    {/* ... */}
  </aside>

  <main className="flex-1 overflow-y-auto pb-20 md:pb-0 bg-[#f3f4f6]">
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* 重要：所有中間內容包在白底圓角框內 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-0 p-4 md:p-6">
        {children}
      </div>
    </div>
  </main>
</div>
```

- 主內容**必須**放在 `bg-white rounded-xl border border-gray-200 shadow-sm` 的容器內。

### 4.2 認證頁 Layout（登入/註冊，無側欄）

```tsx
<div className="min-h-screen flex flex-col items-center justify-center bg-[#f3f4f6] p-4">
  <div className="mb-8 flex flex-col items-center gap-3 text-center">
    <Image src="/icon.svg" alt="產品名" width={56} height={56} />
    <div>
      <h1 className="text-2xl font-bold text-black">產品名</h1>
      <p className="text-sm text-gray-500 mt-1">副標語</p>
    </div>
  </div>
  <div className="w-full max-w-md">
    {children}
  </div>
  <p className="mt-8 text-xs text-gray-400">© {new Date().getFullYear()} 公司名</p>
</div>
```

---

## 5. 側邊欄與底部導覽（原始碼參考）

### 5.1 桌面側邊欄（左側固定）

- 容器：`hidden md:flex w-60 flex-shrink-0 bg-white border-r border-gray-200 flex-col`
- Logo 區：`px-5 py-5 flex items-center gap-3`，標題 `text-base font-bold text-black`，副標 `text-xs text-gray-500`
- 導覽連結（當前頁）：
  - **啟用**：`bg-[#e86e2c] text-white font-medium`，icon 用 `text-white`
  - **未啟用**：`text-gray-700 hover:bg-gray-100`，icon 用 `text-gray-500`
- 連結單項：`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors`
- 身份切換選中：`bg-gray-100 text-[#262f8b]`
- 使用者頭像底：`bg-[#262f8b] text-white`
- 登出按鈕：`text-gray-600 hover:text-black hover:bg-gray-100`，icon + 文字並排，文字常駐顯示

```tsx
{/* 導覽連結 */}
<Link
  href={item.href}
  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
    isActive ? 'bg-[#e86e2c] text-white font-medium' : 'text-gray-700 hover:bg-gray-100'
  }`}
>
  <span className={isActive ? 'text-white' : 'text-gray-500'}>{item.icon}</span>
  {item.label}
</Link>
```

### 5.2 手機底部導覽列

- 容器：白底、頂邊框、上方陰影，與側欄視覺一致  
  `md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]`
- 連結項：
  - **啟用**：`bg-[#e86e2c] text-white font-bold`
  - **未啟用**：`text-gray-600 hover:text-black`
- 單項：`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs transition-colors`

```tsx
<nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
  <div className="flex items-stretch">
    {items.map((item) => {
      const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
      return (
        <Link
          key={item.href}
          href={item.href}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs transition-colors ${
            isActive ? 'bg-[#e86e2c] text-white font-bold' : 'text-gray-600 hover:text-black'
          }`}
        >
          <span className={isActive ? 'text-white' : ''}>{item.icon}</span>
          <span className="leading-tight">{item.label}</span>
        </Link>
      )
    })}
  </div>
</nav>
```

---

## 6. 按鈕

### 6.1 主要 CTA（橘底白字）

```tsx
<button
  type="button"
  className="bg-[#e86e2c] text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
>
  按鈕文字
</button>
```

- 若按鈕實際是連結：用 `<Link href="..." className="inline-flex items-center justify-center gap-2 bg-[#e86e2c] text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:opacity-90">` 即可，不需任何 Button 元件。

### 6.2 次要 / 外框（藍字藍框）

```tsx
<button
  type="button"
  className="w-full py-2.5 border-2 border-[#262f8b] text-[#262f8b] rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
>
  存為草稿
</button>
```

### 6.3 連結型（僅文字，藍色）

```tsx
<Link href="..." className="text-[#262f8b] text-sm hover:underline">
  查看全部
</Link>
```

### 6.4 幽靈按鈕（灰字、hover 變深）

```tsx
<button
  type="button"
  className="text-gray-600 hover:text-black hover:bg-gray-100 px-2 py-1.5 rounded-md text-sm"
>
  登出
</button>
```

---

## 7. 卡片與內容區塊

### 7.1 內容區塊（section）標題

```tsx
<h2 className="text-lg font-semibold text-gray-900 mb-4">區塊標題</h2>
<p className="text-sm text-gray-500 mb-4">選填說明文字</p>
```

### 7.2 資訊卡片（白底、圓角、邊框）

- 外層（例如企業設定、表單區塊）：  
  `bg-white rounded-xl border border-gray-200 shadow-md` 或 `shadow-sm`，內層 `p-4` / `p-5`。

```tsx
<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
  <div className="px-5 py-4 border-b border-gray-100">
    <h2 className="text-base font-semibold text-gray-900">財務摘要</h2>
  </div>
  <div className="p-5 space-y-3">
    {/* 內容 */}
  </div>
</div>
```

### 7.3 統計小卡（儀表板用）

- 背景：`bg-gray-100`，文字：`text-gray-800`，icon：`text-gray-500`。

```tsx
<div className="bg-gray-100 rounded-xl border border-gray-200 p-4">
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-600">標籤</span>
    <span className="h-5 w-5 text-gray-500">{icon}</span>
  </div>
  <p className="text-2xl font-bold text-gray-800 mt-1">{count}</p>
</div>
```

---

## 8. 表單元件

### 8.1 輸入框

- 邊框：`border border-gray-300`，focus 環：`focus:outline-none focus:ring-2 focus:ring-[#262f8b]`（或 `focus:ring-brand-500` 若 primary 已對應橘色）。
- 建議 class：  
  `w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#262f8b]"`

```tsx
<input
  type="text"
  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#262f8b]"
  placeholder="..."
/>
```

### 8.2 標籤

```tsx
<label className="block text-sm font-medium text-gray-700 mb-1">欄位名稱</label>
```

### 8.3 選項按鈕 / 選中態（單選卡片）

- 未選：`border-gray-200 bg-gray-50` 或 `border-gray-200 hover:border-gray-300`
- 選中：`border-[#262f8b] bg-gray-50 ring-2 ring-gray-200`

```tsx
<button
  type="button"
  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
    selected ? 'border-[#262f8b] bg-gray-50 ring-2 ring-gray-200' : 'border-gray-200 bg-gray-50 hover:opacity-90'
  }`}
>
  <div className="font-semibold text-gray-900 text-sm">選項標題</div>
  <div className="text-xs text-gray-500 mt-1">選項說明</div>
</button>
```

### 8.4 Radio 選項（例如健保身份）

- 選中：外層 `border-[#262f8b] bg-gray-50`，未選 `border-gray-200 hover:border-gray-300`。

```tsx
<label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
  selected ? 'border-[#262f8b] bg-gray-50' : 'border-gray-200 hover:border-gray-300'
}`}>
  <input type="radio" className="mt-0.5" checked={selected} onChange={...} />
  <div>
    <div className="text-sm font-medium text-gray-900">選項</div>
    <div className="text-xs text-gray-500">說明</div>
  </div>
</label>
```

### 8.5 Textarea（多行輸入）

- 與輸入框同風格，focus 環 `focus:ring-2 focus:ring-[#262f8b]`：

```tsx
<textarea
  rows={3}
  maxLength={500}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#262f8b] resize-none"
  placeholder="..."
/>
<p className="text-xs text-gray-400 mt-1">{length}/500</p>
```

### 8.6 Select（原生下拉選單）

```tsx
<select
  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#262f8b]"
  value={value}
  onChange={onChange}
>
  <option value="">請選擇…</option>
  {/* options */}
</select>
```

---

## 9. 下拉選單（Dropdown）

- **內容層**（彈出區塊）：白底、陰影、灰邊。**不依賴任何元件**時，用純 div 即可，class 如下：

```tsx
<div className="z-50 min-w-32 rounded-lg bg-white p-1 text-gray-900 shadow-lg border border-gray-200">
  {/* 選項：rounded-md px-1.5 py-1 text-sm hover:bg-gray-100 */}
</div>
```

- **觸發按鈕**（例如「切換顯示欄位」）：

```tsx
<button
  type="button"
  className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 px-3 py-2"
>
  按鈕文字
</button>
```

- 若使用 Radix DropdownMenu，內容層請加上：`className="... rounded-lg bg-white p-1 shadow-lg border border-gray-200"`。

---

## 9.1 分隔線（Separator）

- **不依賴元件**時，用純 div 即可：

```tsx
{/* 水平 */}
<div className="h-px w-full bg-gray-200" />

{/* 垂直（例如側欄內） */}
<div className="w-px self-stretch bg-gray-200" />
```

- 側欄內常用：`<div className="h-px w-full bg-gray-200" />` 或 含左右 margin 的 `mx-3` 版本。

---

## 10. 狀態標籤（Badge / Status）

- **一律灰階**，不依狀態用綠/紅/黃：
  - 一般狀態：`bg-gray-100 text-gray-700` 或 `bg-gray-100 text-gray-800`
  - 作廢等：`bg-gray-200 text-gray-800`
- 圓角：`rounded-full`，字：`text-sm font-medium`，padding：`px-3 py-1.5`。

```tsx
<span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
  草稿
</span>
```

---

## 11. 摘要列（Label-Value 並排）

- 用於財務摘要、設定頁等：左 label、右 value，可選強調行（底色 + 藍字）。

```tsx
function FinRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={`flex items-center justify-between gap-4 py-2 ${highlight ? 'bg-gray-100 -mx-2 px-3 rounded-lg' : ''}`}>
      <dt className="text-sm text-gray-600 shrink-0">{label}</dt>
      <dd className={`font-semibold tabular-nums text-right ${highlight ? 'text-[#262f8b] text-xl' : 'text-gray-900'}`}>
        {value}
      </dd>
    </div>
  )
}
```

---

## 12. 提示 / 警示區塊

- 不採用黃/紅底，改用灰底灰字：

```tsx
<div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800">
  ⚠ 提示內容
</div>
```

或較大區塊：

```tsx
<div className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800">
  說明或警告內容
</div>
```

---

## 13. 表格與資料列表

### 13.1 表格結構（純 HTML，不依賴 Table 元件）

```tsx
<div className="relative w-full overflow-x-auto">
  <table className="w-full caption-bottom text-sm">
    <thead className="[&_tr]:border-b">
      <tr className="border-b">
        <th className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-gray-900">
          欄位名
        </th>
      </tr>
    </thead>
    <tbody className="[&_tr:last-child]:border-0">
      <tr className="border-b transition-colors hover:bg-gray-50">
        <td className="p-2 align-middle whitespace-nowrap text-gray-900">內容</td>
      </tr>
    </tbody>
  </table>
</div>
```

- 表頭可排序且**啟用態**：`text-[#262f8b]`。
- 儲存格內連結（例如編號）：`font-mono text-sm font-medium text-[#262f8b] hover:underline`。

### 13.2 篩選 Tab 列（狀態篩選）

```tsx
<div className="flex gap-1 border-b border-gray-200">
  {tabs.map((tab) => (
    <Link
      key={tab.value}
      href={tab.href}
      className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
        current === tab.value
          ? 'border-[#262f8b] text-[#262f8b]'
          : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {tab.label}
    </Link>
  ))}
</div>
```

### 13.3 分頁按鈕

```tsx
<div className="flex justify-center gap-2">
  {pages.map((p) => (
    <Link
      key={p}
      href={`?page=${p}`}
      className={`px-3 py-1 rounded text-sm ${
        p === currentPage
          ? 'bg-[#e86e2c] text-white'
          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
      }`}
    >
      {p}
    </Link>
  ))}
</div>
```

### 13.4 空狀態（尚無資料）

```tsx
<div className="p-8 text-center text-gray-500">
  尚無資料，點擊「新增」建立第一筆。
</div>
```

- 若需引導連結：`<Link href="..." className="mt-4 inline-block text-[#262f8b] text-sm hover:underline">建立第一筆</Link>`。

### 13.5 搜尋輸入列（表格上方）

- 與一般 input 同風格，可加左側圖示或右側按鈕：  
  `flex gap-2`，input `flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#262f8b]`，按鈕 `px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200`。

---

## 13.6 彈窗／Modal

- **不依賴 Dialog 元件**時，用以下結構即可：

```tsx
{/* 遮罩 */}
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
  {/* 內容框：白底、圓角、陰影 */}
  <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">標題</h2>
    <div className="space-y-4">
      {/* 表單或內容 */}
    </div>
    <div className="flex gap-2 mt-6 justify-end">
      {/* 取消 / 確認按鈕，使用 6.2 與 6.1 的 class */}
    </div>
  </div>
</div>
```

- 手機可改為底部滑出：外層改 `items-end sm:items-center`，內容框改 `max-h-[90vh] overflow-y-auto`。

---

## 14. 頭像（Avatar）

- **不依賴 Avatar 元件**時，用圓形 div 即可：

```tsx
<div
  className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center bg-[#262f8b] text-white text-xs font-bold"
  aria-label={name}
>
  {initials}
</div>
```

- 若使用 Shadcn Avatar，Fallback 請套用：`className="bg-[#262f8b] text-white text-xs font-bold"`。

---

## 15. 全域 CSS 變數（globals.css，完整可複製）

- 以下為完整 `app/globals.css` 內容，**僅需本段即可**，不需另開檔案。主色對應橘 `#e86e2c`，其餘為灰階與 Shadcn 相容變數。

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.145 0 0);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.145 0 0);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.145 0 0);
    --primary: oklch(0.62 0.17 45);
    --primary-foreground: oklch(0.985 0 0);
    --secondary: oklch(0.97 0 0);
    --secondary-foreground: oklch(0.205 0 0);
    --muted: oklch(0.97 0 0);
    --muted-foreground: oklch(0.556 0 0);
    --accent: oklch(0.97 0 0);
    --accent-foreground: oklch(0.205 0 0);
    --destructive: oklch(0.577 0.245 27.325);
    --destructive-foreground: 0 0% 100%;
    --border: oklch(0.922 0 0);
    --input: oklch(0.922 0 0);
    --ring: oklch(0.708 0 0);
    --radius: 0.625rem;
  }
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- 若根 layout 的 `<body>` 已直接寫死 `className="... bg-[#f3f4f6] text-black"`，則以 layout 為準，無須依賴 `--background` / `--foreground`。

---

## 16. 檢查清單（建立新產品時）

- [ ] 全站背景為 `#f3f4f6`，無其它底色。
- [ ] 所有「中間內容」都在 `bg-white rounded-xl border border-gray-200 shadow-sm` 的容器內。
- [ ] 按鈕僅使用：橘 `#e86e2c`、藍 `#262f8b`、灰（ghost/次要）。
- [ ] 未使用 `blue-*`、`green-*`、`red-*`、`amber-*`、`purple-*` 等。
- [ ] 錯誤/警示用 `bg-gray-100 text-gray-800` 或類似灰階。
- [ ] 側欄與手機底欄：白底、邊框、必要時陰影；啟用項為橘底白字。
- [ ] 輸入框 focus 環為 `ring-[#262f8b]` 或對應 primary。
- [ ] 狀態 Badge 為灰階（如 `bg-gray-100 text-gray-800`）。
- [ ] 連結與次要 CTA 使用 `#262f8b`。

---

## 17. 快速複製：常用 class 字串

| 用途 | Class 字串 |
|------|------------|
| 頁面外層 | `flex h-screen bg-[#f3f4f6] overflow-hidden` |
| 主內容白框 | `bg-white rounded-xl border border-gray-200 shadow-sm min-h-0 p-4 md:p-6` |
| 主按鈕 | `bg-[#e86e2c] text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50` |
| 次按鈕（外框） | `border-2 border-[#262f8b] text-[#262f8b] rounded-lg text-sm font-medium hover:bg-gray-50` |
| 連結 | `text-[#262f8b] hover:underline` |
| 區塊標題 | `text-lg font-semibold text-gray-900 mb-4` |
| 輸入框 | `w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#262f8b]` |
| 提示區塊 | `bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800` |
| 導覽啟用（側欄） | `bg-[#e86e2c] text-white font-medium` |
| 導覽啟用（手機底欄） | `bg-[#e86e2c] text-white font-bold` |
| 狀態 Badge | `px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800` |
| 下拉內容 | `bg-white shadow-lg border border-gray-200 rounded-lg` |
| 分頁當前頁 | `px-3 py-1 rounded text-sm bg-[#e86e2c] text-white` |
| 分頁其他頁 | `px-3 py-1 rounded text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50` |
| 篩選 Tab 啟用 | `px-3 py-2 text-sm font-medium border-b-2 border-[#262f8b] text-[#262f8b]` |
| Modal 遮罩 | `fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4` |
| Modal 內容框 | `bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto` |
| 分隔線水平 | `h-px w-full bg-gray-200` |
| 登入/註冊卡片 | `bg-white rounded-xl shadow-sm border border-gray-200 p-8` |

---

## 18. 依賴說明（重申自包含）

- **本文件不依賴**專案內的 `components/*.tsx`、`app/globals.css` 或任何既有元件庫。
- **從空資料夾建構時**：僅需本 MD。Tailwind 設定、字體、globals.css、layout、首頁示範等，皆已內含於「從空資料夾建構」一節的**完整檔案內容**中，不需再另備 Tailwind、2.1、15 等設定。
- **在既有專案中套用本設計系統時**：可依「從空資料夾建構」中的各檔案內容覆寫對應檔案，或依第 2、3、15 節複製字體／Tailwind／CSS 變數。
- **不需要**預先安裝 Shadcn、Radix 等；所有範例皆提供「原生 HTML/JSX + Tailwind class」寫法。
- 若新專案已使用 Shadcn/Radix，可將本文件給定的 class 套用到對應元件上，視覺效果與本文件描述一致。

---

## 19. 勞報單管理頁面（資料表格完整模式）

以下為「勞報單管理」頁（`/forms`）的完整 UI 模式，包含狀態篩選 Tab、工具列、批次操作列、資料表格、筆數提示與空狀態，皆符合本設計系統規範。

### 19.1 狀態篩選 Tab 列（水平捲動，含計數）

置於白框內最上方，搜尋列之前。啟用態用藍底底線，其餘透明底線。Tab 計數以小圓角標籤顯示。

```tsx
{/* 狀態篩選 Tab 列 */}
<div className="flex gap-0 border-b border-gray-200 overflow-x-auto">
  {STATUS_FILTER_OPTIONS.map(opt => {
    const isActive = filter === opt.value
    return (
      <button
        key={String(opt.value)}
        type="button"
        onClick={() => setFilter(opt.value)}
        className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
          isActive
            ? 'border-[#262f8b] text-[#262f8b]'
            : 'border-transparent text-gray-500 hover:text-gray-800'
        }`}
      >
        {opt.label}
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
          isActive ? 'bg-[#262f8b]/10 text-[#262f8b]' : 'bg-gray-100 text-gray-500'
        }`}>
          {count}
        </span>
      </button>
    )
  })}
</div>
```

### 19.2 工具列（搜尋 + 圖示按鈕群）

搜尋欄左側有 icon，右側為小型圖示按鈕（欄位顯示、篩選、批次選取、編輯）。

```tsx
<div className="flex flex-wrap items-center gap-2">
  {/* 搜尋輸入框 */}
  <div className="relative flex-1 min-w-[180px] max-w-xs">
    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    <input
      type="search"
      placeholder="搜尋表單編號、勞方姓名..."
      className="pl-8 h-8 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#262f8b] bg-white"
    />
  </div>

  {/* 圖示按鈕群（32×32, outline, 灰邊） */}
  <button
    type="button"
    className="h-8 w-8 p-0 inline-flex items-center justify-center border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
    title="顯示欄位"
  >
    <SlidersHorizontalIcon className="h-4 w-4" />
  </button>
  <button
    type="button"
    className="h-8 w-8 p-0 inline-flex items-center justify-center border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
    title="篩選"
  >
    <FilterIcon className="h-4 w-4" />
  </button>

  {/* 編輯模式：儲存 + 取消 */}
  <button
    type="button"
    className="h-8 gap-2 px-3 inline-flex items-center text-xs bg-[#e86e2c] text-white rounded-lg hover:opacity-90"
  >
    儲存
  </button>
  <button
    type="button"
    className="h-8 gap-2 px-3 inline-flex items-center text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
  >
    取消
  </button>
</div>
```

### 19.3 批次操作列（已選取時顯示）

藍框淡藍底，包含下載 PDF、批次核准、全部作廢（**灰色，非紅色**）、下載 CSV、取消選取。

```tsx
<div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#262f8b]/30 bg-[#262f8b]/5 px-3 py-2">
  <span className="text-sm text-gray-700">已選 N 筆</span>

  {/* 下載 PDF */}
  <button className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
    <FileDownIcon className="h-3.5 w-3.5" /> 下載 PDF (ZIP)
  </button>

  {/* 批次核准（藍框） */}
  <button className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs border border-[#262f8b]/30 text-[#262f8b] rounded-lg hover:bg-[#262f8b]/10">
    <CheckIcon className="h-3.5 w-3.5" /> 批次核准
  </button>

  {/* 全部作廢（⚠️ 一律灰色，絕不使用紅色） */}
  <button className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
    <Trash2Icon className="h-3.5 w-3.5" /> 全部作廢
  </button>

  {/* 下載 CSV */}
  <button className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
    <FileSpreadsheetIcon className="h-3.5 w-3.5" /> 下載 CSV
  </button>

  {/* 取消（ghost） */}
  <button className="h-8 px-2 text-xs text-gray-600 hover:text-black rounded-md hover:bg-gray-100">
    取消選取
  </button>
</div>
```

> **重要**：作廢、刪除等危險操作的按鈕一律使用灰色（`text-gray-700 border-gray-300`），**不可**使用 `text-red-*` 或 `border-red-*`。

### 19.4 資料表格（圓角白框）

外層 `rounded-xl border border-gray-200 overflow-hidden bg-white`，表頭 `bg-gray-50`，列 hover `hover:bg-gray-50/70 cursor-pointer`。

```tsx
<div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
  <table className="w-full caption-bottom text-sm">
    <thead>
      <tr className="bg-gray-50 hover:bg-gray-50 border-b">
        <th className="h-10 px-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">狀態</th>
        <th className="h-10 px-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">勞方</th>
        <th className="h-10 px-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500">金額</th>
        <th className="h-10 px-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500">實付</th>
        <th className="h-10 px-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500">建立日期</th>
        <th className="h-10 px-2 text-xs font-medium uppercase tracking-wide text-gray-500">操作</th>
      </tr>
    </thead>
    <tbody>
      {/* 有資料列 */}
      <tr className="border-b hover:bg-gray-50/70 transition-colors cursor-pointer">
        <td className="p-2 text-center">
          <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">草稿</span>
        </td>
        <td className="p-2">
          <span className="text-sm font-medium text-gray-900">勞方姓名</span>
        </td>
        <td className="p-2 text-right text-sm text-gray-900 tabular-nums">$50,000</td>
        <td className="p-2 text-right text-sm font-medium text-gray-900 tabular-nums">$43,945</td>
        <td className="p-2 text-right text-sm text-gray-500 tabular-nums">2026/3/13</td>
        <td className="p-2">
          {/* 操作按鈕（下載 PDF） */}
          <button className="inline-flex items-center justify-center h-8 w-8 rounded text-[#262f8b] hover:bg-gray-100">
            <FileDownIcon className="h-4 w-4" />
          </button>
        </td>
      </tr>
      {/* 空狀態（見 19.5） */}
    </tbody>
  </table>
</div>
```

### 19.5 空狀態（資料表格內）

無任何篩選條件時顯示引導文字；有篩選條件時顯示「沒有符合條件的…」。

```tsx
{/* 空狀態：無資料且無篩選 */}
<tr>
  <td colSpan={6}>
    <div className="p-8 text-center text-gray-500">
      尚無勞報單，點擊「新增勞報單」建立第一筆。
    </div>
  </td>
</tr>

{/* 空狀態：有篩選條件但無結果 */}
<tr>
  <td colSpan={6}>
    <div className="p-8 text-center text-gray-500">
      沒有符合條件的勞報單
    </div>
  </td>
</tr>
```

### 19.6 筆數提示

```tsx
<p className="text-xs text-gray-400 text-right px-1">共 N 筆</p>
```

### 19.7 頁面層級空狀態（無企業/無勞報單）

```tsx
{/* 無資料時的白框佔位（forms/page.tsx 外層） */}
<div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
  <p className="text-gray-400">尚未加入任何企業，無法查看勞報單。</p>
</div>

{/* 有企業但無勞報單時 */}
<div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
  <p className="text-gray-400">沒有符合條件的勞報單</p>
  <a href="/forms/new" className="mt-4 inline-block text-[#262f8b] text-sm hover:underline">
    建立第一張勞報單
  </a>
</div>
```

---

## 20. 勞報單詳情頁（card 式佈局）

勞報單詳情頁使用 `max-w-3xl mx-auto space-y-2` 為根容器，內部由多個白底圓角 section 組成。

### 20.1 標題列（狀態 + 操作）

```tsx
<div className="flex items-start justify-between gap-2">
  <div>
    <p className="text-xs text-gray-400 mb-0.5">勞報單</p>
    <h1 className="text-lg font-bold text-gray-900 font-mono">LF-20260313-001</h1>
    <p className="text-xs text-gray-400 mt-0.5">建立於 2026/3/13</p>
  </div>
  <div className="flex flex-col items-end gap-2 shrink-0">
    {/* 狀態 Badge（getStatusColor 對應 class） */}
    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#262f8b] text-white">
      待核准
    </span>
    {/* 操作按鈕列（FormActionButtons） */}
  </div>
</div>
```

### 20.2 鎖定提示

```tsx
<div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800">
  🔒 此勞報單已核准，所有財務資料已永久鎖定，不可修改。
</div>
```

### 20.3 雙欄 section（企業/勞務/勞方/財務）

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
  <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div className="px-3 py-2 border-b border-gray-100">
      <h2 className="text-sm font-semibold text-gray-900">企業資訊</h2>
    </div>
    <dl className="p-3 space-y-1 text-xs">
      {/* InfoRow: flex justify-between, label text-gray-500, value text-gray-900 */}
    </dl>
  </section>
  <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    {/* 同上結構 */}
  </section>
</div>
```

### 20.4 財務摘要 FinRow

```tsx
function FinRow({ label, value, highlight = false }) {
  return (
    <div className={`flex items-center justify-between gap-2 py-0.5 ${
      highlight ? 'bg-gray-100 -mx-1 px-2 rounded' : ''
    }`}>
      <dt className="text-xs text-gray-600 shrink-0">{label}</dt>
      <dd className={`text-xs tabular-nums text-right ${
        highlight ? 'text-[#262f8b] text-base font-bold' : 'font-semibold text-gray-900'
      }`}>
        {value}
      </dd>
    </div>
  )
}
```

---

*文件版本：1.3；新增第 19 節（勞報單管理頁面完整模式）及第 20 節（勞報單詳情頁 card 佈局），確保從空資料夾可完整重現所有頁面 UI 樣式。*
