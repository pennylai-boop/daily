# SmilePay 電子發票 API 技術規格（簡化版）

> 本文件僅保留「電子發票」相關 API。金流（收單、刷卡、ATM、超商代收等）與物流（超商取貨、宅配等）已改用 **PAYUNi（統一金流）** 處理，故不再納入 SmilePay 的金流/物流 API。
> 商家代號（Grvc）與驗證碼（Verify_key）請以速買配後台實際核發的值取代下方範例值。

---

## 目錄
1. 開立發票
2. 開立折讓單
3. 發票／折讓單 作廢・註銷・取消執行
4. 列印發票／列印折讓單
5. 整合注意事項（金流／物流改用 PAYUNi）

---

## 1. 開立發票

- 正式環境：`https://ssl.smse.com.tw/api/SPEinvoice_Storage.asp`
- 測試環境：`https://ssl.smse.com.tw/api_test/SPEinvoice_Storage.asp`
- 僅支援 UTF-8 編碼，可用 **POST** 或 **GET** 傳送
- 參數共分四大區塊：使用者參數／發票資訊／商品明細／買受人資訊
- 記號：O＝必要、▲＝非必要、X＝不用填

### 使用者參數
| 參數 | 說明 |
|---|---|
| Grvc | 電子發票帳號（速買配提供） |
| Verify_key | 驗證碼（速買配提供） |

### 發票資訊（節錄重點欄位）
| 參數 | 說明 | 備註 |
|---|---|---|
| InvoiceNumber / RandomNumber | 發票號碼／隨機碼 | 僅自訂字軌時需要 |
| InvoiceDate / InvoiceTime | 開立日期／時間 | B2C限48小時內、B2B限168小時內開立 |
| TrackSystemID | 自訂字軌系統代號 | 於【字軌管理】設定後使用 |
| Intype | 發票稅率類型 | 07=一般稅額計算、08=特種稅額計算 |
| TaxType | 課稅別 | 1應稅 2零稅率 3免稅 4應稅(特種稅率) 9混合應稅免稅 |
| TaxRate | 特種稅率 | 僅Intype=08 且 TaxType=4/9 時有效 |
| BuyerRemark | 買受人註記 | 1~4，可留空 |
| CustomsClearanceMark / ZeroTaxRateReason | 通關方式／零稅率原因 | 零稅率發票必填 |
| GroupMark | 彙開註記 | 彙開發票才填 Y |
| MainRemark / RelateNumber | 總備註／相關號碼 | 選填 |
| DonateMark / LoveKey | 捐贈註記／愛心碼 | 捐贈時DonateMark=1且需填LoveKey |
| Visa_Last4 | 信用卡末四碼 | 刷卡交易填入 |
| data_id | 自訂發票編號 | 用於防止重複開立（同期別檢查） |
| orderid / PosSystemID | 自訂號碼／系統代號 | 商家自訂使用 |
| Certificate_Remark | 發票證明聯備註 | 最多34字 |

### 商品明細
多項商品以半形 `|` 分隔，各欄位項目數須一致。

| 參數 | 說明 |
|---|---|
| Description / Quantity / UnitPrice / Unit / Remark | 品名／數量／單價／單位／備註明細 |
| ProductTaxType | 混合稅率(TaxType=9)時各項稅別必填 |
| Amount | 各明細總額＝數量×單價 |
| AllAmount | 總金額（含稅，各明細加總） |
| SalesAmount / FreeTaxSalesAmount / ZeroTaxSalesAmount | 混合稅率時的應稅/免稅/零稅率銷售額 |
| UnitTAX | 單價是否含稅，Y含稅(預設)／N未稅 |
| TaxAmount | 稅金，僅B2B發票生效 |

### 買受人資訊
| 參數 | 說明 |
|---|---|
| Buyer_id | 買受人統編：有值＝開B2B發票，空值＝開B2C發票 |
| CompanyName / Name | 公司名稱／個人姓名 |
| Phone / Facsimile / Email / Address | 聯絡資訊 |
| CarrierType | 載具類型：EJ0113速買配載具／3J0002手機條碼／CQ0001自然人憑證 |
| CarrierID / CarrierID2 | 載具明碼／暗碼 |

### 開立規則對照
| 買受人類型 | 捐贈 | 愛心碼 | 載具類型/ID | 統一編號 |
|---|---|---|---|---|
| 個人捐贈 | 填1 | O | X | X |
| 個人載具 | 填0 | X | O | X |
| 公司統編發票 | 填0 | X | X | O |

### 回應 XML 範例
```xml
<SmilePayEinvoice>
<Status>0</Status>
<Desc></Desc>
<Grvc>SEI1000002</Grvc>
<orderno>order20171231</orderno>
<data_id>inid00001</data_id>
<InvoiceNumber>YY00000000</InvoiceNumber>
<RandomNumber>1234</RandomNumber>
<InvoiceDate>2017/12/31</InvoiceDate>
<InvoiceTime>23:59:59</InvoiceTime>
<InvoiceType>B2C</InvoiceType>
<CarrierID></CarrierID>
</SmilePayEinvoice>
```

- `InvoiceType`：B2C（無統編一般發票）／B2C2B（有統編可作廢）／B2B（有統編無法註銷）

### 常見錯誤代碼（節錄）
| 代碼 | 說明 |
|---|---|
| 0 | 開立成功 |
| -1001 | 商家帳號缺少參數 |
| -10011 | 查無商家帳號 |
| -10021~-10025 | 統一編號／公司名稱相關錯誤 |
| -10031~-10034 | 開立日期/時間格式錯誤或超過時限（B2C 48hr／B2B 168hr） |
| -10041~-100412 | 發票類別/課稅別/註記欄位錯誤 |
| -10051~-10058 | 手機號碼/載具相關錯誤 |
| -10061~-100611 | 商品明細數量、金額、稅率驗算錯誤 |
| -10071 | 無可用字軌 |
| -10072 | 自訂發票編號(data_id)重複 |
| -2001~-2003 | 發票號碼/隨機碼格式錯誤或重複 |

---

## 2. 開立折讓單

- 正式環境：`https://ssl.smse.com.tw/api/SPEinvoice_Storage_Allowance.asp`
- 測試環境：`https://ssl.smse.com.tw/api_test/SPEinvoice_Storage_Allowance.asp`
- 僅支援 UTF-8 編碼

### 參數
| 參數 | 說明 |
|---|---|
| Grvc / Verify_key | 電子發票帳號／驗證碼 |
| InvoiceNumber / InvoiceDate | 需折讓的發票號碼／日期 |
| AllowanceNumber | 折讓單號碼，可留空由系統自動產生 |
| AllowanceDate | 折讓日期 YYYY-MM-DD |
| AllowanceType | 1＝買方開立 2＝賣方開立（預設） |
| Description / Quantity / UnitPrice(未稅) / Unit / Amount(未稅) / Tax / TaxType | 折讓明細，多項以 `|` 分隔 |

### 回應 XML
```xml
<SmilePayEinvoice>
<Status>0</Status>
<Desc></Desc>
<Grvc>SEI1000002</Grvc>
<InvoiceNumber>YY00000000</InvoiceNumber>
<AllowanceNumber>YY00000000</AllowanceNumber>
</SmilePayEinvoice>
```

### 常見錯誤代碼
| 代碼 | 說明 |
|---|---|
| -1001 / -10011 | 商家帳號缺少參數／查無商家帳號 |
| -1002 | 發票號碼錯誤 |
| -10021~-10028 | 折讓明細（商品/數量/單價/稅金/日期）參數異常 |
| -1003 | 查無此筆發票 |
| -10031 | 超過可折讓金額 |
| -10032 | 折讓單號碼不可重複 |

---

## 3. 發票／折讓單：作廢・註銷・取消執行

- 正式環境：`https://ssl.smse.com.tw/api/SPEinvoice_Storage_Modify.asp`
- 測試環境：`https://ssl.smse.com.tw/api_test/SPEinvoice_Storage_Modify.asp`

### 參數
| 參數 | 說明 |
|---|---|
| Grvc / Verify_key | 電子發票帳號／驗證碼 |
| InvoiceNumber / InvoiceDate | 發票號碼／日期 |
| AllowanceNumber / AllowanceDate | 折讓單號碼／日期 |
| types | Cancel=作廢發票／Void=註銷發票／CancelAllowance=作廢折讓單／StopProcessing=取消執行（限發票，且尚未被平台接收才可執行） |
| CancelReason / VoidReason | 作廢／註銷原因（20字內） |
| ReturnTaxDocumentNumber | 專案作廢核准文號（選填，60字內） |
| Remark | 備註（200字內） |

### 欄位規則對照
| 欄位 | 作廢發票 | 註銷發票 | 作廢折讓單 | 取消執行 |
|---|---|---|---|---|
| 發票號碼/日期 | O | O | X | O |
| 折讓單號碼/日期 | X | X | O | X |
| 作廢原因 | O | X | O | X |
| 註銷原因 | X | O | X | X |

### 回應 XML
```xml
<SmilePayEinvoice>
<Status>0</Status>
<Desc></Desc>
<Types></Types>
<Grvc>SEI1000002</Grvc>
<InvoiceNumber>YY00000000</InvoiceNumber>
<AllowanceNumber>SMEE000000000000</AllowanceNumber>
<CancelDate>2017/12/31</CancelDate>
<CancelTime>23:59:59</CancelTime>
<VoidDate>2017/12/31</VoidDate>
<VoidTime>23:59:59</VoidTime>
</SmilePayEinvoice>
```

### 常見錯誤代碼
| 代碼 | 說明 |
|---|---|
| -1000 / -1001 | 商家帳號缺少參數／查無商家帳號 |
| -1002 | 服務類型（types）錯誤 |
| -2001~-2006 | 作廢/註銷所需欄位缺漏或超過字數限制 |
| -2007 | 缺少折讓單號碼或作廢原因 |
| -2008 | 發票目前狀態不允許執行該動作 |
| -2009 | 發票已有折讓紀錄，不允許執行 |
| -2010 | 查無該筆發票／折讓單 |

---

## 4. 列印發票／列印折讓單

### 列印發票
| 版型 | 環境 | API 位置 |
|---|---|---|
| 網頁列印(A4/A5/證明聯/PDF) | 正式 | `https://einvoice.smilepay.net/einvoice/SmilePayCarrier/InvoiceDetails.php` |
| 網頁列印(A4/A5/證明聯/PDF) | 測試 | `https://einvoice.smilepay.net/einvoice_test/SmilePayCarrier/InvoiceDetails.php` |
| EPSON IP列印(證明聯) | 正式 | `https://einvoice.smilepay.net/einvoice/Invoice_Print/Invoice_Print_EPSON.php` |
| EPSON IP列印(證明聯) | 測試 | `https://einvoice.smilepay.net/einvoice_test/Invoice_Print/Invoice_Print_EPSON.php` |

參數：`Grvc`、`Verify_key`、`InNumber`(發票號碼)、`InvoiceDate`、`RaNumber`(B2C填隨機碼／B2B填買受人統編)、`DetailPrint`(Y顯示交易明細聯)、`AutoPrint`(Y自動列印)、`Printer_ip`(僅EPSON IP列印用)

### 列印折讓單
| 環境 | API 位置 |
|---|---|
| 正式 | `https://einvoice.smilepay.net/einvoice/SmilePayCarrier/AllowanceDetails.php` |
| 測試 | `https://einvoice.smilepay.net/einvoice_test/SmilePayCarrier/AllowanceDetails.php` |

參數：`Grvc`、`Verify_key`、`InNumber`(發票號碼)、`AllowanceNumber`(開立折讓單時系統回傳的號碼)

---

## 5. 整合注意事項（金流／物流改用 PAYUNi）

由於系統的金流（收單付款）與物流（超商/宅配）改採 **PAYUNi（統一金流）** 處理，與 SmilePay 電子發票串接時建議注意：

- **開票時機**：建議在 PAYUNi 回傳「付款成功」的 Notify/Webhook 之後，才呼叫本文件第1節「開立發票」API，避免未付款卻先開票。
- **金額一致性**：呼叫開立發票 API 的 `AllAmount`（含稅總金額）須與 PAYUNi 實際收款金額一致，避免帳務兌不上。
- **訂單編號對應**：可利用 `data_id` 或 `orderid` 欄位存放 PAYUNi 的訂單編號（TradeNo），方便日後對帳、作廢、折讓時互相查找。
- **作廢/折讓時機**：若透過 PAYUNi 執行退款，建議同步呼叫本文件第3節「作廢/註銷」或第2節「開立折讓單」API，保持發票與金流狀態一致。
- **兩套系統的回呼位置（Webhook/Roturl）需分開設計**：PAYUNi 的付款通知網址與 SmilePay 發票結果的接收邏輯應各自獨立處理，避免程式邏輯混用造成誤判。
- **帳號與金鑰分離保管**：PAYUNi 的商店代號/HashKey/IvKey 與 SmilePay 的 Grvc/Verify_key 是兩套完全不同的憑證，需分別於 Next.js 專案的環境變數中管理（例如 `PAYUNI_MERCHANT_ID`、`SMILEPAY_GRVC` 等），不可混用。

---

## 6. 已完成整合（introvista.ai 測試實作，2026-07-10）

### 實作路徑
- API Route：`app/api/invoice/create/route.ts`（introvista.ai_home-main）

### 環境變數（`p:\Introvsta\.env`）
| 變數 | 說明 |
|---|---|
| `SMILEPAY_GRVC` | 速買配電子發票帳號（SEI1002204） |
| `SMILEPAY_VERIFY_KEY` | 速買配驗證碼 |

### 開票端點
| 環境 | URL |
|---|---|
| 測試 | `https://ssl.smse.com.tw/api_test/SPEinvoice_Storage.asp` |
| 正式 | `https://ssl.smse.com.tw/api/SPEinvoice_Storage.asp` |

### 支援發票類型
| 類型 | 設定 |
|---|---|
| 二聯式・雲端發票 | `DonateMark=0`，不設 CarrierType |
| 二聯式・手機條碼 | `DonateMark=0`, `CarrierType=3J0002`, `CarrierID=/XXXXXXX` |
| 二聯式・速買配載具 | `DonateMark=0`, `CarrierType=EJ0113` |
| 二聯式・愛心捐贈 | `DonateMark=1`, `LoveKey=<愛心碼>` |
| 三聯式・公司抬頭 | `DonateMark=0`, `Buyer_id=<統編>`, `CompanyName=<公司名>` |

### 重要實作說明
- `DonateMark` 為**必填欄位**，非捐贈時須明確傳 `"0"`，否則 SmilePay 回傳 -10044 錯誤。
- 開票時機：在 PAYUNi `/api/pay/notify`（背景）或 `/api/pay/return`（前景）確認 `Status=SUCCESS` 後觸發。
- `data_id` 與 `orderid` 均填入 PAYUNi 的 `MerTradeNo`，格式 `TEST{timestamp}{rand}`，防止重複開立。
- 發票寄送時間：開立成功後速買配約 5 分鐘內寄達。
- 測試驗證結果：發票號碼 `DU20633400` 成功開立並寄送至 penny.lai@introvista.ai（2026-07-10）。
