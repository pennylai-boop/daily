import type { Metadata } from "next";

import { LinkButton } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/surfaces";
import { isPayuniConfigured } from "@/server/payuni";

import { AdFreeStart } from "./adfree-start";

export const metadata: Metadata = {
  title: "訂閱無廣告",
  description: "每月 NT$50，信用卡自動續約，關掉天天 daily 最下排廣告。",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <div className="only-in-ios-app mx-auto max-w-xl">
        <Card>
          <EmptyState
            emoji="🌱"
            title="這個頁面沒有開放"
            description="App 版本沒有訂閱與付款，回到日曆繼續寫今天的紀錄吧。"
            action={<LinkButton href="/">回到日曆</LinkButton>}
          />
        </Card>
      </div>

      <AdFreeStart paymentReady={isPayuniConfigured()} />
    </>
  );
}
