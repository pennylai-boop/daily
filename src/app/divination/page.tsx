import type { Metadata } from "next";

import { DivinationScreen } from "./divination-screen";

export const metadata: Metadata = {
  title: "數字卜卦",
  description: "寫下想問的問題並輸入九個數字起卦，再由 AI 協助解讀本卦、動爻與變卦。",
};

export default function Page() {
  return <DivinationScreen />;
}
