import type { Metadata } from "next";

import { RoutinesScreen } from "./routines-screen";

export const metadata: Metadata = {
  title: "定期目標",
  description: "寫下本週／本月目標，並設定會重複出現的目標與記錄格式。",
};

export default function Page() {
  return <RoutinesScreen />;
}
