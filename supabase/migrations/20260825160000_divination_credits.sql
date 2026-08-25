-- 卜卦點數：購買後發一組兌換碼，點數的餘額記在伺服器，兌換碼是領用的憑據。
--
-- 為什麼不記在帳號下：日記資料都在 localStorage，沒有可驗證的使用者身分
-- （LINE 登入目前只在 LINE App 內有效，見 src/lib/line-auth.ts）。
--
-- 為什麼餘額記在這裡而不是瀏覽器：付過錢的點數不能因為「清除資料」或換手機就消失。
-- 兌換碼寄到信箱，餘額留在這張表，換裝置時重新輸入同一組碼就能接回剩下的點數；
-- 每次用點數起卦也都是由伺服器扣款，前端改不了餘額。
alter table public.sponsor_orders
  add column if not exists product text not null default 'sponsor',
  add column if not exists credits integer not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'sponsor_orders_product_check') then
    alter table public.sponsor_orders
      add constraint sponsor_orders_product_check check (product in ('sponsor', 'credits'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'sponsor_orders_credits_check') then
    alter table public.sponsor_orders
      add constraint sponsor_orders_credits_check check (credits >= 0);
  end if;
end $$;

comment on column public.sponsor_orders.product is 'sponsor＝贊助；credits＝購買卜卦點數。';
comment on column public.sponsor_orders.credits is '這筆訂單要發幾點卜卦點數，贊助訂單為 0。';

-- 一筆訂單只發一組碼（mer_trade_no 唯一），碼本身帶著「買了幾點、用掉幾點」。
create table if not exists public.divination_credit_codes (
  code         text primary key,
  credits      integer not null check (credits > 0),
  credits_used integer not null default 0 check (credits_used >= 0),
  email        text not null,
  mer_trade_no text not null unique references public.sponsor_orders (mer_trade_no) on delete cascade,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  constraint divination_credit_codes_not_overdrawn check (credits_used <= credits)
);

comment on table public.divination_credit_codes is '卜卦點數兌換碼與餘額，付款成功後由 Notify 產生並寄出。';

create index if not exists divination_credit_codes_email_idx
  on public.divination_credit_codes (email);

-- 同 sponsor_orders：只有伺服器端以 service role key 存取，開 RLS 但不給任何 policy。
alter table public.divination_credit_codes enable row level security;

-- 扣一點。
--
-- 用 SQL function 而不是先讀再寫：兩個請求同時進來時，先讀再寫會讓同一點被用兩次。
-- 這裡的 update 帶了 credits_used < credits 條件，扣不到就回 0 列，代表點數已經用完。
create or replace function public.consume_divination_credit(p_code text)
returns table (credits integer, credits_used integer)
language sql
security definer
set search_path = public
as $$
  update public.divination_credit_codes
     set credits_used = credits_used + 1,
         last_used_at = now()
   where code = p_code
     and credits_used < credits
  returning credits, credits_used;
$$;

comment on function public.consume_divination_credit(text) is
  '扣掉一點卜卦點數並回傳最新的買／用數量；點數用完時回傳 0 列。';
