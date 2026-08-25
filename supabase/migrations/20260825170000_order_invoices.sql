-- 電子發票（SmilePay）。
--
-- 購買點數要開發票，贊助不開（贊助不是商品銷售）。發票資訊在建立訂單時就收下來存好：
-- PAYUNi 的回傳只帶訂單編號，等 Notify 回來才要開票，那時候前端早就離開頁面了。
--
-- 發票的欄位會隨類型不同（載具／愛心碼／統編），所以存成 jsonb 而不是一堆多半是空的欄位；
-- 形狀由 src/lib/invoice.ts 的 parseInvoice 收斂。
alter table public.sponsor_orders
  add column if not exists invoice jsonb,
  add column if not exists invoice_number text,
  add column if not exists invoice_issued_at timestamptz,
  add column if not exists invoice_error text;

comment on column public.sponsor_orders.invoice is
  '買受人要的發票形式（src/lib/invoice.ts 的 InvoiceInput）；贊助訂單為 null。';
comment on column public.sponsor_orders.invoice_number is 'SmilePay 回傳的發票號碼。';
comment on column public.sponsor_orders.invoice_error is
  '開票失敗的原因；有值代表款已收但發票沒開出來，要人工補開。';

-- 收了錢卻沒開出發票的訂單要能一眼撈出來。
create index if not exists sponsor_orders_invoice_pending_idx
  on public.sponsor_orders (created_at desc)
  where product = 'credits' and status = 'paid' and invoice_number is null;
