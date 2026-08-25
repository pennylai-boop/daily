-- 六十四卦「參考筆記」：管理端（admin）編輯，Gemini 解卦時當額外背景資料帶入 prompt。
--
-- 為什麼獨立一張表而不是塞進程式碼常數：解讀老師（人）想調整某一卦的用詞、補充案例，
-- 不該每次都要改 daily 的原始碼再部署；存在這裡讓 admin 可以直接編輯，
-- 下一次起卦立刻套用同一份內容（見 src/server/divination.ts 的 getHexagramNote）。
--
-- 用 (upper_trigram_id, lower_trigram_id) 當鍵：對應 src/lib/hexagram.ts 的 TRIGRAMS id（1～8，
-- 先天八卦序：乾兌離震巽坎艮坤），剛好蓋滿全部 64 卦組合，本卦、變卦都查同一張表。
create table if not exists public.divination_hexagram_notes (
  upper_trigram_id  smallint not null check (upper_trigram_id between 1 and 8),
  lower_trigram_id  smallint not null check (lower_trigram_id between 1 and 8),
  -- 冗存卦名方便直接在 SQL/後台瀏覽，不用另外 join 程式碼常數表。
  hexagram_name     text not null,
  reference_note    text not null default '',
  updated_at        timestamptz not null default now(),
  primary key (upper_trigram_id, lower_trigram_id)
);

comment on table public.divination_hexagram_notes is
  '六十四卦的人工參考筆記，admin 編輯，Gemini 解卦時作為額外背景資料（非必填，缺筆記時解讀照舊只靠卦名運作）。';
comment on column public.divination_hexagram_notes.reference_note is
  '给 AI 的補充說明（象徵、常見情境、用詞提醒等），空字串代表尚未填寫。';

-- 同 sponsor_orders／divination_credit_codes：只有伺服器端以 service role key 存取，開 RLS 但不給任何 policy。
alter table public.divination_hexagram_notes enable row level security;

create trigger divination_hexagram_notes_updated_at
  before update on public.divination_hexagram_notes
  for each row execute function public.set_updated_at();
