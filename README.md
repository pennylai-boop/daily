# 天天 daily

> 提供他人記錄每日的目標與定期事項內容。

- 產品中文名稱：天天
- 產品英文名稱：daily
- 產品網域：daily.introvista.ai
- 使用地區：台灣（繁體中文）

這個 repo 目前是**前端**實作。所有資料都存在瀏覽器的 `localStorage`，尚未接上後端。

## 快速開始

```bash
npm install
npm run dev
```

開啟 http://localhost:3000 。第一次進入是空白的，可以直接開始寫今天的紀錄。

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
| 主導覽 | 底部四個分頁：日曆／定期事項／回顧／卜卦 | 左側欄七個項目 |
| 其餘項目 | 左上角選單鍵拉出側邊抽屜，內容和桌機側欄相同 | 都在左側欄 |
| 設定 | 右上角頭貼進入（只保留頭像），或從側邊抽屜 | 左側欄「設定」 |
| 支持 | 右上角橘色愛心，或從側邊抽屜（iOS App 內隱藏；見「包成 App」） | 左側欄「支持」 |
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

### 每天打氣小語（畫面最上方）

`src/lib/pep-talk.ts` 預設收了 **250 則**較長的雞湯金句（起步、持續、休息、接納、難關、覺察、
小勝利、身體、關係、勇氣，並補上常見勵志長句的改寫）。語氣像旁邊的人慢慢說完一句，不預設處境。

彈層在 `AppShell` 最上方貼齊（`sticky`，上下不額外留空）：

- **點太陽** → 隱藏；可在「設定 → 打氣小語」重新開啟
- **點句子** → 立刻換下一則；否則約 12 秒自動換
- **設定頁**可瀏覽、搜尋、新增、修改、刪除全部金句，也可一鍵還原預設

第一則在瀏覽器掛載後才抽（`useSyncExternalStore`），避免 hydration 落差；換句靠 `key` 重播
`.pep-fade-in`。沒有 `aria-live`：陪襯句子不應每十秒打斷螢幕閱讀器。

### 日曆檢視（`/`）

月曆以週日為每週第一天。當天有紀錄時，格子中央會顯示該天心情的**表情圖樣**（自訂心情則是上傳的小圖）；
只寫了內容但沒選心情的日子顯示一個小圓點。格子下緣的細線是當天定期事項的完成度。右側面板可以直接點選
今天的心情，並勾選今天該做的定期事項 —— 需要書寫的事項各佔一列並帶箭頭（點下去到紀錄頁填寫），
只打勾的事項則和紀錄頁一樣三欄並排。

標題列右上角是「寫今天的日記」（已經寫過就變成「繼續寫今天」），日曆頁最常做的事不必先往下滑到右側面板。
日期後面只跟著一條 `CompletionLegend`（一小段橘線＋「定期事項完成度」）。原本那張列出六種心情表情的
圖例卡片已經移除：右側的心情選擇器本來就把六種表情連名字一起列出來，同一份資訊講兩次只是多佔一屏。

**定期計畫的完成百分比分三個尺度看**：

| 尺度 | 位置 | 範圍 |
| --- | --- | --- |
| 每天 | 日期格子下緣的細線（hover 顯示「40%（2/5）」） | 那一天 |
| 每週 | 月曆最右邊多出來的「週」欄，每一列一個百分比 | 該列的週日到週六 |
| 每天／每週／每月 | 月曆下方「預定計畫完成度」的三個環狀圖 | 今天、本週、**正在看的那個月** |

三個尺度共用 `completion(state, from, to)`（`src/lib/stats.ts`），分母是「該做的次數」——同一個事項每次
該做都算一次。兩個刻意的決定：

- **未來的日子不計入**：區間結尾會被截到今天，否則月初看整個月永遠是 5%，只會讓人不想打開。
- **沒有排定的區間顯示「—」而不是 0%**：「這週沒安排」和「安排了但都沒做」是完全不同的兩件事。

### 定期事項就是書寫的來源（`/routines`）

頁面標題只留「定期事項」＋一顆小 i（`InfoHint`）＋右對齊的「新增事項」，整個標題區壓成一行。
原本那段兩行的說明文字只需要看一次，卻永遠佔著第一屏；點小 i 才展開，桌機是圖示下方的浮層、
手機是浮在底部導覽上方的小卡（浮層以圖示為中心定位的話，圖示靠邊時會被切掉）。

**記錄格式不是獨立的選單，而是定期事項的一個屬性。** 每個事項可以選一種格式：

| 格式 | 內容 |
| --- | --- |
| ✅ 只打勾 | 不需要書寫，完成時打勾即可（例如喝水、運動） |
| ✍️ 日記 | 標題（可留空）＋ 自由書寫 |
| ❤️ 五感恩 | 五列感謝的事；不夠寫可以按「再加一項」往下加，第六列起可個別刪除 |
| 💭 觀心書 | 身（做的）／口（說的）／意（想的）三段，每段可加入 ＋做得好、－要調整、→待做三種條目 |

重複頻率有四種：每天、每週（指定星期）、每月（指定日期）、每隔 N 天（指定起算日）。
首次使用會預設帶入「五感恩」（每天）、「觀心書」（每週日、週三）與「寫日記」（每天）三個事項。

清單上一列就是一個事項：名稱、格式、今天要不要做、頻率與備註全部擠在同一行（只有「每天」兩個字
還要多佔一整列太浪費），右側是近 30 天完成率與編輯／封存／刪除。**點卡片任何一處都會進入該事項的
統計頁**；卡片裡有按鈕，不能整張包成 `<a>`，所以是一個覆蓋整塊的連結（`absolute inset-0`），
按鈕再用 `relative z-10` 疊回上層。原本每列的「填寫」按鈕拿掉了 —— 要填寫從日曆或當天的紀錄頁進去
更直覺，這裡是管理設定的地方。

### 事項統計（`/routines/[id]`）

單一事項的完成情況，由上到下：

| 區塊 | 內容 |
| --- | --- |
| 三張數字卡 | 目前連續、最長連續、累積完成（單位是「次」而不是「天」） |
| 完成月曆 | 每一天：完成的日子放事項本身的 emoji，該做沒打勾是虛線圈，沒排定是小圓點；有書寫格式的事項會在 emoji 下面標當天字數。可以翻月份，右上角的環是該月完成率。點格子跳到那一天 |
| 完成率折線 | 依區間（一週到全部）看趨勢 |
| 書寫量折線 | 只有設了記錄格式的事項才會出現，數值是這個事項寫下的字數 |
| 星期分布 | 這段期間在星期幾比較做得到 |
| 每月統計表 | 從正在看的月份往回六個月的該做／完成／完成率 |

兩個計算上的決定（`src/lib/stats.ts`）：

- **連續只看「該做的日子」**。每週兩次的事項連兩週做滿算 4 次，不會因為中間本來就不用做的日子被
  判定中斷。**今天該做但還沒打勾不算斷**，這一天還沒過完。
- **往回找的下界取「事項建立日」與「最早的打勾紀錄」較早的那一個**。示範資料與匯入的備份會有比
  建立時間更早的紀錄，只看建立時間會把連續天數硬生生截斷。

月曆上還沒到的日子畫得比漏掉的日子更淡：月初打開時整個月都是虛線圈的話，看起來像全部沒做。

### 每日紀錄（`/entry/[date]`）

當天排定的定期事項按「要不要書寫」分成兩種排法 —— 每個事項各佔一張整寬卡片時，
光是「今天要做什麼」就吃掉整個螢幕。頻率與備註都移到 tooltip，畫面上只留看得懂的名字。

| 種類 | 排法 | 為什麼 |
| --- | --- | --- |
| 有書寫格式（日記、五感恩、觀心書） | 一排會自動換行的小方框，寬度隨名字長度 | 打勾後要在下方展開對應欄位，排成固定欄數會看不出勾了哪一個對應哪一段 |
| 只打勾（喝水、運動…） | **三欄並排的格狀**（`RoutineCheckGrid`） | 就是一個名字加一個勾，各佔一整列只是把畫面拉長 |

格狀的欄數用**容器查詢**（`@container` / `@3xs:`）而不是螢幕寬度斷點決定：同一個元件會出現在紀錄頁的
寬欄（約 768px）與日曆頁桌機版的窄側欄（約 285px），用 `sm:` 這類斷點一定會有一邊排壞。容器窄到
256px 以下才退回兩欄。方框與 emoji 也和名字分成兩行，名字才拿得到整格寬度 —— 和方框並排時，
「喝滿 2000ml 水」在窄格子裡只剩 45px 可用，會被截成「喝滿 20…」。

**打勾有設定格式的事項，就會在下方展開對應欄位讓你填寫**（`RoutinePanel`），
取消打勾時如果已經寫了東西，欄位會留著不讓內容消失。沒有排定但設了格式的事項會出現在
「其他書寫格式」，隨時可以臨時加寫一段。另外有「當日目標」的勾選清單，對應產品目的中的「每日的目標」。

「定期事項」、「其他書寫格式」、「其他紀錄」這幾段的標題都可以點下去收合，寫完之後把畫面收乾淨。
收合狀態刻意不記在 `localStorage`：它是「現在想不想看這一段」的即時操作，不是使用者設定。

編輯內容會在停止輸入約 0.6 秒後自動儲存；若一天完全沒有內容，該筆紀錄會自動移除，不會在日曆上留下痕跡。
寫不進去時（例如照片把 `localStorage` 塞滿）標題下方會直接顯示「裝置儲存空間不足」，而不是假裝存好了。
頁尾右側的「分享成圖片」會把當天的紀錄畫成一張整頁 PNG（含心情圖示與照片），手機上透過 Web Share API
可以直接傳到 LINE，桌機則退回下載檔案。

#### 心情放在日期旁邊，也可以自己新增

心情不再是一張獨立的卡片，而是日期同一列的一顆按鈕。還沒選過的日子顯示預設的「🙂 開心」，
點下去才展開選擇器（手機從底部升起，桌機是日期下方的浮層）。

預設心情只有在**這天真的有內容時**才會寫進資料（`entry-editor.tsx` 的自動儲存），
所以只是翻到某一天看一下，不會在日曆上留下一顆假的笑臉。

選擇器最後一格是「＋ 新增」，可以建立自訂心情：

- **圖示**：上傳圖片（置中裁成正方形、縮到 96px 的 PNG）或填一個表情符號，兩者取其一
- **名稱**：最多 6 個字，會顯示在日曆與統計裡
- **程度**：很好／好／普通／不太好／低落，換算成趨勢圖的 1–5 分與日曆上的顏色
  （見 `MOOD_LEVELS`）。這樣使用者不用直接面對「分數」或選色盤

自訂心情的 id 一律是 `custom:` 開頭，所以和內建的九種不會撞名；刪除自訂心情時，
用過它的日子會一併改回「沒有心情」，避免日曆上出現解不到的空格。
別人分享過來的紀錄如果用了他自己的自訂心情，這邊解不到，會退回顯示一個圓點。

#### 照片紀錄

頁面最下方是「照片」，一天最多 6 張。上傳時就在瀏覽器裡壓縮（長邊 1280px、JPEG 品質 0.72，
一張大約 100–200KB，見 `src/lib/images.ts`），並顯示目前佔用的容量。

**這個上限是 `localStorage` 逼出來的**：整個網域只有 5MB 左右，原尺寸的手機照片一張就吃光了。
接上 Supabase Storage 之後，`images.ts` 只需要改成上傳並存 URL，這個限制就可以放寬。

觀心書的條目存成一個扁平陣列（`MindfulnessItem`），每筆帶著 `channel`（身／口／意）與 `mark`
（`plus` / `minus` / `todo`），呈現時再依身、口、意分組。這樣新增、刪除、改順序都只是動一個陣列，
也不必為三個面向各開一個欄位。

新增格式的方式：在 `src/lib/types.ts` 增加 `TemplateId` 與對應的 content 型別，
在 `src/lib/templates.ts` 補上 metadata 與 `createEmptyContent`、`summarizeBlock` 等分支，
最後在 `src/components/entry/block-editor.tsx` 加上欄位。TypeScript 的 discriminated union 會提示所有
需要補齊的地方。

### 回顧（`/insights`）

上方是連續天數、最長連續、累積天數與書寫段落數，四張數字卡一律並列一行（手機也不折成 2×2，
`StatTile` 的留白與字級在小螢幕自動縮一號）：這四個數字是同一組指標，一眼掃完比排得漂亮重要。
接著可以切換統計區間
（一週／2週／一月／一季／6個月／1年／3年／全部），下方圖表會跟著變動：

- **書寫量比較**：三種記錄格式各自的字數，一格式一條曲線
- **區間完成率**：各定期事項在這段期間的累計完成比例
- **定期事項完成率比較**：一事項一條曲線，只計算該做的日子
- **心情趨勢**（最下方）：心情平均分數（1–5）

區間長度會自動決定折線的顆粒度：31 天以內按日、130 天以內按週、更長則按月。

### 支持（`/support`）

贊助頁。金額可以按 100／300／500／1000 快選，也可以直接填任意數字；付款方式在信用卡、ATM 轉帳、
超商代碼之間選一種（各自的金額上下限依 PAYUNi 規定，超出範圍會在送出前就擋下來）。
發票有雲端發票、手機條碼、捐贈、公司統編四種，品名固定「贊助天天 daily」。

付款由統一金流 PAYUNi 的整合式支付頁處理，卡號不經過本站；付款成功後由速買配 SmilePay 開立發票。
串接細節見下方「贊助金流」。

### 數字卜卦（`/divination`）

《梅花易數》的數字起卦法（`src/lib/hexagram.ts`）。分成四步：**先讀懂 → 想問的事 → 起卦 → 結果**，
上方有步驟指示器。

**第一步刻意擋在前面。** 直接給輸入框的話，很容易變成「問到滿意為止」的抽籤機。所以先講三件事：
卦不幫你決定、只是給糾結的心一個可以靠著想的東西；算的是此刻的天時地利人和，所以一卦大約看
接下來三個月；卦象不理想不是判決，三個月後可以再問。下面接兩張：**三不占**（不誠、不義、不疑）
和**怎麼問才有參考價值**（情緒滿的時候先別問、事後回頭對照紀錄、可以當每天的練習）。
「我了解了，開始卜卦」排在這幾張說明卡之後才出現——讀完才動手，是這一步存在的理由，
按鈕夾在中間就會被跳過。

**想問的事**可以打字，也可以按「語音輸入」用說的（`src/lib/speech.ts`、
`src/components/voice-input-button.tsx`）。Web Speech API 只有 Chrome／Edge／Safari 支援，
不支援的瀏覽器整顆按鈕不出現——留一顆按了沒反應的鈕比沒有更糟。下面另外給三個範例問句可以直接套用。

**起卦**是 9 個數字，每格一位數、三個一組：前 3 個算上卦、中 3 個算下卦、後 3 個算動爻。
畫面上不解釋規則，破折號的分組就是提示，各格的 `aria-label` 會念出「上卦第 1 個數字」。
按下「開始起卦」後六爻由下往上一爻一爻浮出來（`src/app/divination/hexagram-lines.tsx`）；
起卦算法前後端共用同一份，所以動畫畫的就是真正那一卦，不是佔位的假圖。動畫跑完才切到結果，
API 比動畫快也會等它畫完。

**結果**把本卦與變卦並排畫出來、標出動爻，再接 Gemini 的解讀（`src/server/divination.ts`）。
沒設定 `GEMINI_API_KEY` 時只會在伺服器印出提示詞、不會回傳解讀。

標題旁的小 i 說明的是「這是什麼、適合問什麼」，不是操作步驟。

#### 額度

卦的效期大約三個月，免費額度就照同一個節奏：**每三個月一次免費**，同一輪裡想再問要用點數
（規則在 `src/lib/divination-quota.ts`，狀態存在 `DailyState.divination`）。額度只在 AI 解讀成功
之後才扣，起卦失敗或解讀失敗不算。額度用完時仍然看得到上一次問的問題與解讀。

#### 點數與兌換碼（`/divination/credits`）

點數用**兌換碼**發，不綁帳號。這裡沒有可驗證的使用者身分可以掛帳：日記都在 localStorage，
LINE 登入目前只在 LINE App 內有效（`src/lib/line-auth.ts`），瀏覽器使用者沒有身分可言。

所以餘額記在伺服器（`divination_credit_codes`），兌換碼是領用的憑據：

1. 選方案、填信箱與發票資訊、走 PAYUNi 付款（`/api/divination/credits/checkout`）。訂單沿用
   `sponsor_orders`，只多一個 `product` 欄位區分贊助或點數，金流、Notify、寄信都是同一條路。
   **金額一律由伺服器依方案算，不看前端傳來的數字。**
2. 付款成功後 Notify 開發票、發一組 12 位兌換碼並寄到信箱（`src/server/credit-codes.ts`）。
   一筆訂單只發一組，Notify 被重送也不會多給點數。
3. 使用者在 `/divination/credits` 輸入兌換碼，`/api/divination/credits` 查到餘額後記在本機。
4. 用點數起卦時把碼一起送去 `/api/divination`，**扣點在伺服器做**，前端動不了餘額。
   扣款排在 AI 解讀成功之後：解讀失敗還扣一點等於收了錢沒給東西。

這樣換手機或清掉瀏覽器資料之後，重新輸入信件裡的同一組碼就能接回剩下的點數。
扣點走 Postgres function `consume_divination_credit`，帶 `credits_used < credits` 條件更新，
所以同時進來兩個請求不會把同一點用兩次。

剩餘點數常駐在手機版右上角與桌機側欄（`src/components/points-badge.tsx`），一點卜一次。
只有跟卜卦有過關係的人才看得到它——綁過兌換碼、有點數，或卜過卦；
從來不用卜卦的人不需要在每一頁看到一個餘額。

**價格在 `src/lib/divination-credits.ts` 的 `CREDIT_PACKS`，要調整只改那一份。**
買得越多每點越便宜，「最划算」的標記由 `BEST_VALUE_PACK_ID` 依單價自己算出來，不用手動標。
金額受 PAYUNi 的支付工具限制：超商代碼上限 20,000、ATM 上限 49,999，
所以 30,000 的旗艦只能刷卡，畫面上會依選的付款方式把不能用的方案換成說明文字。

| 方案 | 金額 | 點數 | 每點 |
| --- | --- | --- | --- |
| 輕量 | 300 | 6 | 50.0 |
| 入門 | 500 | 12 | 41.7 |
| 標準 | 1,000 | 30 | 33.3 |
| 進階 | 10,000 | 500 | 20.0 |
| 旗艦 | 30,000 | 2,000 | 15.0 |

#### 電子發票（SmilePay 速買配）

贊助不開發票（不是商品銷售），購買點數會開。發票走 SmilePay、金流走 PAYUNi，
是兩套完全不同的憑證（`SMILEPAY_GRVC`／`SMILEPAY_VERIFY_KEY` 對 `PAYUNI_*`），規格見
`docs/smilepay-api.md`。支援雲端發票、手機條碼載具、愛心捐贈與公司統編四種
（型別與驗證在 `src/lib/invoice.ts`，前後端共用同一份規則）。

發票資訊在**建立訂單時**就收下來存進 `sponsor_orders.invoice`（jsonb）：PAYUNi 的回傳只帶訂單編號，
等 Notify 回來才開票，那時候前端早就離開頁面了。開票在確認付款成功之後（`src/server/smilepay-invoice.ts`），
`data_id` 與 `orderid` 都填 MerTradeNo，所以同一筆訂單重複開會被 SmilePay 以 `-10072` 擋掉。

**開票失敗不影響點數入帳**：錢收了、點數要給，發票晚一點補開。失敗原因記在 `invoice_error`，
migration 建了對應的部分索引，可以直接撈出「收了錢但沒開票」的訂單。

免費額度則是記在瀏覽器，只擋得住一般使用：`/api/divination` 沒有身分驗證，
清掉瀏覽器資料就會重新拿到免費額度。要真的擋住得先有伺服器端的身分。

### 被分享紀錄（`/shared`）

別人在 LINE 上邀請你、你按下接受之後，他的紀錄就會出現在這裡。每個人一張卡片，下面列出可查看的日子，
點開就是唯讀的內容（`src/components/entry/block-reader.tsx`）。若對方的分享範圍是「只看心情」，
就只顯示心情，不顯示書寫內容。

目前資料放在 `DailyState.sharedWithMe`，由示範資料填入以呈現畫面；正式版要改成由後端依接受過的邀請回傳。

### 設定（`/settings`）

- **帳號**：只支援 LINE 登入。未登入顯示「用 LINE 登入」；已登入可改顯示名稱並登出
  （日記資料仍留在本機）。手機從右上角頭貼進入此頁。
- **常傳的 LINE 對象**：把常傳的群組或個人記成一份名單。紀錄頁按「分享成圖片」時會先列出這份名單
  讓你挑一個並確認，送出後記下使用時間，最近用過的排前面。
- **分享給誰看**：用 LINE 送出邀請。每張邀請可獨立設定「完整內容」或「只看心情」，
  對方接受前顯示邀請碼、可以再分享一次或複製連結，接受後換成對方的 LINE 身分。
- 外觀切換、JSON 匯出與匯入。

### 邀請頁（`/invite/[code]`）

邀請連結的落地頁。正式流程是對方用 LINE 登入、後端比對邀請碼後建立關聯；後端接上之前，
這一頁只認得同一個瀏覽器裡建立的邀請，並提供「模擬接受」用來預覽接受之後的樣子。

分享的識別為什麼不用 email、`liff.shareTargetPicker()` 怎麼接，見下面的「部署規劃」。

### 為什麼不做自動推送

送出一律走「分享成圖片 → 系統分享面板 → LINE」，由使用者按下按鈕才發生，不做排程推送。

技術上，Messaging API 的 channel access token 不能放在瀏覽器，前端也無法直接呼叫 `api.line.me`，
所以自動推送一定要有後端加上 Cloud Scheduler。但決定性的理由是成本：push 的計費單位是
**收得到訊息的人數**，推一個 5 人群組算 5 則，每天推一次就是每月 150 則；台灣免費方案每月
只有 200 則，而且免費與中用量方案都不可加購，額度用完 API 直接回錯誤、訊息就是發不出去。
相對地，從使用者自己的 LINE 帳號送出的訊息不計入官方帳號額度，無限免費。

代價是不能自動化，所以改成「先選對象再確認送出」把手動流程做順：對象名單存在
`settings.line.targets`，紀錄頁的 `ShareTargetPicker` 負責挑選與確認。要注意名單只記名字，
瀏覽器沒有辦法把訊息直接投進指定的群組，最後一步仍然是 LINE 自己的選擇畫面。

之後若真的需要定時提醒，用原生推播（APNs／FCM）或 Web Push 不按則數計費，比走 LINE 划算。

## 技術結構

Next.js 16（App Router）、React 19、TypeScript、Tailwind CSS v4。

```
src/
├─ app/                    路由（日曆、記錄、定期事項＋單項統計、回顧、支持、被分享紀錄、設定）
│  ├─ */page.tsx           伺服器元件，只負責 metadata 與載入同層的 *-screen.tsx
│  ├─ */*-screen.tsx       各頁真正的畫面，標了 "use client"
│  ├─ api/support/         贊助的 Route Handler：checkout / notify / return
│  ├─ icon.svg             品牌標記＝favicon，太陽造型
│  ├─ apple-icon.tsx       iOS 主畫面圖示，用 next/og 產生 180×180 PNG
│  └─ manifest.ts          網頁版「加到主畫面」的 PWA manifest
├─ components/
│  ├─ app-shell.tsx        桌機側邊欄 + 手機底部導覽與側邊抽屜
│  ├─ pep-talk-banner.tsx  頂部貼齊的打氣小語彈層（點太陽隱藏）
│  ├─ service-worker.tsx   註冊 public/sw.js（只在正式建置）
│  ├─ calendar/            月曆、每週完成率與完成度圖例
│  ├─ charts/              多曲線折線圖與完成度環（自繪 SVG，無圖表套件）
│  ├─ entry/               心情選擇、目標清單、照片、各格式的編輯欄位與唯讀呈現
│  ├─ routines/            定期事項清單、表單、當日清單與只打勾事項的並排格狀
│  └─ ui/                  Button / Field / Card / RangeTabs / Segmented / InfoHint 等基礎元件
├─ server/                 只在伺服器端執行，含金鑰，不可被 client component 匯入
│  ├─ payuni.ts            PAYUNi 加解密、UPP 請求組裝、回傳驗簽
│  ├─ smilepay-invoice.ts  SmilePay 電子發票開立
│  └─ support-orders.ts    贊助訂單暫存（接 Supabase 的接縫）
└─ lib/
   ├─ types.ts             領域模型
   ├─ support.ts           贊助的金額限制、發票類型與前後端共用驗證
   ├─ date.ts              本地時區的日期工具與月曆格線
   ├─ moods.ts             內建九種心情與自訂心情的解析、色票與分數
   ├─ images.ts            上傳圖片的壓縮（心情圖示 96px、照片 1280px）
   ├─ templates.ts         三種記錄格式的定義
   ├─ routines.ts          重複頻率的判斷、描述與預設事項
   ├─ stats.ts             連續天數、心情分布、任意區間與單一事項的完成度
   ├─ pep-talk.ts          預設打氣小語與隨機抽選
   ├─ series.ts            統計區間、時間分桶與折線圖資料
   ├─ share-image.ts       Canvas 繪製分享圖片
   ├─ platform.ts          判斷執行環境是瀏覽器／iOS App／Android App
   ├─ native-bridge.ts     原生殼的分享橋接（WebView 沒有 Web Share API）
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
- **讀取時就地升級舊資料**（`normalizeState`，`STORE_VERSION = 4`）。v1 的觀心書是五個問答，改成身／口／意
  的條列之後，舊內容會轉成一則標題為「觀心書（舊格式）」的日記，文字一個字都不會掉；v3 以前沒有照片與
  自訂心情，讀進來時補成空陣列。壞掉的自訂心情（沒有名稱，或既沒 emoji 也沒圖）會被丟掉，
  否則畫面上會出現按不出東西的空白格。
- **寫入失敗要往上回報**（`storage.ts` 的 `saveState` 回傳 boolean）。照片會讓 `localStorage` 逼近上限，
  安靜吞掉例外會讓使用者以為存好了；`store.ts` 的 `commit` 失敗時會把記憶體中的狀態回捲，
  畫面才不會顯示一份重開就消失的資料。
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
| `SUPABASE_SECRET_KEY` | 只在伺服器 | 繞過 RLS 的操作（比對分享關係）、註冊 custom provider |
| `SUPABASE_DB_URL` | 只在本機／CI | 跑 migration，Cloud Run 請用 pooler 的 6543 埠 |
| `LINE_LOGIN_CHANNEL_ID`、`LINE_LOGIN_CHANNEL_SECRET` | 只在本機 | 跑一次性的 `createProvider` 腳本 |
| `NEXT_PUBLIC_LIFF_ID` | 前端 | 叫出 LINE 的好友選擇畫面來發邀請 |
| `LINE_MESSAGING_CHANNEL_SECRET`、`LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` | 只在伺服器 | 驗 webhook 簽章；目前不做推送，先保留 |

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

專案 ID：`daily-506100`，區域：`asia-east1`。映像放在
`asia-east1-docker.pkg.dev/daily-506100/daily/web`。

- `NEXT_PUBLIC_*` 是**建置期**就被寫進 bundle 的，所以要在 Cloud Build 階段（substitutions 或
  `--build-arg`）提供，光在 Cloud Run 設執行期環境變數不會生效。
- 容器必須監聽 Cloud Run 注入的 `PORT`（Dockerfile 預設 `8080`）。
- 建置用 `npm run build`（Webpack）；`--turbopack` 在這台網路磁碟上會失敗，原因見下一節。

首次／更新部署：

`NEXT_PUBLIC_LIFF_ID` 一定要跟著 `--build-arg` 進去。`.dockerignore` 擋掉了 `.env`，
漏帶的話編出來的 bundle 裡它是空字串，正式站的 LINE 登入會一直回「目前只能用 LINE 登入」。

```bash
gcloud config set project daily-506100
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions _LIFF_ID=<LIFF ID>
gcloud run deploy daily \
  --image asia-east1-docker.pkg.dev/daily-506100/daily/web:latest \
  --region asia-east1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=daily-506100,GCP_REGION=asia-east1"
```

服務 URL（自動產生）：https://daily-946947125216.asia-east1.run.app  
正式網域 `daily.introvista.ai` 已經綁好並對外服務，`NEXT_PUBLIC_SITE_URL` 要跟它一致——
PAYUNi 的 ReturnURL／NotifyURL 是用這個值組出來的，指錯網域付款就永遠不會被確認。
PAYUNi／SmilePay 等機密請放 Secret Manager，再掛到 Cloud Run，不要烤進映像。

## 贊助金流：PAYUNi 付款 + SmilePay 發票

「支持」頁是全站唯一需要伺服器的功能。金流走統一金流 PAYUNi 的整合式支付頁 UNiPaypage (UPP)，
發票走速買配 SmilePay，兩套憑證各自獨立、不可混用。規格文件在
[`docs/PAYUNi_API_金流物流串接資料.md`](docs/PAYUNi_API_金流物流串接資料.md) 與
[`docs/smilepay-api.md`](docs/smilepay-api.md)，環境變數見 [`.env.example`](.env.example)。

流程：

1. `POST /api/support/checkout`：伺服器重跑一次 `src/lib/support.ts` 的驗證（前端的驗證只是即時提示），
   產生 `MerTradeNo`，把表單內容存進 `src/server/support-orders.ts`，回傳 `EncryptInfo` / `HashInfo`。
2. 瀏覽器用一張隱藏表單把這些欄位 POST 到 PAYUNi 的付款頁（UPP 規定由前端送出），卡號不經過本站。
3. `POST /api/support/notify`（NotifyURL）：交易結果的唯一可信來源。驗簽、解密、確認金額與建立訂單時
   一致之後才標記已付款，接著呼叫 SmilePay 開票。
4. `POST /api/support/return`（ReturnURL）：只把結果整理成 query string 導去 `/support/result` 顯示。

實作上的重點：

- **加解密**：`EncryptInfo` 是把參數組成 query string 後以 AES-256-GCM 加密，密文與 authTag 用 `:::`
  串起來再轉 hex；`HashInfo` 是 `SHA256(HashKey + EncryptInfo + HashIV)` 全大寫。因此 HashKey 必須 32 字元、
  HashIV 必須 16 字元，長度不對時 `payuniConfig()` 會直接視為未設定。`src/server/payuni.ts` 的實作已用文件
  附的官方測試向量（`MerID=AAA&MerTradeNO=BBB&Prod=商品說明`）比對過，加密、雜湊、解密三者都相符。
- **回傳一律驗簽**：`parsePayuniCallback` 重算 `HashInfo` 並用 `timingSafeEqual` 比對，不符就丟掉。
  結果頁的內容來自 query string，只用來顯示，不會拿它改任何狀態。
- **金額上下限**：信用卡 1–199,999、ATM 15–49,999、超商代碼 30–20,000（PAYUNi「交易訂單金額限制說明」）。
- **開票時機**：只有 `Status=SUCCESS` 且 `TradeStatus=1` 才開票。ATM 與超商是先取號（`TradeStatus=0`），
  要等實際入帳的那一次 Notify。`data_id` 與 `orderid` 都填 `MerTradeNo`，SmilePay 會用它擋重複開立。
- **`DonateMark` 是必填**：非捐贈時也要明確傳 `"0"`，否則 SmilePay 回 `-10044`。
- **未設定憑證時不會壞掉**：`/support` 會顯示「金流尚未設定」並停用送出，設定了 PAYUNi 但沒設定 SmilePay
  時，付款照樣完成，只是不自動開票（伺服器日誌會留下訂單編號）。
- **訂單暫存還沒有資料庫**：`src/server/support-orders.ts` 目前是行程內的 Map，重啟或 Cloud Run 擴出第二個
  實例就查不到訂單，後果是那一筆不會自動開票（款項仍在 PAYUNi 後台，可手動補開）。上線前要把這個檔案換成
  Supabase 的資料表，呼叫端不需要改。

## 包成 App：iOS／Android 的 WebView 殼

這個網站同時是三種東西：一般網頁、iOS App、Android App。App 用原生殼載入同一個網址，
內容與網頁版完全相同，因此不需要第二套前端；但 WebView 少了一些瀏覽器 API，
商店也有自己的規則，需要下面這些約定。

### 判斷執行環境

`src/lib/platform.ts` 的 `platformBootstrapScript` 會在首次繪製前把 `web` / `ios` / `android`
寫進 `<html data-platform>`，React 這邊用 `usePlatform()` 讀同一個值。依序看四個來源：

1. `window.dailyNative.platform` —— 原生殼注入的橋接物件，**建議用這個**，SPA 換頁也不會掉
2. 網址的 `?platform=ios|android` —— 給手動測試用（存在 sessionStorage，不會污染真的瀏覽器）
3. User-Agent 含 `DailyApp` —— 殼可以在原本的 UA 後面接 `DailyApp/1.0`
4. 都沒有就是 `web`

要在瀏覽器裡預覽 App 的樣子，開 `http://localhost:3000/?platform=ios` 就好。

### 分享要交給原生

`navigator.share` 在 Android WebView 完全不存在，iOS WKWebView 也不穩，blob 連結的下載同樣不會動，
而「把當天紀錄輸出成圖片傳到 LINE」是這個 app 的主要功能，所以殼必須實作
`src/lib/native-bridge.ts` 定義的橋接：在 document start 注入 `window.dailyNative`，
提供 `share(payloadJson)`，參數是字串（Android 的 `addJavascriptInterface` 只能傳字串），
iOS 端可在注入的 JS 裡轉呼叫 `window.webkit.messageHandlers`。payload 長這樣：

```json
{ "kind": "image", "fileName": "daily-2026-08-19.png", "title": "天天 daily｜…", "dataUrl": "data:image/png;base64,…" }
{ "kind": "text", "title": "天天 daily", "text": "…邀請訊息…", "url": "https://…/invite/AB12CD" }
```

回 `false` 表示不支援，網頁端會退回 Web Share API 或下載；沒實作橋接時網頁版行為完全不變。
另外 `openExternal(url)` 用來把外部網址丟到系統瀏覽器 —— 第三方頁面（銀行 3D 驗證、OAuth）
在 WebView 裡常被擋，一律不要留在 WebView 內開。

### iOS App 內不顯示「支持」

App Store 規則 3.1.1 要求 App 內的付款走 IAP，3.2.2(iv) 則說非 Apple 核准的公益團體不得在 App 內收款、
只能在 App 之外（例如 Safari）進行；規則同時禁止放任何「導向 IAP 以外付款方式」的按鈕、連結或行動呼籲。
IAP 又只能賣固定價格檔次、開不出台灣的電子發票，跟「任意金額贊助 + SmilePay 發票」不相容。

所以 iOS App 內把整個贊助入口藏起來：`globals.css` 的 `.hide-in-ios-app` 隱藏導覽項目與
`/support` 的表單，`/support` 改顯示一張中性的提示卡（文案刻意不提付款或網頁版），
`SupportScreen` 的送出也直接擋掉。用 CSS 而不是 React 條件式，是為了在 hydration 前就生效、
不會閃出不該出現的東西。Android 這邊不受影響：Google Play 的付款政策把捐贈與 P2P 轉帳列為例外，
贊助不解鎖任何功能，可以照走 PAYUNi。

### PWA 與離線

`src/app/manifest.ts` 提供網頁版「加到主畫面」的資訊；上架版本的圖示與名稱由原生專案各自設定。
`public/sw.js` 負責離線：頁面先連網、失敗才用快取，`/_next/static` 走快取優先，
`/api` 與 `/support` 完全不快取（金流結果必須即時）。資料本來就在 localStorage，
因此外殼載得起來就能離線寫紀錄。service worker 只在正式建置註冊
（`src/components/service-worker.tsx`），開發模式的 chunk 網址會一直變，快取住只會拿到過期檔案；
要驗證離線行為請跑 `npm run build && npm start`。改 `sw.js` 時記得同時改裡面的 `VERSION`。

### 上架前還沒做的

- **資料還在 localStorage**。網頁版重開沒問題，但 App 被系統清資料或重裝就整份消失，
  必須先接上 Supabase（見「部署規劃」）。照片更是急，5MB 的配額大概只夠幾十張壓縮過的照片。
- **LINE 登入不能在 WebView 裡跑**（LINE 會擋內嵌瀏覽器）。要改用
  `ASWebAuthenticationSession` / Chrome Custom Tabs 或原生 SDK，再用 deep link 導回 App。
- **deep link 設定檔**：同一個網址要能開 App 需要 `.well-known/apple-app-site-association`
  與 `assetlinks.json`（Universal Links / App Links）。
- **Apple 4.2 最低功能性**：純網頁殼容易被判定為「只是一個網站」，通常要補推播提醒之類的原生價值。
- **Apple 4.8**：只提供 LINE 這種第三方登入時，必須另外提供 Sign in with Apple 或 email 等等值選項。
- **Apple 5.1.1(v)**：有註冊帳號就必須能在 App 內刪除帳號。

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
- 照片與自訂心情圖示改存 Supabase Storage，只在資料庫留 URL；`src/lib/images.ts` 的壓縮可以保留，
  但一天 6 張的上限與「裝置儲存空間不足」的提示就可以拿掉
- 分享關係的後端實作：以 LINE 邀請連結建立關聯（見「部署規劃」），`/shared` 改為讀取 API 而非本機資料
- 贊助訂單改存 Supabase（取代 `src/server/support-orders.ts` 的記憶體 Map），並加上贊助紀錄與補開發票的後台
- 原生殼專案（iOS／Android）與上架前的待辦，見「包成 App」最後一段
- 搜尋與標籤
- 提醒通知：走原生推播／Web Push，不按則數計費（同時是 App Store 4.2 需要的原生價值）
