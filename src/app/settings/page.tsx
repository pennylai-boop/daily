import type { Metadata } from "next";

import { SettingsScreen } from "./settings-screen";

export const metadata: Metadata = {
  title: "設定",
  description: "個人資料、LINE 通知與分享對象、外觀與資料備份。",
};

export default function Page() {
  return <SettingsScreen />;
}
