import type { Metadata } from "next";

import { LineBindScreen } from "./line-bind-screen";

export const metadata: Metadata = {
  title: "綁定 LINE 群組",
  robots: { index: false, follow: false },
};

export default function LineBindPage() {
  return <LineBindScreen />;
}
