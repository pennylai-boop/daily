-- 常傳對象可綁定 LINE 群組 ID，之後由伺服器用 Messaging API 直接推播每日分享圖，
-- 不必每次都跳 LINE 的選對象畫面。
--
-- 群組 ID 只能在「從該群組裡開啟天天 daily 的 LIFF」時由 liff.getContext() 取得
-- （見 src/app/line-bind）。推播圖片需要公開網址，存到下面的 day-shares bucket。

alter table public.line_share_targets
  add column if not exists line_group_id text;

comment on column public.line_share_targets.line_group_id is
  'LINE 群組／聊天室 ID。有值＝可由伺服器 Messaging API 直接推播；null＝只能走 shareTargetPicker。';

-- 分享圖的公開 bucket：LINE 抓圖需要可匿名存取的 https 網址。
-- 寫入一律由 Route Handler 用 service role 進行（繞過 RLS）；公開 bucket 本身即可匿名讀取。
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('day-shares', 'day-shares', true, 10485760, array['image/png', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

notify pgrst, 'reload schema';
