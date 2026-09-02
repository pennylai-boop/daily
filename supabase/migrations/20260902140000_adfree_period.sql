-- 無廣告改走 PAYUNi 續期收款（每月自動扣款）。
-- 同一筆續期單會有多期授權，每期各記一筆訂單，付款紀錄才列得齊。

alter table public.sponsor_orders
  add column if not exists period_trade_no text,
  add column if not exists period_order_no text,
  add column if not exists this_period integer;

comment on column public.sponsor_orders.period_trade_no is
  'PAYUNi 續期收款單號 PeriodTradeNo。一筆約定、多期扣款共用。';

comment on column public.sponsor_orders.period_order_no is
  'PAYUNi 本期續期訂單編號 PeriodOrderNo（商店訂單編號_期數）。';

comment on column public.sponsor_orders.this_period is
  '本期是第幾期扣款。';

create unique index if not exists sponsor_orders_period_order_no_uidx
  on public.sponsor_orders (period_order_no)
  where period_order_no is not null;

create index if not exists sponsor_orders_period_trade_no_idx
  on public.sponsor_orders (period_trade_no)
  where period_trade_no is not null;
