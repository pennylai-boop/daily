import type { Metadata } from "next";

import { SharedScreen } from "./shared-screen";

export const metadata: Metadata = {
  title: "被分享紀錄",
  description: "在 LINE 上接受邀請之後，對方的紀錄就會出現在這裡。",
};

export default function Page() {
  return <SharedScreen />;
}
