/**
 * 一次性腳本：在 Supabase 註冊 `custom:line` OAuth provider（LINE Login）。
 *
 * 只需要在專案第一次接 LINE 登入時跑一次；重跑會用同樣的設定覆蓋既有 provider。
 * 這支腳本會對正式的 Supabase 專案下 admin API，請先確認：
 *
 *   1. LINE Developers 後台的 Login channel，Callback URL 已填
 *      https://<你的專案>.supabase.co/auth/v1/callback
 *   2. .env.local（或 .env）已經有 NEXT_PUBLIC_SUPABASE_URL、SUPABASE_SECRET_KEY、
 *      LINE_LOGIN_CHANNEL_ID、LINE_LOGIN_CHANNEL_SECRET
 *
 * 執行（Node 20.6+ 支援 --env-file）：
 *   node --env-file=.env.local scripts/create-line-provider.mjs
 *
 * 細節見 README.md 的「部署規劃：Supabase + GCP + LINE 登入」。
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const lineChannelId = process.env.LINE_LOGIN_CHANNEL_ID;
const lineChannelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET;

const missing = Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: url,
  SUPABASE_SECRET_KEY: secretKey,
  LINE_LOGIN_CHANNEL_ID: lineChannelId,
  LINE_LOGIN_CHANNEL_SECRET: lineChannelSecret,
})
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.error(`缺少環境變數：${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.customProviders.createProvider({
  provider_type: "oauth2", // 不能用 oidc：LINE 的 id_token 是 HS256，Supabase 的 OIDC 流程驗不過非對稱簽章。
  identifier: "custom:line",
  name: "LINE",
  client_id: lineChannelId,
  client_secret: lineChannelSecret,
  authorization_url: "https://access.line.me/oauth2/v2.1/authorize",
  token_url: "https://api.line.me/oauth2/v2.1/token",
  userinfo_url: "https://api.line.me/v2/profile",
  scopes: ["profile", "openid"],
  email_optional: true, // /v2/profile 不回 email
  attribute_mapping: { sub: "userId", name: "displayName", picture: "pictureUrl" },
  authorization_params: { bot_prompt: "aggressive" }, // 登入時順便引導加官方帳號好友
});

if (error) {
  console.error("建立 provider 失敗：", error);
  process.exit(1);
}

console.log("已建立 custom:line provider：");
console.log(JSON.stringify(data, null, 2));
