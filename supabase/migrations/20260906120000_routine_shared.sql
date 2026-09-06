-- 每日目標可各自設定是否出現在分享擷圖。
-- 關掉後只影響擷圖內容；當天清單與統計仍看得到。舊列預設為分享。

alter table public.routines
  add column if not exists shared boolean not null default true;

comment on column public.routines.shared is
  'true＝分享擷圖時帶這個目標的內容；false＝擷圖隱藏。';

notify pgrst, 'reload schema';
