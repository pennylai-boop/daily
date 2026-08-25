import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/legal-document";
import { LEGAL_EFFECTIVE_DATE, LEGAL_PRODUCT, TermsOfUseBody } from "@/lib/legal";

export const metadata: Metadata = {
  title: "使用條款",
  description: `使用 ${LEGAL_PRODUCT} 前請閱讀的服務條款。`,
};

export default function Page() {
  return (
    <LegalDocument title="使用條款" updated={`生效日：${LEGAL_EFFECTIVE_DATE}`}>
      <TermsOfUseBody />
    </LegalDocument>
  );
}
