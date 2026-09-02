-- 大家共享的打氣小語。系統預設 250 則仍在程式裡，不進這張表。
-- 登入後才能新增；只有作者能刪自己的。所有人（含未登入）都能讀。

create table if not exists public.pep_talk_quotes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  text         text not null,
  author_name  text not null default '',
  created_at   timestamptz not null default now(),
  constraint pep_talk_quotes_text_len check (char_length(trim(text)) between 1 and 120)
);

create index if not exists pep_talk_quotes_created_at_idx
  on public.pep_talk_quotes (created_at desc);

create index if not exists pep_talk_quotes_user_id_idx
  on public.pep_talk_quotes (user_id);

comment on table public.pep_talk_quotes is
  '使用者新增、全站共享的打氣小語。系統預設金句不在這張表。';

alter table public.pep_talk_quotes enable row level security;

create policy pep_talk_quotes_select_all
  on public.pep_talk_quotes for select
  using (true);

create policy pep_talk_quotes_insert_own
  on public.pep_talk_quotes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy pep_talk_quotes_delete_own
  on public.pep_talk_quotes for delete
  to authenticated
  using (auth.uid() = user_id);

grant select on public.pep_talk_quotes to anon, authenticated;
grant insert, delete on public.pep_talk_quotes to authenticated;
