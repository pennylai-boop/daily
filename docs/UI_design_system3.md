# 天天 Daily UI 設計系統

> **產品**：天天 Daily（病毒式數位名片與 AI 破冰信）  
> **程式庫**：`p:\Introvsta\Daily`（Next.js 16 App Router + Tailwind CSS 4 + shadcn/ui + Lucide）  
> **用途**：供 Cursor / AI 建立或修改 UI 時的唯一視覺規範；與 `docs/UI_design_system.md`（飛鴿傳薪範本）同源色系，但本文件描述 **Daily 實際實作**。

---

## 0. 給 AI 的使用方式

1. **先讀本文件**，再改 UI；禁止未列出的色碼（如 `blue-500`、`red-600`）。
2. **色彩**：僅黑、白、灰、橘 `#e86e2c`、藍 `#262f8b`；錯誤/警示用灰階，不用紅綠黃強調。
3. **版面**：認證頁全屏灰底置中；內頁由 `AppShell` 包裝，主內容區自行決定寬度（多為 `max-w-6xl` 或 `max-w-sm`）。
4. **實作來源**：以 `src/` 內現有 class 為準；新增頁面請複製對應章節的 class 字串。

**主要程式路徑對照**

| 區塊 | 路徑 |
|------|------|
| 全域樣式 | `src/app/globals.css`、`src/app/layout.tsx` |
| 按鈕變體 | `src/lib/button-variants.ts` → `src/components/ui/button.tsx` |
| 輸入框 | `src/components/ui/input.tsx` |
| 認證頁 | `src/app/login/page.tsx`、`src/app/login/login-form.tsx` |
| 註冊頁 | `src/app/signup/page.tsx`、`src/app/signup/signup-form.tsx` |
| 內頁殼層 | `src/components/app-shell.tsx`、`src/app/(app)/layout.tsx` |
| 儀表板 | `src/app/(app)/dashboard/dashboard-overview.tsx` |
| 名片分享（LINE / WhatsApp 規格） | `docs/whatsapp-share-design.md` |

---

## 1. 色彩規範

### 1.1 品牌色與語意色

| 用途 | 色碼 | Tailwind（建議寫法） |
|------|------|---------------------|
| 主色 CTA、導覽啟用、強調 | `#e86e2c` | `bg-[#e86e2c]`、`text-[#e86e2c]`、`hover:opacity-90`、`active:bg-[#d96528]` |
| 次色、連結、focus、方案徽章 | `#262f8b` | `text-[#262f8b]`、`border-[#262f8b]`、`ring-[#262f8b]` |
| 頁面背景 | `#f3f4f6` | `bg-[#f3f4f6]`（等同 gray-100） |
| 卡片/表單底 | `#ffffff` | `bg-white` |
| 頂欄/次區背景 | `#f3f4f6` 或 gray-100 | `bg-gray-100` |
| 主文字 | 黑 | `text-black`、`text-gray-900` |
| 次要說明 | 灰 | `text-gray-500`、`text-gray-600`、`text-gray-400` |
| 邊框 | 灰 | `border-gray-200`、`border-gray-300` |
| 淺底區塊 | 灰 | `bg-gray-50`、`bg-gray-100` |

### 1.2 圖表專用色（儀表板）

| 系列 | 色碼 | 說明 |
|------|------|------|
| 新名片趨勢線 | `#6b7280` | 灰，非藍 |
| 再訪 | `#e86e2c` | 橘 |
| 電郵 | `#4a5499` | 藍紫 |
| 開信 | `#6366f1` | 靛 |
| 報價 | `#ca8a04` | 金黃 |
| 成交 | `#16a34a` | 唯一允許的綠色（圖表語意，非 UI 主色） |

### 1.3 禁止

- 勿用 `blue-*`、`green-*`（圖表除外）、`red-*`、`amber-*` 作按鈕/邊框/警示主色。
- 方案鎖定 overlay 用灰底模糊，不用紅色「升級」按鈕。

---

## 2. 字體與根 Layout

### 2.1 字體

- **介面中文**：Noto Sans TC（`next/font/google`），weight 400 / 500 / 700。
- **變數**：`--font-noto-sans-tc`；Geist / Geist Mono 僅掛在 `<html>` 變數，介面以 Noto 為主。
- **根 body**（`src/app/layout.tsx`）：

```tsx
<body className={`${notoSansTC.className} flex min-h-dvh min-w-0 flex-col bg-[#f3f4f6] text-black`}>
```

### 2.2 行動端輸入

`globals.css`：`max-width: 768px` 時 `input/textarea/select` 設 `font-size: 16px`，避免 iOS 縮放。

### 2.3 品牌資產

| 檔案 | 用途 |
|------|------|
| `/Daily_logo.svg` | 認證頁、側欄、Header 橫向 logo |
| `/apple-touch-icon.jpg` | PWA / iOS 主畫面圖示 |
| `/app-icon-512.svg` | 備用圖示 |
| `manifest.json` | `theme_color: #e86e2c`，`background_color: #ffffff` |

---

## 3. 認證頁（登入 / 註冊）

無 `AppShell`；全屏垂直置中，灰底。

### 3.1 頁面骨架（`login/page.tsx`）

```tsx
<div className="flex min-h-dvh flex-col items-center justify-center bg-[#f3f4f6] p-4">
  {/* 品牌區 */}
  <div className="mb-8 flex flex-col items-center gap-3 text-center">
    <img src="/Daily_logo.svg" alt="天天 Daily" className="h-14 w-auto" />
    <div className="flex flex-col items-center gap-1">
      <p className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">慕名而來</p>
      <p className="text-[13px] font-normal text-gray-500">AI電子名片與客戶管理系統</p>
    </div>
  </div>
  {/* 表單卡片 */}
  <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    {/* LoginForm / SignupForm */}
  </div>
  <p className="mt-8 text-xs text-gray-400">© {year} Introvsta</p>
</div>
```

**品牌文案（定稿）**

- 主標：**慕名而來** — 粗黑、較大（`text-xl sm:text-2xl font-bold text-gray-900`）。
- 副標：**AI電子名片與客戶管理系統** — 13px 細體（`text-[13px] font-normal text-gray-500`）。
- 表單卡片內**不再**顯示「使用 Email 與密碼…」說明行（已移除）。

### 3.2 登入表單（`login-form.tsx`）

容器：`mx-auto w-full max-w-sm space-y-6`

| 元素 | class / 行為 |
|------|-------------|
| 標題 | `text-xl font-semibold tracking-tight` →「登入」 |
| 欄位標籤 | `Label` + `Input`（見 §5） |
| 錯誤 | `text-gray-700 text-sm` + `role="alert"` |
| 主按鈕 | `Button` `variant="default"` `className="w-full"` → 橘底 |
| 分隔「或」 | 上下 `border-t border-gray-200`，中間 `bg-white px-2 text-xs text-gray-500` |
| Google | `Button variant="outline" className="w-full"` → 藍框藍字 |
| 註冊連結 | `text-[#262f8b] font-medium underline-offset-4 hover:underline` |

### 3.3 註冊頁差異

- 外層與登入相同；Logo 區副標目前仍為「數位名片與 AI 破冰信」（`signup/page.tsx`），建議與登入統一為 §3.1 雙行品牌文案。
- 表單卡片：`max-w-sm`（登入同）。

---

## 4. 內頁殼層 AppShell

檔案：`src/components/app-shell.tsx`，包在 `src/app/(app)/layout.tsx`。

### 4.1 整體結構

```
┌─ aside 桌面側欄 (md+, 可收合) ─┬─ header sticky ─┐
│  logo / 導覽 / 帳號 / 登出      │  main 灰底      │
│                                │  {children}     │
└────────────────────────────────┴─ bottom nav 手機 ─┘
```

- 外層：`flex min-h-dvh w-full min-w-0 max-w-[100dvw]`
- 主欄左距：`md:ml-[min(18rem,100%)]` 或收合 `md:ml-[4.5rem]`
- **主內容**：`main` 灰底 + 手機底欄留白 `pb-[calc(66px+env(safe-area-inset-bottom,0px))]`

### 4.2 頂部 Header（手機 + 桌面）

```tsx
<header className="sticky top-0 z-40 flex h-12 w-full shrink-0 items-center justify-between gap-3 bg-gray-100 px-4">
```

| 區塊 | 樣式 |
|------|------|
| 漢堡（僅 md 以下） | `h-8 w-8`，`hover:bg-gray-200` |
| Logo 連結 `/my-card` | logo `h-4` + 文字「慕名而來」`hidden md:inline` |
| 方案徽章 `/plan` | `FREE` / `BASIC` / `PRO`：`border-[#262f8b]/35 bg-white text-[#262f8b] font-bold text-xs` |
| 語系切換 | 點擊展開的語系選擇選單 `<AppLanguageSwitcher />` |

### 4.3 桌面側欄

- 容器：`hidden md:flex`，寬度 `w-[min(18rem,100%)]` 或收合 `w-[4.5rem]`
- 背景：`bg-white`，右框 `border-r border-gray-200`
- 區塊標題：`text-[10px] font-semibold uppercase tracking-widest text-gray-400`
- **啟用連結**：`bg-[#e86e2c] font-medium text-white`，icon `text-white`
- **未啟用**：`text-black hover:bg-gray-200`，icon `text-black`
- 側欄背景：`bg-gray-100`（桌面與手機側欄）
- 底部導覽背景：`bg-gray-100`（手機）
- 帳號列啟用：`bg-gray-100 text-[#262f8b]`
- 頭像 fallback：`bg-[#262f8b] text-white`

**導覽分級（minTier）**

| minTier | 可見方案 |
|---------|----------|
| free | 所有人 |
| basic | Basic、Pro |
| pro | 僅 Pro |

主要：`/dashboard`、`/my-card`、`/new-interaction`、`/contacts`（free，含子頁籤「列名單」）  
Basic+：`/todos`（或 Free 且 `todos_unlocked`）  
Pro：`/calendar`  
全員：`/points/redeem`（點數兌換，在「信件模板」上方）、`/templates`、`/account`

### 4.3.1 Header 點數 badge

位置：頂欄右側、方案徽章（FREE/BASIC/PRO）**左側**；連結至 `/points/redeem`。

```tsx
        <Link
  href="/points/redeem"
  className="shrink-0 touch-manipulation whitespace-nowrap text-xs font-bold tabular-nums text-gray-800 no-underline transition-colors hover:text-[#262f8b] active:opacity-80"
>
  {availablePoints}點
        </Link>
```

- 文案：`{N}點`（數字緊接「點」，無空格、無外框）
- 視覺：純文字，與方案徽章（藍框 `#262f8b`）區分
- 資料：`get_user_available_points` 或 `fetchUserPointsSummary`；兌換成功後 `router.refresh()`

### 4.3.2 分享 Sheet — WhatsApp 按鈕

> 完整流程與 OG 卡片規格見 [`docs/whatsapp-share-design.md`](./whatsapp-share-design.md)。

位置：「分享名片」Bottom Sheet 內，**LINE Flex 主按鈕下方**。

```tsx
<Button
  type="button"
  variant="outline"
  className="w-full border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10"
>
  分享到 WhatsApp（連結卡片）
</Button>
```

| 項目 | 規格 |
|------|------|
| 語意 | outline 次要管道；**勿**寫成與 LINE Flex 同等「圖文名片」 |
| 說明小字 | `text-[11px] text-gray-500`：「對方會看到連結大圖預覽；完整互動請點進名片頁。」 |
| 圖示 | `/whatsapp-icon-card.png`（與名片捷徑相同） |
| 平台色例外 | 分享管道允許 WhatsApp 綠 `#25D366`（同 LINE 分享 `#06C755` outline 例外） |

### 4.4 手機底部導覽（5 項）

```tsx
<nav className="fixed inset-x-0 bottom-0 z-50 ... bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] md:hidden">
  <div className="flex h-[66px] w-full ...">
```

| 項目 | href | 標籤 |
|------|------|------|
| 儀表板 | `/dashboard` | 儀表板 |
| 我的名片 | `/my-card` | 我的名片 |
| 新增互動 | `/new-interaction` | 新增互動 |
| 名片簿 | `/contacts` | 名片簿 |
| 待辦 | `/todos` | 待辦事項（需 Basic+） |

啟用：`bg-[#e86e2c] font-bold text-white`；圖示 `h-6 w-6`。

### 4.5 手機抽屜

- 遮罩：`bg-black/30 backdrop-blur-[2px]`
- 抽屜：`w-[min(100%,22rem)] bg-white shadow-xl`，含完整 `SideNavContent`（手機不重複底部五項主功能）

### 4.6 開發預覽橫幅

`DEV_PREVIEW_SKIP_AUTH=true` 時頂部：`bg-gray-100 text-gray-800 border-b border-gray-300 text-xs`。

---

## 5. 按鈕（`button-variants.ts`）

共用：`rounded-lg text-sm font-medium`，點擊 `active:scale-[0.98]`（`motion-reduce` 關閉縮放）。

| variant | 視覺 | 典型用途 |
|---------|------|----------|
| `default` | 橘底白字 `bg-[#e86e2c]` | 登入、主要提交 |
| `brand` | 藍底白字 `bg-[#262f8b]` | 品牌強調 CTA |
| `outline` | 藍框藍字 `border-2 border-[#262f8b]` | Google 登入、次要確認 |
| `secondary` | 灰底 `bg-gray-100 text-gray-800` | 次要操作 |
| `ghost` | 透明灰字 hover 灰底 | 工具列、登出 |
| `destructive` | 灰調（非紅） | 刪除語意改灰 |
| `link` | 藍字底線 | 文字連結 |

尺寸：`default` → `h-9 px-4`；`sm` → `h-8 text-xs`；`lg` → `h-10`；`icon` → `h-9 w-9`。

---

## 6. 表單元件

### 6.1 Input（`components/ui/input.tsx`）

```tsx
"w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black
 placeholder:text-gray-400
 focus:border-[#262f8b] focus:ring-2 focus:ring-[#262f8b]/20
 disabled:bg-gray-100 disabled:opacity-50"
```

### 6.2 Label

沿用 shadcn `Label`；建議 `text-sm font-medium text-gray-700`。

### 6.3 認證表單間距

- 表單區：`space-y-4`
- 欄位組：`space-y-2`

---

## 7. 內頁內容區塊模式

內頁**不強制**單一白框包裹（與飛鴿傳薪不同）；常見模式如下。

### 7.1 頁面容器（儀表板）

```tsx
<div className="flex w-full min-w-0 max-w-none flex-1 flex-col gap-4 max-md:min-h-0 max-md:gap-0">
  {children}
</div>
```

### 7.2 滿版全螢幕列表頁（如名片簿、列名單）無外框貼齊

全站表格式呈現（名片簿、列名單、待辦、信件模板、聯絡人詳情的關聯待辦／互動歷程、帳號升級申請、點數兌換紀錄、付款紀錄、商家／廠商後台）一律**不包框**：外層不加 `rounded-* border shadow-*` 以及間距（不要用 `mx-auto` + padding 縮短表格），改為**全白底色滿版設計（Edge-to-edge）**。

在主內容層強制設定背景為白色 `bg-white` 蓋掉全局灰底。將「大標題/子頁籤」以及「工具篩選列」也納入 `bg-white` 並貼齊邊界。

**表頭文字：**強制加上 `whitespace-nowrap` 以防止欄位擠壓時文字斷行錯位。

```tsx
// 頁面進入點
<div className="flex w-full min-h-0 flex-1 flex-col overflow-hidden max-md:min-h-0 bg-white">
  {/* 子元件（Client）滿版展開 */}
  <div className="flex w-full min-h-0 flex-1 flex-col overflow-hidden bg-white max-md:flex max-md:w-full max-md:min-h-0 max-md:flex-1 max-md:flex-col max-md:overflow-hidden">
    
    {/* 標題與頁籤列（整合在第一列） */}
    <div className="flex shrink-0 flex-col gap-2 px-3 py-3 max-md:px-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-4 md:px-6 md:pt-4 md:pb-3 border-b border-gray-200">
      <div className="flex shrink-0 items-center gap-4">
        {/* 隱藏大標題，直接以頁籤代替 */}
        <div className="-ml-3 md:-ml-4"><ContactsTabs /></div>
      </div>
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        {/* 新增按鈕等 */}
      </div>
    </div>
    
    {/* 工具列與篩選 */}
    <div className="relative z-10 flex shrink-0 flex-col gap-2 overflow-x-hidden px-3 py-3 max-md:min-w-0 sm:px-4 md:px-6 md:pb-4 md:pt-3">...</div>
    
    {/* 滿版無框表格 (附帶橫向捲軸) */}
    <div className="max-w-full min-w-0 overflow-x-auto overscroll-x-contain max-md:flex-1 max-md:min-h-0 max-md:overflow-auto max-md:[-webkit-overflow-scrolling:touch]">
      <table className="w-full min-w-[640px] caption-bottom text-sm border-t border-gray-200">
        <thead className="sticky top-0 z-20">
          <tr className="border-b border-gray-200 bg-gray-50 hover:bg-gray-50">
            <th className="h-10 px-2 text-center align-middle text-xs font-medium uppercase tracking-wide text-gray-500 whitespace-nowrap">
              {/* 表頭必須 whitespace-nowrap 不換行 */}
            </th>
          </tr>
        </thead>
        ...
      </table>
    </div>
    
    {/* 分頁或底部資訊（貼齊最下方，flex 佈局） */}
    <div className="shrink-0 border-t border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 px-3 py-3 text-xs md:px-6 md:py-4">
        ...
      </div>
    </div>
  </div>
</div>
```

### 7.3 區塊卡片（section）

```tsx
<section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
  <h2 className="text-sm font-semibold text-gray-900">區塊標題</h2>
  ...
</section>
```

或無 `section` 外框、僅內層白卡（儀表板多區塊）。

### 7.4 頁面標題列（儀表板範例）

```tsx
<div className="flex min-w-0 items-center gap-3">
  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#262f8b]/10 text-[#262f8b]">
    <LayoutDashboard className="h-5 w-5" />
  </span>
  <h1 className="text-lg font-semibold text-gray-900">儀表板</h1>
</div>
```

### 7.5 資料期間 Tab / 列表子頁籤

```tsx
<div role="tablist" aria-label="名片簿分頁" className="flex flex-nowrap gap-1 overflow-x-auto overscroll-x-contain items-center">
  <button
    role="tab"
    aria-selected={active}
    className={cn(
      "flex-shrink-0 md:px-3 md:py-1.5 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
      active
        ? "md:bg-[#262f8b]/10 md:text-[#262f8b] md:border-transparent md:rounded-md border-b-2 border-[#262f8b] text-[#262f8b]"
        : "border-b-2 border-transparent md:rounded-md text-gray-500 hover:text-gray-900 md:hover:bg-gray-50",
    )}
  >
    {label}
  </button>
</div>
```

---

## 8. StatCard（儀表板 KPI / 客戶狀態）

`dashboard-overview.tsx` 內 `StatCard`：

- 外框：`rounded-xl border border-gray-200 bg-white shadow-sm ring-1`
- **dense 模式**（KPI 四欄、客戶狀態六欄）：`dense` prop → 較小 padding、字級 `text-[10px]`～`text-lg`
- 強調色 ring：藍 `ring-[#262f8b]/15`、橘 `ring-[#e86e2c]/20`、預設 `ring-gray-200/80`
- KPI 網格：`grid grid-cols-4 gap-1.5 sm:gap-3`
- 客戶狀態：`grid grid-cols-3 gap-2 sm:gap-3 xl:grid-cols-6`

---

## 9. 方案鎖定 ProLockedContent

當 `unlocked={false}` 時：

- 內容：`blur-[4px] opacity-[0.52]`，不可點
- 覆蓋連結 `/plan`：半透明灰底 `bg-gray-900/[0.02]`
- 文案：`{planLabel} 解鎖此區` + `點擊前往方案說明`
- `planLabel`：`paid` →「Basic / Pro」；`pro` →「Pro」

**儀表板權限（定稿）**

| 區塊 | unlocked 條件 |
|------|----------------|
| 名片現狀趨勢、客戶狀態、CRM 狀態寫入期間比較、待辦概覽 | `showPaidAnalytics`（Basic+） |
| 成交週期、期間互動比較、圖表總覽、流程與活躍度、跟進行動 | `showProAnalytics`（Pro） |

---

## 10. 警示與提示

```tsx
{/* 待辦 OAuth 未設定等 */}
<div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
  ...
</div>

{/* 一般說明（灰階，首選） */}
<p className="text-sm text-gray-500">...</p>
<div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
  ...
</div>
```

待辦頁 OAuth 警告為琥珀色（功能警示例外）；其餘新 UI 優先灰階。

---

## 11. 內頁路由一覽

| 路徑 | 說明 | 版面 |
|------|------|------|
| `/login` | 登入 | 認證 §3 |
| `/signup` | 註冊 | 認證 §3 |
| `/dashboard` | 儀表板 | AppShell + `max-w-6xl` |
| `/my-card` | 我的名片 | AppShell + 白底滿版 |
| `/new-interaction` | 新增互動 | AppShell |
| `/contacts` | 名片簿 | AppShell + 白底滿版 |
| `/contacts/[id]` | 名片詳情 | AppShell |
| `/leads` | 列名單 | AppShell + 白底滿版 |
| `/todos` | 待辦（Basic+） | AppShell + 白底滿版 |
| `/templates` | 信件模板 | AppShell + 白底滿版 |
| `/line-info-pages` | LINE 資訊頁（Pro） | AppShell |
| `/calendar` | 日曆預約（Pro） | AppShell |
| `/account` | 我的帳號 | AppShell |
| `/plan` | 方案說明 | AppShell |
| `/card/[userId]` | 公開名片 | 無 AppShell |
| `/line-p/[ownerId]/[pageId]` | 公開 LINE 頁 | 無 AppShell |

---

## 12. 儀表板區塊順序（定稿）

由上到下的主要 `section` / 區塊：

1. 核心 KPI（四欄 StatCard）
2. 名片現狀趨勢（折線圖）
3. 客戶狀態（六格 StatCard）
4. CRM 狀態寫入期間比較
5. 期間互動次數比較
6. 成交與週期指標（估）
7. 流程與活躍度
8. 跟進行動（成交歷程）
9. 待辦概覽
10. 圖表總覽（Pro 未解鎖時為模糊預覽 + 鎖定層）

---

## 13. 圖示

- 套件：**Lucide React**（`lucide-react`）
- 尺寸：導覽 `h-4 w-4`；底欄 `h-6 w-6`；區塊標題圖示 `h-5 w-5`
- 側邊選單／底部導覽 icon：
  - 選取狀態：白色（`text-white`）
  - 未選取狀態：純黑（`text-black`）、細體（預設 `strokeWidth` 即可，移除 `strokeWidth={2.5}`）
- 側邊選單／底部導覽文字：
  - 選取狀態：`font-medium`（底部導覽為 `font-bold`）
  - 未選取狀態：細體 / 正常 `font-normal`（底部導覽為 `font-medium`）

---

## 14. 響應式斷點

| 斷點 | 行為摘要 |
|------|----------|
| `< md` | 底部導覽、Header 漢堡、側欄抽屜 |
| `≥ md` | 固定側欄、無底欄、主內容 `md:pb-0` 或 `md:pb-4` |
| `sm:` | 字級/間距略放大（登入標題 `text-2xl`） |
| `xl:` | 客戶狀態六欄 |

---

## 15. z-index 參考

| 元素 | z-index |
|------|---------|
| 表格粘性表頭 | `z-20` |
| 篩選/列選單容器 | `z-10` |
| Header | `z-40` |
| 語系下拉選單 | `z-50` |
| 底欄 | `z-[120]` |
| 手機遮罩/抽屜 | `z-50` / `z-60` |
| Pro 鎖定 overlay 內連結 | `z-10`（相對父層） |
| PWA 提示浮層 | `z-80` |
| 外部工具列選單 | `z-[130]` |

---

## 16. 檢查清單（新頁面 / 改版）

- [ ] 是否在 `md` 以上有適當的 padding / max-width（儀表板 `max-w-6xl`，表單 `max-w-sm`）？若是表格頁面，是否已經改為全滿版無框設計？
- [ ] 文字色是否皆為 `gray-*` 或 `black`（主色保留給操作）？
- [ ] 是否實作了手機版底欄留白？（`pb-[calc(66px+...)]`）
- [ ] 按鈕是否有 Hover / Active 變化？
- [ ] 圖表或外框是否誤用藍綠黃紅色？（只能用灰或 `ring-gray-200`）
- [ ] 表頭標題列是否已加上 `whitespace-nowrap` 以防止斷行？
