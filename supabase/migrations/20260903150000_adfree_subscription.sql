-- 無廣告訂閱的「約定」狀態，與「效期」分開記。
--
-- expires_at 是已經付過錢的部分，取消訂閱不該把它收回；
-- status／period_trade_no 記的是 PAYUNi 那張續期約定還會不會繼續扣款。
-- next_charge_at 來自每期授權通知的 NextAuthDate，存下來就不必為了顯示「下次扣款」
-- 每次都打 PAYUNi 的查詢 API。

alter table public.adfree_entitlements
  add column if not exists period_trade_no text,
  add column if not exists status text not null default 'active',
  add column if not exists cancelled_at timestamptz,
  add column if not exists next_charge_at timestamptz,
  add column if not exists last_failure_at timestamptz,
  add column if not exists last_failure_reason text;

alter table public.adfree_entitlements drop constraint if exists adfree_entitlements_status_check;
alter table public.adfree_entitlements
  add constraint adfree_entitlements_status_check
  check (status in ('active', 'cancelled'));

comment on column public.adfree_entitlements.period_trade_no is
  'PAYUNi 續期收款單號。取消訂閱要靠它呼叫 period/mdfStatus。';

comment on column public.adfree_entitlements.status is
  'active＝約定仍會每月扣款；cancelled＝已終止，效期走完就不再續。';

comment on column public.adfree_entitlements.next_charge_at is
  '下次扣款日，取自每期授權通知的 NextAuthDate；最後一期為空。';

comment on column public.adfree_entitlements.last_failure_reason is
  '最近一次扣款失敗的原因（多半是卡片過期或額度不足），用來在設定頁提醒使用者。';

create index if not exists adfree_entitlements_period_trade_no_idx
  on public.adfree_entitlements (period_trade_no)
  where period_trade_no is not null;

notify pgrst, 'reload schema';
