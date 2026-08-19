import type { Metadata } from "next";

import { InviteScreen } from "./invite-screen";

export const metadata: Metadata = {
  title: "接受分享邀請",
  description: "用 LINE 接受邀請，對方的紀錄就會出現在你的「被分享紀錄」。",
};

export default async function InvitePage(props: PageProps<"/invite/[code]">) {
  const { code } = await props.params;
  return <InviteScreen code={code.toUpperCase()} />;
}
