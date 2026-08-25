import type { Metadata } from "next";

import { SettingsScreen } from "./settings-screen";

export const metadata: Metadata = {
  title: "設定",
  description: "個人資料、LINE 通知與分享、備份，以及隱私權政策與使用條款。",
};

export default function Page() {
  return <SettingsScreen />;
}
