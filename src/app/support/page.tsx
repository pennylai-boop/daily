import type { Metadata } from "next";

import { LinkButton } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/surfaces";
import { isPayuniConfigured } from "@/server/payuni";
import { isSmilepayConfigured } from "@/server/smilepay-invoice";

import { SupportScreen } from "./support-screen";

export const metadata: Metadata = {
  title: "支持",
  description: "用任意金額贊助天天 daily，付款由 PAYUNi 處理，發票由 SmilePay 開立。",
};

// 憑證是 Cloud Run 的執行期環境變數，不能在 build 時就把「已設定」的結果烤進靜態頁。
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      {/*
        iOS App 內只看得到這張卡片，贊助表單會被 CSS 隱藏（規則見 globals.css 的 only-in-ios-app）。
        文案刻意不提付款或網頁版：App Store 3.1.1 連「導向其他付款方式的行動呼籲」都不允許。
      */}
      <div className="only-in-ios-app mx-auto max-w-xl">
        <Card>
          <EmptyState
            emoji="🌱"
            title="這個頁面沒有開放"
            description="App 版本沒有這一頁的內容，回到日曆繼續寫今天的紀錄吧。"
            action={<LinkButton href="/">回到日曆</LinkButton>}
          />
        </Card>
      </div>

      <SupportScreen paymentReady={isPayuniConfigured()} invoiceReady={isSmilepayConfigured()} />
    </>
  );
}
