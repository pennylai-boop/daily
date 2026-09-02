/**
 * 在 Supabase 註冊或更新 `custom:line` OAuth provider（LINE Login）。
 *
 * 第一次接 LINE 登入、或要改 userinfo／mapping 時跑。重跑會覆蓋既有設定。
 * 這支腳本會對正式的 Supabase 專案下 admin API，請先確認：
 *
 *   1. LINE Developers 後台的 Login channel，Callback URL 已填
 *      https://<你的專案>.supabase.co/auth/v1/callback
 *   2. Supabase Dashboard → Authentication → URL Configuration
 *      Site URL = https://daily.introvista.ai（不能是 localhost，否則正式站登入會被退回本機）
 *      Redirect URLs 含
 *        https://daily.introvista.ai
 *        https://daily.introvista.ai/**
 *        https://daily.introvista.ai/auth/callback
 *        http://localhost:3000/**
 *        http://localhost:3000/auth/callback
 *   3. .env.local 已經有 NEXT_PUBLIC_SUPABASE_URL、SUPABASE_SECRET_KEY、
 *      LINE_LOGIN_CHANNEL_ID、LINE_LOGIN_CHANNEL_SECRET
 *   4. https://daily.introvista.ai/api/auth/line-userinfo 已經部署上線
 *      （Supabase 伺服器打這支，不能填 localhost）
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
const userinfoUrl = "https://daily.introvista.ai/api/auth/line-userinfo";

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

const fields = {
  name: "LINE",
  client_id: lineChannelId,
  client_secret: lineChannelSecret,
  authorization_url: "https://access.line.me/oauth2/v2.1/authorize",
  token_url: "https://api.line.me/oauth2/v2.1/token",
  userinfo_url: userinfoUrl,
  scopes: ["profile", "openid"],
  email_optional: true,
  // mapping 仍保留：proxy 已經先轉成 sub，這層是雙重保險。
  attribute_mapping: { sub: "userId", name: "displayName", picture: "pictureUrl" },
  authorization_params: { bot_prompt: "aggressive" },
};

const publicView = (provider) => ({
  identifier: provider?.identifier,
  provider_type: provider?.provider_type,
  enabled: provider?.enabled,
  userinfo_url: provider?.userinfo_url,
  attribute_mapping: provider?.attribute_mapping,
  email_optional: provider?.email_optional,
  authorization_params: provider?.authorization_params,
});

const { data: listed, error: listError } = await supabase.auth.admin.customProviders.listProviders();
if (listError) {
  console.error("listProviders 失敗：", listError);
  process.exit(1);
}

const providers = listed?.providers ?? listed ?? [];
const exists = providers.some((item) => item.identifier === "custom:line");

const result = exists
  ? await supabase.auth.admin.customProviders.updateProvider("custom:line", fields)
  : await supabase.auth.admin.customProviders.createProvider({
      provider_type: "oauth2",
      identifier: "custom:line",
      ...fields,
    });

if (result.error) {
  console.error(`${exists ? "更新" : "建立"} provider 失敗：`, result.error);
  process.exit(1);
}

const provider = result.data?.provider ?? result.data;
console.log(exists ? "已更新 custom:line provider：" : "已建立 custom:line provider：");
console.log(JSON.stringify(publicView(provider), null, 2));
