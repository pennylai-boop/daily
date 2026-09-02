import type { Metadata } from "next";

import { isPayuniConfigured } from "@/server/payuni";

import { SettingsScreen } from "./settings-screen";

export const metadata: Metadata = {
  title: "設定",
  description: "個人資料、無廣告訂閱、LINE 分享對象、備份，以及隱私權政策與使用條款。",
};

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.adfree;
  const flag = Array.isArray(raw) ? raw[0] : raw;
  const adFreeNotice =
    flag === "ok"
      ? "付款已確認，之後每月會自動續約。若廣告還沒關掉，請稍等入帳後重新整理。"
      : null;

  return <SettingsScreen paymentReady={isPayuniConfigured()} adFreeNotice={adFreeNotice} />;
}
