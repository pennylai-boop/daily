import type { Metadata } from "next";

import { LinePickScreen } from "./line-pick-screen";

export const metadata: Metadata = {
  title: "選擇 LINE 對象",
  robots: { index: false, follow: false },
};

export default function LinePickPage() {
  return <LinePickScreen />;
}
