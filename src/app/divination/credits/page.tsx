import type { Metadata } from "next";

import { isPayuniConfigured } from "@/server/payuni";

import { CreditsScreen } from "./credits-screen";

export const metadata: Metadata = {
  title: "卜卦點數",
  description: "在三個月的免費額度之外想再問一次時，用點數起卦。",
};

export default function Page() {
  return <CreditsScreen paymentReady={isPayuniConfigured()} />;
}
