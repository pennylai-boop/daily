import type { Metadata } from "next";

import { AuthCallback } from "./auth-callback";

export const metadata: Metadata = {
  title: "登入中",
  description: "LINE 登入完成後回到天天 daily。",
};

export default function Page() {
  return <AuthCallback />;
}
