import { DEFAULT_ROUTINES } from "./routines";
import type {
  AppSettings,
  DailyState,
  EntryBlock,
  Profile,
  Routine,
  ShareRecipient,
  SharedJournal,
  TemplateId,
  ThemePreference,
} from "./types";

export const STORE_KEY = "daily.store.v1";
export const THEME_KEY = "daily.theme";
/**
 * 2：觀心書從五個問答改成身／口／意的條列。
 * 3：分享對象從 email 改成 LINE 邀請。
 */
export const STORE_VERSION = 3;

export const DEFAULT_SETTINGS: AppSettings = {
  profile: { name: "", lineUserId: "" },
  line: { enabled: false, groupName: "", groupId: "", trigger: "onComplete" },
  recipients: [],
};

export const EMPTY_STATE: DailyState = {
  version: STORE_VERSION,
  entries: {},
  routines: [],
  checks: {},
  settings: DEFAULT_SETTINGS,
  sharedWithMe: [],
};

/** 首次使用時帶入預設的定期事項，讓使用者一進來就能開始書寫。 */
export function createInitialState(): DailyState {
  return {
    ...EMPTY_STATE,
    routines: DEFAULT_ROUTINES.map((routine, index) => ({
      ...routine,
      id: createId(),
      createdAt: new Date(Date.now() + index).toISOString(),
    })),
  };
}

/**
 * 前端先以 localStorage 作為資料層，後端上線後只需替換這一層的讀寫實作。
 */
export function loadState(): DailyState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) {
      const initial = createInitialState();
      saveState(initial);
      return initial;
    }
    return normalizeState(JSON.parse(raw));
  } catch {
    return EMPTY_STATE;
  }
}

export function saveState(state: DailyState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // 私密瀏覽或容量已滿時忽略寫入失敗，畫面仍可繼續操作。
  }
}

export function normalizeState(value: unknown): DailyState {
  if (!value || typeof value !== "object") return EMPTY_STATE;
  const candidate = value as Partial<DailyState>;

  const entries: DailyState["entries"] = {};
  if (isRecord(candidate.entries)) {
    for (const [date, entry] of Object.entries(candidate.entries as DailyState["entries"])) {
      entries[date] = {
        ...entry,
        blocks: (entry.blocks ?? []).map(normalizeBlock),
        focus: entry.focus ?? [],
      };
    }
  }

  return {
    version: STORE_VERSION,
    entries,
    routines: Array.isArray(candidate.routines) ? candidate.routines.map(withTemplate) : [],
    checks: isRecord(candidate.checks) ? (candidate.checks as DailyState["checks"]) : {},
    settings: mergeSettings(candidate.settings),
    sharedWithMe: Array.isArray(candidate.sharedWithMe)
      ? candidate.sharedWithMe.map(normalizeJournal)
      : [],
  };
}

function mergeSettings(value: AppSettings | undefined): AppSettings {
  if (!value) return DEFAULT_SETTINGS;
  return {
    profile: normalizeProfile(value.profile),
    line: { ...DEFAULT_SETTINGS.line, ...value.line },
    recipients: Array.isArray(value.recipients) ? value.recipients.map(normalizeRecipient) : [],
  };
}

/** v2 以前 profile 存的是使用者自己打的 email，沒有經過驗證，改版後不再保留。 */
function normalizeProfile(value: Profile | undefined): Profile {
  return {
    name: value?.name ?? "",
    lineUserId: value?.lineUserId ?? "",
  };
}

/** v2 的分享對象是一組 email；轉成待接受的邀請，稱呼沿用原本填的名字。 */
function normalizeRecipient(value: ShareRecipient): ShareRecipient {
  const legacyEmail = (value as unknown as { email?: string }).email ?? "";
  return {
    id: value.id,
    name: value.name || legacyEmail,
    lineUserId: value.lineUserId ?? null,
    avatarUrl: value.avatarUrl ?? null,
    scope: value.scope,
    status: value.status ?? (value.lineUserId ? "accepted" : "pending"),
    inviteCode: value.inviteCode || createInviteCode(),
    createdAt: value.createdAt,
    acceptedAt: value.acceptedAt ?? null,
  };
}

function normalizeJournal(value: SharedJournal): SharedJournal {
  return {
    ...value,
    ownerLineUserId: value.ownerLineUserId ?? "",
  };
}

/** v1 的觀心書是五個問答；改版後轉成日記保留文字，不讓既有紀錄消失。 */
const LEGACY_MINDFULNESS_FIELDS: [string, string][] = [
  ["event", "今日事件"],
  ["feeling", "當下情緒"],
  ["thought", "浮現的念頭"],
  ["insight", "覺察與學習"],
  ["release", "放下與祝福"],
];

/** 舊版備份沒有 routineId / template 欄位，補上預設值以免介面讀到 undefined。 */
function normalizeBlock(block: EntryBlock): EntryBlock {
  const withRoutine = { ...block, routineId: block.routineId ?? null };
  if (withRoutine.template !== "mindfulness") return withRoutine;

  const data = withRoutine.data as unknown as Record<string, unknown>;
  if (Array.isArray(data.items)) return withRoutine;

  const body = LEGACY_MINDFULNESS_FIELDS.map(([key, label]) => {
    const value = typeof data[key] === "string" ? (data[key] as string).trim() : "";
    return value ? `${label}\n${value}` : "";
  })
    .filter(Boolean)
    .join("\n\n");

  return {
    id: withRoutine.id,
    routineId: withRoutine.routineId,
    template: "diary",
    data: { title: "觀心書（舊格式）", body },
  };
}

function withTemplate(routine: Routine): Routine {
  return { ...routine, template: (routine.template ?? null) as TemplateId | null };
}

export function loadTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(THEME_KEY);
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
}

export function saveTheme(theme: ThemePreference): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, theme);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 邀請碼會出現在連結裡也可能被唸出來，避開容易看錯的 0/O、1/I。 */
const INVITE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function createInviteCode(length = 8): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (byte) => INVITE_ALPHABET[byte % INVITE_ALPHABET.length]).join("");
}
