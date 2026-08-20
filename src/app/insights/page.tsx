import type { Metadata } from "next";

import { InsightsScreen } from "./insights-screen";

export const metadata: Metadata = {
  title: "回顧",
  description: "心情趨勢與定期事項完成率的比較圖表。",
};

export default function Page() {
  return <InsightsScreen />;
}
