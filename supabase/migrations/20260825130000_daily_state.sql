-- 把 DailyState（src/lib/types.ts）搬進 Supabase。
--
-- 未登入時 App 仍走 localStorage（src/lib/storage.ts）不變；登入後 src/lib/supabase-sync.ts
-- 會把本機資料同步進這幾張表，之後同一台裝置的讀寫兩邊都會更新。
--
-- 除了 share_invites／shares 之外，每張表都是 user_id + RLS `auth.uid() = user_id`，
-- 前端用 anon client（NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY）直接讀寫本人的資料。
-- share_invites／shares 的跨使用者寫入一律經 Route Handler（service role），
-- 詳見 src/server/sharing.ts、/api/invite/accept、/api/shared。

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ─────────────────────────────────────────────
-- profiles：對應 AppSettings.profile + AppSettings.pepTalk，一人一列。
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  line_user_id      text unique,
  name              text not null default '',
  avatar_url        text,
  pep_talk_visible  boolean not null default true,
  -- null＝使用內建預設清單；有值＝使用者編輯過的完整清單，語意同 PepTalkSettings.quotes。
  pep_talk_quotes   jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_all_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ─────────────────────────────────────────────
-- line_share_targets：對應 AppSettings.line.targets（常傳的 LINE 對象）。
-- ─────────────────────────────────────────────
create table if not exists public.line_share_targets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  last_used_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists line_share_targets_user_id_idx on public.line_share_targets (user_id);

alter table public.line_share_targets enable row level security;

create policy "line_share_targets_all_own" on public.line_share_targets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- day_entries：對應 entries（DayEntry）。blocks/focus/photos 整份存 jsonb，
-- 讀寫方式跟現在的 saveEntry(entry) 一致，不拆表。
-- ─────────────────────────────────────────────
create table if not exists public.day_entries (
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  mood        text,
  blocks      jsonb not null default '[]'::jsonb,
  focus       jsonb not null default '[]'::jsonb,
  -- 沿用 EntryPhoto 的形狀（含 dataUrl），照片本身也整包存在 jsonb 裡，不建 Storage bucket：
  -- Postgres jsonb 沒有 localStorage 5MB 的限制，這一步已經解決原本的容量問題。
  -- 之後真的要換成 Storage 物件時，把這欄的 dataUrl 換成路徑即可，schema 不用動。
  photos      jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.day_entries enable row level security;

create policy "day_entries_all_own" on public.day_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger day_entries_updated_at
  before update on public.day_entries
  for each row execute function public.set_updated_at();


-- ─────────────────────────────────────────────
-- routines：對應 routines（Routine）。
-- ─────────────────────────────────────────────
create table if not exists public.routines (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  emoji           text not null default '',
  note            text not null default '',
  frequency       jsonb not null,
  template        text,
  metric_fields   jsonb,
  timer_defaults  jsonb,
  archived        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists routines_user_id_idx on public.routines (user_id);

alter table public.routines enable row level security;

create policy "routines_all_own" on public.routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger routines_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();


-- ─────────────────────────────────────────────
-- routine_checks：對應 checks（日期 → 已完成事項 id 陣列），一列一個打勾。
-- ─────────────────────────────────────────────
create table if not exists public.routine_checks (
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  routine_id  uuid not null references public.routines(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, date, routine_id)
);

alter table public.routine_checks enable row level security;

create policy "routine_checks_all_own" on public.routine_checks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- period_goals：對應 weekGoals／monthGoals（PeriodGoalMap）。
-- ─────────────────────────────────────────────
create table if not exists public.period_goals (
  user_id      uuid not null references auth.users(id) on delete cascade,
  period_type  text not null check (period_type in ('week', 'month')),
  -- week：該週週一的 IsoDate；month：YYYY-MM。
  period_key   text not null,
  items        jsonb not null default '[]'::jsonb,
  updated_at   timestamptz not null default now(),
  primary key (user_id, period_type, period_key)
);

alter table public.period_goals enable row level security;

create policy "period_goals_all_own" on public.period_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger period_goals_updated_at
  before update on public.period_goals
  for each row execute function public.set_updated_at();


-- ─────────────────────────────────────────────
-- custom_moods：對應 customMoods（CustomMood）。id 沿用 createCustomMoodId 的 `custom:xxxx` 格式。
-- ─────────────────────────────────────────────
create table if not exists public.custom_moods (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null,
  emoji       text,
  -- 沿用本機的 imageDataUrl（data: URL），不建 Storage bucket，理由同 day_entries.photos。
  image_url   text,
  level       text not null check (level in ('great', 'good', 'okay', 'low', 'bad')),
  created_at  timestamptz not null default now()
);

create index if not exists custom_moods_user_id_idx on public.custom_moods (user_id);

alter table public.custom_moods enable row level security;

create policy "custom_moods_all_own" on public.custom_moods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────
-- share_invites：一次性邀請連結（分享者送出，尚未被接受）。
--
-- owner 對自己發出的邀請可以完整讀寫；「接受」是把別人發出的邀請標成 accepted 並
-- 建立 shares 關聯，這一步一律走 service role 的 Route Handler（/api/invite/accept），
-- 這裡不開放給非 owner 的 update，避免任何登入使用者能直接改別人的邀請狀態。
-- ─────────────────────────────────────────────
create table if not exists public.share_invites (
  token        text primary key,
  owner_id     uuid not null references auth.users(id) on delete cascade,
  name         text not null default '',
  scope        text not null check (scope in ('full', 'mood')),
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz
);

create index if not exists share_invites_owner_id_idx on public.share_invites (owner_id);

alter table public.share_invites enable row level security;

create policy "share_invites_owner_all" on public.share_invites
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);


-- ─────────────────────────────────────────────
-- shares：邀請被接受後的分享關係（owner 分享給 viewer）。
--
-- owner 可以讀／刪自己分享出去的名單（「設定 → 分享給誰看」）。viewer 端的讀取
-- （「被分享紀錄」）一律經 /api/shared 用 service role 組資料，不開放直接 select，
-- 這裡也不開放任何人 insert／update：寫入只在 /api/invite/accept 用 service role 執行。
-- ─────────────────────────────────────────────
create table if not exists public.shares (
  owner_id      uuid not null references auth.users(id) on delete cascade,
  viewer_id     uuid not null references auth.users(id) on delete cascade,
  invite_token  text references public.share_invites(token) on delete set null,
  -- 快取分享者填的稱呼／對方的 LINE userId／頭貼，讓「設定」頁列表不用（也不能，RLS 擋著）
  -- 另外 join 對方的 profiles；這三欄在接受邀請當下由 /api/invite/accept 用 service role 寫入。
  name          text not null default '',
  viewer_line_user_id  text not null default '',
  avatar_url    text,
  scope         text not null check (scope in ('full', 'mood')),
  created_at    timestamptz not null default now(),
  primary key (owner_id, viewer_id)
);

create index if not exists shares_viewer_id_idx on public.shares (viewer_id);

alter table public.shares enable row level security;

create policy "shares_owner_select" on public.shares
  for select using (auth.uid() = owner_id);

-- 允許 owner 改自己分享出去那筆的 scope（例如把「只看心情」升成「完整內容」）。
create policy "shares_owner_update" on public.shares
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "shares_owner_delete" on public.shares
  for delete using (auth.uid() = owner_id);
