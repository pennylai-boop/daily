import type { Metadata } from "next";

import { InsightsScreen } from "./insights-screen";

export const metadata: Metadata = {
  title: "回顧",
  description: "定期事項完成格線、目標狀態與心情趨勢。",
};

export default function Page() {
  return <InsightsScreen />;
}
