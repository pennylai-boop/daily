import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";
import { LEGAL_EFFECTIVE_DATE, LEGAL_PRODUCT, PrivacyPolicyBody } from "@/lib/legal";

export const metadata: Metadata = {
  title: "隱私權政策",
  description: `${LEGAL_PRODUCT} 如何蒐集、使用與保存個人資料。`,
};

export default function Page() {
  return (
    <LegalDocument title="隱私權政策" updated={`生效日：${LEGAL_EFFECTIVE_DATE}`}>
      <PrivacyPolicyBody />
    </LegalDocument>
  );
}
