import type { Metadata } from "next";

import { FocusScreen } from "./focus-screen";

export const metadata: Metadata = {
  title: "專心模式",
  description: "設定番茄鐘，鎖定畫面專心做一件事，並記錄已完成的工作時長。",
};

export default function Page() {
  return <FocusScreen />;
}
