-- 每日目標的顯示順序。數字小的在上面。

alter table public.routines
  add column if not exists sort_order integer not null default 0;

comment on column public.routines.sort_order is
  '使用中清單的顯示順序，由小到大。';

notify pgrst, 'reload schema';
