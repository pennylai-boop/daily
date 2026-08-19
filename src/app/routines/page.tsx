import type { Metadata } from "next";

import { RoutinesScreen } from "./routines-screen";

export const metadata: Metadata = {
  title: "定期事項",
  description: "設定重複的頻率與記錄格式，天天會在該做的日子排進當天清單。",
};

export default function Page() {
  return <RoutinesScreen />;
}
