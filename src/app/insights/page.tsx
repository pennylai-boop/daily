import type { Metadata } from "next";

import { InsightsScreen } from "./insights-screen";

export const metadata: Metadata = {
  title: "回顧",
  description: "定期事項完成率、紀錄比較與目標狀態。",
};

export default function Page() {
  return <InsightsScreen />;
}
