# 天天 daily

> 提供他人記錄每日的目標與定期事項內容。

- 產品中文名稱：天天
- 產品英文名稱：daily
- 產品網域：daily.introvsita.ai
- 使用地區：台灣（繁體中文）

這個 repo 目前是**前端**實作。所有資料都存在瀏覽器的 `localStorage`，尚未接上後端。

## 快速開始

```bash
npm install
npm run dev
```

開啟 http://localhost:3000 。第一次進入是空白的，可以到「設定 → 載入示範資料」填入約六週的假資料，
馬上看到日曆與回顧頁的完整樣貌。

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 開發伺服器 |
| `npm run build` | 生產環境建置 |
| `npm start` | 啟動建置後的伺服器 |
| `npm run typecheck` | 產生路由型別並執行 `tsc --noEmit` |
| `npm run lint` | ESLint |

## 視覺規範

色彩與元件依 `docs/UI_design_system.md`（飛鴿傳薪）與 `docs/UI_design_system2.md`（NameGain）：
只用黑、白、灰、橘 `#e86e2c`、藍 `#262f8b`。橘色是主色（主要 CTA、導覽啟用態），藍色是次色
（連結、選中狀態、完成度），灰階負責背景與文字層級。

| 用途 | 設計系統色 | 專案 token（`src/app/globals.css`） |
| --- | --- | --- |
| 頁面背景 | `#f3f4f6` | `--paper` → `bg-paper`（由 `body` 套用） |
| 卡片 | 白底、`gray-200` 邊框、`rounded-xl`、`shadow-sm` | `.card` 工具類別 |
| 主色 | `#e86e2c` | `--brand`、`--brand-strong`、`--brand-tint` |
| 次色 | `#262f8b` | `--accent`、`--accent-strong`、`--accent-tint` |
| 文字 | `gray-900` / `gray-600` / `gray-400` | `--ink` / `--ink-muted` / `--ink-subtle` |
| 邊框 | `gray-200` / `gray-300` | `--line` / `--line-strong` |
| 警示 | 灰階，不用紅色 | `--alert`（gray-700），`Button variant="danger"` 是灰色填色 |

元件對照：

- **按鈕**（`src/components/ui/button.tsx`）：`primary` 橘底白字、`outline` 藍框藍字、`secondary` 灰框、
  `ghost` 灰字、`danger` 灰底。圓角一律 `rounded-lg`。
- **輸入框**（`src/components/ui/field.tsx`）：`gray-300` 邊框，對焦時邊框轉藍並加 2px 藍色 ring。
- **導覽啟用態**：側欄與手機底欄都是橘底白字（`src/components/app-shell.tsx`）。
- **選中態**：心情、圖示、星期、記錄格式等多選／單選卡片一律藍框加灰底 ring，把橘色留給 CTA。
- **分頁**（`RangeTabs`）：藍色底線加藍字。
- **折線圖**：`SERIES_COLORS` 以橘、藍為前兩色，其餘取設計文件的灰與藍紫階。
- **分享圖片**（`src/lib/share-image.ts`）的 `COLORS` 與上表同步，匯出的圖片和畫面同一套色。

設計文件沒有定義深色模式，這裡自行延伸：灰階換成深色，橘藍提亮，填色元件的文字改用
`--on-brand` / `--on-accent`（深色模式下是深字），避免白字壓在亮橘／亮藍上讀不清楚。

## 手機版與桌機版

介面以手機為主要使用情境設計，`lg`（1024px）以上才切換成桌機版面。

| | 手機 | 桌機 |
| --- | --- | --- |
| 主導覽 | 底部四個分頁：日曆／定期事項／回顧／被分享紀錄 | 左側欄五個項目 |
| 設定 | 頂端列右側的齒輪圖示 | 併入左側欄 |
| 內容欄位 | 單欄 | 日曆與側欄並排、圖表兩欄 |

手機版的幾個細節：

- **安全區域**：`viewport` 設定 `viewportFit: "cover"`，頂端列與底部分頁再用 `env(safe-area-inset-*)`
  留白，iPhone 的瀏海與 home indicator 都不會蓋住內容。
- **輸入框在手機一律 16px**（`src/components/ui/field.tsx`）。iOS Safari 只要輸入框字級小於 16px，
  對焦時就會自動放大整頁。
- **觸控目標**：日期切換、月份切換等圖示按鈕在手機是 40px，桌機縮回 32px；純文字連結用 `TextLink`
  撐出 36px 的高度。
- **折線圖依容器實際像素寬度繪製**（`src/components/charts/line-chart.tsx`）。固定 viewBox 再縮放的話，
  11px 的座標軸文字在手機上會被壓成 5px；同時會依可用寬度決定 x 軸標籤的數量。
- **不使用 Emoji 14 之後的字元**。例如蓮花 🪷 在 Windows 內建字型中還沒有，會顯示成空白方框，
  觀心書因此改用 💭。
- 已在 320 / 390 / 430 / 768px 四種寬度確認所有頁面都沒有橫向捲動。

## 功能

### 日曆檢視（`/`）

月曆以週日為每週第一天。當天有紀錄時，格子中央會顯示該天心情的**表情圖樣**；只寫了內容但沒選心情的日子
顯示一個小圓點。格子下緣的細線是當天定期事項的完成度。右側面板可以直接點選今天的心情，並勾選今天該做的
定期事項。

### 定期事項就是書寫的來源（`/routines`）

**記錄格式不是獨立的選單，而是定期事項的一個屬性。** 每個事項可以選一種格式：

| 格式 | 內容 |
| --- | --- |
| ✅ 只打勾 | 不需要書寫，完成時打勾即可（例如喝水、運動） |
| ✍️ 日記 | 標題（可留空）＋ 自由書寫 |
| ❤️ 五感恩 | 五列感謝的事；不夠寫可以按「再加一項」往下加，第六列起可個別刪除 |
| 💭 觀心書 | 身（做的）／口（說的）／意（想的）三段，每段可加入 ＋做得好、－要調整、→待做三種條目 |

有記錄格式的事項，清單上會多一個「填寫」按鈕，直接跳到今天的紀錄頁展開對應欄位。
重複頻率有四種：每天、每週（指定星期）、每月（指定日期）、每隔 N 天（指定起算日）。
首次使用會預設帶入「五感恩」（每天）、「觀心書」（每週日、週三）與「寫日記」（每天）三個事項。

### 每日紀錄（`/entry/[date]`）

當天排定的定期事項會列在這裡。**打勾有設定格式的事項，就會展開對應欄位讓你填寫**；沒有排定但設了格式的
事項會出現在「其他書寫格式」，隨時可以臨時加寫一段。另外有「當日目標」的勾選清單，對應產品目的中的
「每日的目標」。

編輯內容會在停止輸入約 0.6 秒後自動儲存；若一天完全沒有內容，該筆紀錄會自動移除，不會在日曆上留下痕跡。
頁尾右側的「分享成圖片」會把當天的紀錄畫成一張整頁 PNG，手機上透過 Web Share API 可以直接傳到 LINE，
桌機則退回下載檔案。

觀心書的條目存成一個扁平陣列（`MindfulnessItem`），每筆帶著 `channel`（身／口／意）與 `mark`
（`plus` / `minus` / `todo`），呈現時再依身、口、意分組。這樣新增、刪除、改順序都只是動一個陣列，
也不必為三個面向各開一個欄位。

新增格式的方式：在 `src/lib/types.ts` 增加 `TemplateId` 與對應的 content 型別，
在 `src/lib/templates.ts` 補上 metadata 與 `createEmptyContent`、`summarizeBlock` 等分支，
最後在 `src/components/entry/block-editor.tsx` 加上欄位。TypeScript 的 discriminated union 會提示所有
需要補齊的地方。

### 回顧（`/insights`）

上方是連續天數、最長連續、累積天數與書寫段落數。接著可以切換統計區間
（一週／2週／一月／一季／6個月／1年／3年／全部），下方三張折線圖會跟著變動：

- **心情趨勢**：心情平均分數（1–5）
- **書寫量比較**：三種記錄格式各自的字數，一格式一條曲線
- **定期事項完成率比較**：一事項一條曲線，只計算該做的日子

區間長度會自動決定折線的顆粒度：31 天以內按日、130 天以內按週、更長則按月。

### 被分享紀錄（`/shared`）

別人在 LINE 上邀請你、你按下接受之後，他的紀錄就會出現在這裡。每個人一張卡片，下面列出可查看的日子，
點開就是唯讀的內容（`src/components/entry/block-reader.tsx`）。若對方的分享範圍是「只看心情」，
就只顯示心情，不顯示書寫內容。

目前資料放在 `DailyState.sharedWithMe`，由示範資料填入以呈現畫面；正式版要改成由後端依接受過的邀請回傳。

### 設定（`/settings`）

- **個人資料**：顯示名稱，以及唯讀的 LINE 帳號（登入後帶入）。
- **傳送到 LINE 群組**：開關、群組名稱、群組 ID、傳送時機（完成當日紀錄時／只在我按下分享時）。
  設定後，每日紀錄頁的分享按鈕會顯示成「分享到〈群組名稱〉」。
- **分享給誰看**：用 LINE 送出邀請。每張邀請可獨立設定「完整內容」或「只看心情」，
  對方接受前顯示邀請碼、可以再分享一次或複製連結，接受後換成對方的 LINE 身分。
- 外觀切換、JSON 匯出與匯入、載入示範資料、清除全部資料。

### 邀請頁（`/invite/[code]`）

邀請連結的落地頁。正式流程是對方用 LINE 登入、後端比對邀請碼後建立關聯；後端接上之前，
這一頁只認得同一個瀏覽器裡建立的邀請，並提供「模擬接受」用來預覽接受之後的樣子。

分享的識別為什麼不用 email、`liff.shareTargetPicker()` 怎麼接，見下面的「部署規劃」。

LINE 的自動推送需要後端：Messaging API 的 channel access token 不能放在瀏覽器，前端也無法直接呼叫
`api.line.me`。因此現階段設定只負責保存，實際送出走「分享成圖片 → 系統分享面板 → LINE」這條路徑，
在手機上等同於直接把整頁圖片傳進群組。接上後端之後的做法見下方「部署規劃」。

## 技術結構

Next.js 16（App Router）、React 19、TypeScript、Tailwind CSS v4。

```
src/
├─ app/                    路由（日曆、記錄、定期事項、回顧、被分享紀錄、設定）
│  ├─ */page.tsx           伺服器元件，只負責 metadata 與載入同層的 *-screen.tsx
│  ├─ */*-screen.tsx       各頁真正的畫面，標了 "use client"
│  ├─ icon.svg             品牌標記＝favicon，太陽造型
│  └─ apple-icon.tsx       iOS 主畫面圖示，用 next/og 產生 180×180 PNG
├─ components/
│  ├─ app-shell.tsx        桌機側邊欄 + 手機底部導覽
│  ├─ calendar/            月曆與心情圖例
│  ├─ charts/              多曲線折線圖（自繪 SVG，無圖表套件）
│  ├─ entry/               心情選擇、目標清單、各格式的編輯欄位與唯讀呈現
│  ├─ routines/            定期事項清單、表單與當日清單
│  └─ ui/                  Button / Field / Card / RangeTabs / Segmented 等基礎元件
└─ lib/
   ├─ types.ts             領域模型
   ├─ date.ts              本地時區的日期工具與月曆格線
   ├─ moods.ts             心情表情、色票與分數
   ├─ templates.ts         三種記錄格式的定義
   ├─ routines.ts          重複頻率的判斷、描述與預設事項
   ├─ stats.ts             連續天數、心情分布、完成率
   ├─ series.ts            統計區間、時間分桶與折線圖資料
   ├─ share-image.ts       Canvas 繪製分享圖片
   ├─ storage.ts           localStorage 讀寫
   ├─ store.ts             useSyncExternalStore 狀態容器
   ├─ theme.ts             深色模式
   └─ demo.ts              示範資料
```

幾個實作上的決定：

- **日期一律使用本地時區的 `YYYY-MM-DD` 字串**（`src/lib/types.ts` 的 `IsoDate`）。直接用 `Date` 物件或
  UTC ISO 字串，在台灣時區會出現跨日錯誤。
- **書寫內容掛在定期事項底下**。`EntryBlock.routineId` 指向來源事項；事項被刪除或換了格式時，內容不會消失，
  會落到編輯頁的「其他紀錄」區塊。
- **讀取時就地升級舊資料**（`normalizeState`，`STORE_VERSION = 2`）。v1 的觀心書是五個問答，改成身／口／意
  的條列之後，舊內容會轉成一則標題為「觀心書（舊格式）」的日記，文字一個字都不會掉。
- **分享圖片用 Canvas 手繪，不截取 DOM**（`src/lib/share-image.ts`）。截圖會夾帶輸入框與按鈕；手繪則能輸出
  一張排版乾淨的紀錄卡，中文斷行是逐字計算、拉丁文字以單詞為單位。
- **狀態容器用 `useSyncExternalStore`**（`src/lib/store.ts`）。伺服器端快照回傳 `null` 代表「尚未就緒」，
  客戶端 hydration 完成後才切換到 `localStorage` 的內容，因此不需要在 effect 裡呼叫 setState，也不會有
  hydration 落差。要接後端時，只需要改寫這一層的 `commit` 與 `storage.ts`。
- **`page.tsx` 一律是伺服器元件**，畫面本體放在同層的 `*-screen.tsx`。頁面本身若標了 `"use client"`，
  Next 會用 `ClientPageRoot` 把 `params` 與 `searchParams`（開發模式下是會警告的 Promise proxy）當成 props
  傳進來；瀏覽器擴充或 IDE 的元素檢視器一旦列舉這些 props，就會在 console 噴 `params are being enumerated`。
  拆開之後 props 裡不再有 Promise，也順便能為每一頁寫 `metadata` 標題。
- **不載入 CJK 網頁字型**。繁中字型動輒數 MB，改用系統內建字型堆疊（`PingFang TC`、`Microsoft JhengHei`
  等），見 `globals.css` 的 `--font-sans`。
- **深色模式在 hydration 前套用**。`src/lib/theme.ts` 的 `themeBootstrapScript` 會在首次繪製前寫入
  `data-theme`，避免白色閃爍。

## 部署規劃：Supabase + GCP + LINE 登入

**LINE 登入即完成綁定**：登入拿到的 `userId` 就是 Messaging API 推播要用的那一組，不需要另外做綁定流程。
環境變數的完整清單與說明在 [`.env.example`](.env.example)，本機複製成 `.env.local` 即可。
機密值在 GCP 上放 Secret Manager，再掛成 Cloud Run 的環境變數。

| 變數 | 位置 | 用途 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 前端＋後端 | OAuth 轉回來的位址、分享連結 |
| `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 前端 | 瀏覽器端的 Supabase client，權限由 RLS 決定 |
| `SUPABASE_SECRET_KEY` | 只在伺服器 | 繞過 RLS 的操作（推送排程、比對分享關係）、註冊 custom provider |
| `SUPABASE_DB_URL` | 只在本機／CI | 跑 migration，Cloud Run 請用 pooler 的 6543 埠 |
| `LINE_LOGIN_CHANNEL_ID`、`LINE_LOGIN_CHANNEL_SECRET` | 只在本機 | 跑一次性的 `createProvider` 腳本 |
| `NEXT_PUBLIC_LIFF_ID` | 前端 | 叫出 LINE 的好友選擇畫面來發邀請 |
| `LINE_MESSAGING_CHANNEL_SECRET`、`LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` | 只在伺服器 | 驗 webhook 簽章、推送紀錄 |
| `CRON_SECRET` | 只在伺服器 | Cloud Scheduler 呼叫推送端點時的共享密鑰 |

Supabase 的 `anon` / `service_role` 這組 JWT 金鑰會在 2026 年底停用，新專案請直接用
`sb_publishable_...` / `sb_secret_...`。

### LINE 登入

在 LINE Developers 的**同一個 provider** 底下開兩個 channel：LINE Login 與 Messaging API。
userId 是按 provider 發放的，跨 provider 拿到的值推不到同一個人，這件事事後改不了，開之前先確認。
Login channel 的 Callback URL 填 `https://<專案>.supabase.co/auth/v1/callback`，
Basic settings 的 Linked LINE Official Account 綁上 Messaging API 那個官方帳號。

Supabase Auth 沒有內建 LINE provider，要註冊成 Custom OAuth Provider。Dashboard 的表單只填得了端點，
底下三個設定得用 admin API，所以寫成一次性腳本跑（需要 `SUPABASE_SECRET_KEY`）：

```js
await supabase.auth.admin.customProviders.createProvider({
  provider_type: "oauth2",           // 不能用 oidc，理由見下
  identifier: "custom:line",
  name: "LINE",
  client_id: process.env.LINE_LOGIN_CHANNEL_ID,
  client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET,
  authorization_url: "https://access.line.me/oauth2/v2.1/authorize",
  token_url: "https://api.line.me/oauth2/v2.1/token",
  userinfo_url: "https://api.line.me/v2/profile",
  scopes: ["profile", "openid"],
  email_optional: true,              // /v2/profile 不回 email
  attribute_mapping: { sub: "userId", name: "displayName", picture: "pictureUrl" },
  authorization_params: { bot_prompt: "aggressive" }, // 登入時引導加官方帳號好友
});
```

三個關鍵：

- **一定要用 `oauth2` 而不是 `oidc`。** LINE 的 `id_token` 是用 channel secret 以 HS256 簽章，
  Supabase 的 OIDC 流程會去 JWKS 驗非對稱簽章，驗不過。
- **`attribute_mapping` 不能省。** LINE 的 `/v2/profile` 回的是 `userId`，不是 OAuth2 慣例的 `sub`，
  沒對應的話登入會走完整個流程、最後失敗在 `missing provider id`。若欄位名稱與上面不同，
  以 `createProvider` 回傳的內容為準。
- **`bot_prompt=aggressive` 讓登入順便加好友。** 沒成為好友就推不了訊息。推到群組則是把官方帳號邀進群，
  從 webhook 事件取得 `groupId`（「設定 → 傳送到 LINE 群組」現在手填的那格就能自動帶入）。

前端登入是 `supabase.auth.signInWithOAuth({ provider: "custom:line" })`。

### 分享的識別改用 LINE，不用 email

`/v2/profile` 只回 `userId`、`displayName`、`pictureUrl`；email 只有在 channel 通過 LINE 的 email
權限審核後才會出現在 `id_token` 裡。所以「設定 → 個人資料」的 email 會是使用者自己打的、沒有經過驗證，
拿它當分享的識別等於任何人打了別人的 email 就能看到對方紀錄。改用 LINE 的身分可以一併解決。

LINE 有兩個限制決定了做法：**沒有好友清單 API，也不能用 LINE ID 或暱稱查人**（隱私考量）。
所以不能做成「輸入對方的 LINE ID 就加入分享」，要由使用者自己在 LINE 的介面挑人：

1. 分享者在「設定 → 分享給誰看」按邀請，前端呼叫 `liff.shareTargetPicker()`，
   跳出 LINE 原生的好友／群組選擇畫面。
2. 送出的訊息裡帶一個一次性邀請連結（`share_invites` 表：`token`、`owner_id`、`scope`、
   `expires_at`、`used_by`）。訊息在對方眼中是分享者本人傳的。
3. 對方點開連結、用 LINE 登入（同一個 provider，`userId` 一致），按下接受才寫入
   `shares(owner_id, viewer_id, scope)`。

這樣關聯的兩端都是 LINE 驗證過的 `userId`，不需要打字、也不會誤加到別人。

前端已經照這個模型改寫：`ShareRecipient` 帶 `status`、`inviteCode`、`lineUserId`，
`src/lib/line-invite.ts` 負責叫出 LINE 的好友選擇畫面（不在 LINE 裡就退回系統分享面板或複製連結），
`/invite/[code]` 是邀請的落地頁。profile 的 email 欄位已移除，舊資料在 `normalizeState` 裡
轉成待接受的邀請（`STORE_VERSION` 3）。後端上線後只要把 `createInvite` / `acceptInvite`
換成 API 呼叫即可。

實作前提：在 Login channel 底下建一個 LIFF app（Endpoint URL 指向本站），把 ID 放進
`NEXT_PUBLIC_LIFF_ID`。`shareTargetPicker` 需要 LINE 10.3.0 以上，呼叫前用
`liff.isApiAvailable("shareTargetPicker")` 判斷，不支援時退回複製邀請連結。
要確認對方是否已加官方帳號（決定推不推得動訊息）用 `liff.getFriendship()`，
伺服器端則是 `GET https://api.line.me/friendship/v1/status`。

若之後想補一個桌機比較好用的登入方式，加 Google 只需要在 Supabase 後台填 client ID/secret，
不必動這個 repo 的環境變數；但同一個人用兩種方式登入會是兩個帳號，要另外處理 `linkIdentity`。

### Cloud Run

- `NEXT_PUBLIC_*` 是**建置期**就被寫進 bundle 的，所以要在 Cloud Build 階段（substitutions 或
  `--build-arg`）提供，光在 Cloud Run 設執行期環境變數不會生效。
- 容器必須監聽 Cloud Run 注入的 `PORT`。
- 建置用 `npm run build`（Webpack）；`--turbopack` 在這台網路磁碟上會失敗，原因見下一節。

## 已知環境限制：Turbopack 與網路磁碟

這個 repo 位在網路磁碟（`P:` → `\\Nfi7W_IntroVis\Products\...`）。Turbopack 執行 PostCSS 時，
Tailwind 回報的相依檔案路徑是 Windows 延伸長度格式（`\\?\UNC\...`），而 Node 子行程的 `cwd` 是一般 UNC
格式，兩者被判定為不同的根目錄，因此會失敗：

```
Error: Cannot depend on path (\\?\UNC\...\tsconfig.json) outside of root directory (\\...)
```

所以 `dev` 與 `build` 都加上了 `--webpack`。若之後把專案搬到本機磁碟（例如 `C:\`）或在 CI 上執行，
改用速度更快的 `npm run dev:turbopack` / `npm run build:turbopack` 即可。

同一個網路磁碟還會造成另一個症狀：開發模式下偶爾會在 console 看到沒有堆疊的
`SyntaxError: Invalid or unexpected token`。用 CDP 抓出來的失敗腳本是
`/_next/static/chunks/app/layout.js`，長度剛好是 64KiB 的倍數減 4（65532、131068、196604），
也就是這個 chunk 在 64KiB 邊界被截斷送出，瀏覽器解析到斷點就報錯。這是網路磁碟讀取的問題，
與頁面程式碼無關，正式建置（`npm run build`）不會出現。

## 後續工作

- 接上 Supabase 與 LINE 登入（規劃見上方「部署規劃」，資料層的接縫在 `src/lib/storage.ts`）
- LINE Messaging API 的推送端點：由後端保管 token，在每日紀錄完成時送圖片到設定的群組
- 分享關係的後端實作：以 LINE 邀請連結建立關聯（見「部署規劃」），`/shared` 改為讀取 API 而非本機資料
- PWA 與離線支援
- 搜尋與標籤
- 提醒通知
