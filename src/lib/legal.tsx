import type { ReactNode } from "react";

/** 條款生效日，與首次公開這兩份文件的時間一致。 */
export const LEGAL_EFFECTIVE_DATE = "2026 年 9 月 2 日";

export const LEGAL_OPERATOR = "Introvsita";
export const LEGAL_PRODUCT = "天天 daily";
export const LEGAL_SITE = "daily.introvista.ai";

function Article({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="space-y-2 text-[13px] leading-relaxed text-ink-muted">{children}</div>
    </section>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

function Ul({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function PrivacyPolicyBody() {
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink-subtle">
        {LEGAL_PRODUCT}（網域 {LEGAL_SITE}）由 {LEGAL_OPERATOR} 營運。本政策說明我們如何蒐集、使用與保存個人資料，適用於台灣地區之使用者。生效日：{LEGAL_EFFECTIVE_DATE}。
      </p>

      <Article title="1. 我們蒐集什麼">
        <P>依你使用的功能，可能包含：</P>
        <Ul
          items={[
            "帳號資料：以 LINE 登入時，LINE 提供的使用者識別碼、顯示名稱與頭貼網址。",
            "你自己寫下的內容：日記、五感恩、觀心書、每日／週／月目標、定期事項、心情、計時與數值紀錄、照片（經壓縮後存於本機）。",
            "分享相關：你建立的邀請碼、分享範圍（完整內容或只看心情），以及對方接受後的 LINE 身分。",
            "贊助、點數與訂閱：金額與付款方式、信箱、發票資料、選填的稱呼與留言；付款成功後的訂單編號與無廣告效期。",
            "技術資訊：瀏覽器為了運作網站而產生的本機儲存資料；伺服器存取紀錄可能包含 IP、時間與瀏覽器類型（用於維運與資安）。",
          ]}
        />
      </Article>

      <Article title="2. 資料存在哪裡">
        <P>
          日記、目標、定期事項與設定，目前主要存在你這台裝置的瀏覽器（localStorage）。我們無法從伺服器直接讀取你的日記本文。清除網站資料、更換瀏覽器或裝置，本機紀錄可能一併消失，請自行使用設定頁的匯出備份。
        </P>
        <P>
          若你使用 LINE 登入、分享邀請、贊助或送出使用建議，相關資料會傳到我們的伺服器及下列第三方，才能完成該項功能。
        </P>
      </Article>

      <Article title="3. 使用目的">
        <Ul
          items={[
            "提供日曆、紀錄、定期目標、回顧統計與打氣小語等核心功能。",
            "辨識帳號，讓分享與被分享紀錄能對應到同一個 LINE 身分。",
            "依你的指示，將當日紀錄以圖片等方式分享到 LINE 或其他應用程式。",
            "處理自願贊助、卜卦點數與無廣告訂閱、寄送收據或感謝信，以及收受使用建議並在有需要時回覆。",
            "在未訂閱無廣告版時，於頁面最下排顯示 Google 廣告。",
            "維護服務安全、排除故障、遵守法令。",
          ]}
        />
        <P>
          我們不會把你的日記內容賣給第三人，也不會用來投放行為廣告。頁面最下排的廣告由 Google
          AdSense 依其政策投放，與你的日記本文無關。
        </P>
      </Article>

      <Article title="4. 第三方服務">
        <Ul
          items={[
            "LINE：登入、頭貼與名稱、邀請與（未來）訊息推播，依 LINE 的隱私權政策處理。",
            "統一金流 PAYUNi：贊助、卜卦點數與無廣告訂閱付款。卡號與轉帳資料由金流端處理，不經過本服務伺服器。",
            "速買配 SmilePay：購買點數或訂閱無廣告時開立電子發票。",
            "Google AdSense：未訂閱無廣告版時，於頁面最下排顯示廣告。",
            "Resend（若已設定）：寄送贊助感謝信、兌換碼、訂閱收據與使用建議相關郵件。",
            "雲端主機（例如 Google Cloud）：託管網站與 API。",
          ]}
        />
      </Article>

      <Article title="5. 保存期間">
        <P>
          本機資料由你自行保存或刪除。伺服器上的贊助訂單、留言與帳號關聯，於達成蒐集目的所需期間內保存；法令另有規定者從其規定。你可隨時登出 LINE；登出不會自動刪除本機日記。
        </P>
      </Article>

      <Article title="6. 你的權利">
        <P>
          依個人資料保護法，你得查詢、閱覽、製給複製本、補充更正、請求停止蒐集／處理／利用或刪除個人資料。本機內容可在設定匯出，或於裝置上清除網站資料。行使權利請透過「支持」頁的聯絡與留言與我們聯繫。部分請求可能依法或因技術限制無法立即完成（例如金流端已處理之交易紀錄）。
        </P>
      </Article>

      <Article title="7. Cookie 與類似技術">
        <P>
          本服務以瀏覽器本機儲存運作，可能使用 Cookie 或同等技術以維持登入狀態、外觀偏好與網站功能。未訂閱無廣告版時，Google AdSense 也可能設置 Cookie 以投放廣告；訂閱生效後我們不再載入該廣告腳本。
        </P>
      </Article>

      <Article title="8. 未成年人">
        <P>
          本服務以一般成年使用者為預設對象。若你是未成年人，請在法定代理人同意下使用，並由法定代理人檢視本政策。
        </P>
      </Article>

      <Article title="9. 政策變更">
        <P>
          若蒐集範圍或使用目的有重大變更，我們會更新本頁並調整生效日。繼續使用即表示你已了解更新後的內容。
        </P>
      </Article>

      <Article title="10. 聯絡我們">
        <P>
          營運單位：{LEGAL_OPERATOR}。網站：https://{LEGAL_SITE}。隱私與個資相關來信，請使用本服務「支持」頁的聯絡與留言（請留下信箱以便回覆）。
        </P>
      </Article>
    </div>
  );
}

export function TermsOfUseBody() {
  return (
    <div className="space-y-5">
      <p className="text-[13px] text-ink-subtle">
        歡迎使用 {LEGAL_PRODUCT}。使用本服務即表示你同意本使用條款。生效日：{LEGAL_EFFECTIVE_DATE}。
      </p>

      <Article title="1. 服務內容">
        <P>
          {LEGAL_PRODUCT} 提供以日曆檢視心情與紀錄、撰寫日記／五感恩／觀心書等格式、設定定期目標與計時／數值紀錄、回顧統計，以及自願贊助與使用建議等功能。服務以繁體中文、台灣地區為主要使用情境。
        </P>
        <P>
          功能可能持續調整。我們得新增、變更或暫停部分功能，並盡合理努力在設定或網站上說明。
        </P>
      </Article>

      <Article title="2. 帳號與本機資料">
        <Ul
          items={[
            "帳號僅支援 LINE 登入。請妥善保管你的 LINE 帳號。",
            "日記與目標等內容目前主要存在你的裝置。請自行匯出備份；遺失、損壞或清除瀏覽器資料所致的內容滅失，我們不負擔還原義務。",
            "你應對自己發布、分享的內容負責，並確保未侵害他人權利。",
          ]}
        />
      </Article>

      <Article title="3. 可接受的使用">
        <P>使用本服務時，你不得：</P>
        <Ul
          items={[
            "從事違法、詐欺、騷擾或侵害他人隱私與智慧財產權之行為。",
            "試圖破解、干擾或過度負載本服務或相關系統。",
            "未經授權蒐集其他使用者的個人資料。",
            "將服務用於散播惡意軟體或垃圾訊息。",
          ]}
        />
      </Article>

      <Article title="4. 分享">
        <P>
          你可以選擇將紀錄分享給指定對象（完整內容或只看心情）。請確認對方身分與分享範圍。一經分享，對方即可依你設定的範圍閱覽；我們無法保證對方如何保存或轉傳該內容。
        </P>
      </Article>

      <Article title="5. 贊助、無廣告訂閱與使用建議">
        <P>
          贊助為自願支持，並非購買商品，送出付款後原則上不提供退款。無廣告訂閱為每月新台幣 50
          元的付費方案，付款成功後效期往後加 30 天，並開立電子發票；原則上亦不提供退款。付款由
          PAYUNi 處理。使用建議可在未付款的情況下送出；你同意我們為改善服務而閱讀並保存留言。
        </P>
        <P>iOS App 內可能不提供贊助、訂閱與廣告相關畫面，以符合應用程式商店規範。</P>
      </Article>

      <Article title="6. 智慧財產">
        <P>
          本服務之程式、設計與預設文案（含打氣小語預設清單）歸 {LEGAL_OPERATOR} 或合法授權人所有。你保留自己撰寫之日記與上傳照片的權利，並授權我們為提供本服務所必要之範圍內儲存與處理該內容（例如顯示在你的裝置、依你指示產生分享圖）。
        </P>
      </Article>

      <Article title="7. 免責">
        <P>
          本服務依「現況」提供，不保證不中斷、無錯誤或完全適合特定目的。日記與心情紀錄不能取代專業醫療、諮商或法律意見。對於本機資料遺失、第三方（LINE、金流、郵件服務）中斷，或你違反本條款所生損害，除法律強制規定外，我們不負賠償責任。
        </P>
      </Article>

      <Article title="8. 終止">
        <P>
          你可以隨時停止使用並清除本機資料、登出 LINE。若你嚴重或持續違反本條款，我們得暫停或終止提供服務。
        </P>
      </Article>

      <Article title="9. 準據法">
        <P>
          本條款以中華民國（台灣）法律為準據法。因本服務產生之爭議，以台灣台北地方法院為第一審管轄法院，但法律強制規定之消費者保護管轄不受影響。
        </P>
      </Article>

      <Article title="10. 聯絡">
        <P>
          營運單位：{LEGAL_OPERATOR}。網站：https://{LEGAL_SITE}。條款相關問題請透過「支持」頁留言。
        </P>
      </Article>
    </div>
  );
}
