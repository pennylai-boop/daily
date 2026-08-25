import type { ReactNode } from "react";

import { Card, PageHeading, TextLink } from "@/components/ui/surfaces";

export function LegalDocument({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeading
        title={title}
        description={updated}
        action={<TextLink href="/settings">回到設定</TextLink>}
      />
      <Card className="px-4 py-4 sm:px-5">{children}</Card>
    </div>
  );
}
