-- 無廣告訂閱：每月 NT$50，付款成功後效期往後加 30 天。
-- 權益綁 Supabase 使用者（LINE 登入），不跟日記本機資料混在一起。

alter table public.sponsor_orders
  add column if not exists user_id uuid,
  add column if not exists entitlement_applied_at timestamptz;

comment on column public.sponsor_orders.entitlement_applied_at is
  '無廣告訂閱已把效期加上去的時間。Notify 重送時靠它避免再加 30 天。';

comment on column public.sponsor_orders.user_id is
  '下單時的登入使用者。無廣告訂閱一定有值；贊助與點數可為空。';

create index if not exists sponsor_orders_user_id_idx
  on public.sponsor_orders (user_id)
  where user_id is not null;

alter table public.sponsor_orders drop constraint if exists sponsor_orders_product_check;
alter table public.sponsor_orders
  add constraint sponsor_orders_product_check
  check (product in ('sponsor', 'credits', 'adfree'));

comment on column public.sponsor_orders.product is
  'sponsor＝贊助；credits＝購買卜卦點數；adfree＝無廣告訂閱。';

create table if not exists public.adfree_entitlements (
  user_id    uuid primary key,
  email      text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

comment on table public.adfree_entitlements is
  '無廣告訂閱效期。同一帳號續訂時從「現在」與「原到期日」較晚者再加 30 天。';

alter table public.adfree_entitlements enable row level security;

create or replace function public.extend_adfree_entitlement(
  p_user_id uuid,
  p_email text,
  p_days integer default 30
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  next_expires timestamptz;
begin
  insert into public.adfree_entitlements (user_id, email, expires_at, updated_at)
  values (
    p_user_id,
    p_email,
    now() + make_interval(days => p_days),
    now()
  )
  on conflict (user_id) do update
    set email = excluded.email,
        expires_at = greatest(adfree_entitlements.expires_at, now())
          + make_interval(days => p_days),
        updated_at = now()
  returning expires_at into next_expires;

  return next_expires;
end;
$$;

comment on function public.extend_adfree_entitlement(uuid, text, integer) is
  '把無廣告效期往後加指定天數；已在期內則從原到期日接著算。';
