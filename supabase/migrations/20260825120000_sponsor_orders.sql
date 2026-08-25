-- 贊助（支持我們）訂單。
--
-- 取代 src/server/support-orders.ts 原本的行程內 Map：該實作在伺服器重啟或
-- Cloud Run 多實例部署時會遺失待付款訂單（後果是感謝信沒寄，款項仍在 PAYUNi
-- 後台看得到）。改存這張表後，任何實例都能查到同一筆訂單。
--
-- 僅由伺服器端（Route Handler）以 service role key 存取，前端不會直接連線，
-- 因此開啟 RLS 但不建立任何 policy（service role 會繞過 RLS，其餘一律拒絕）。
create table if not exists public.sponsor_orders (
  mer_trade_no      text primary key,
  amount            integer not null check (amount > 0),
  method            text not null check (method in ('credit', 'atm', 'cvs')),
  name              text not null default '',
  email             text not null,
  message           text not null default '',
  status            text not null default 'pending'
                      check (status in ('pending', 'awaiting_payment', 'paid', 'failed')),
  trade_no          text,
  paid_at           timestamptz,
  thank_you_sent_at timestamptz,
  thank_you_error   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.sponsor_orders is '贊助（支持我們）訂單，取代 support-orders.ts 原本的行程內 Map。';

create index if not exists sponsor_orders_status_idx on public.sponsor_orders (status);
create index if not exists sponsor_orders_created_at_idx on public.sponsor_orders (created_at desc);

alter table public.sponsor_orders enable row level security;

create or replace function public.sponsor_orders_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sponsor_orders_updated_at on public.sponsor_orders;
create trigger sponsor_orders_updated_at
  before update on public.sponsor_orders
  for each row
  execute function public.sponsor_orders_set_updated_at();
