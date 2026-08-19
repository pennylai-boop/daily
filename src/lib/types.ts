/** 日期一律使用本地時區的 `YYYY-MM-DD` 字串，避免 UTC 位移造成跨日錯誤。 */
export type IsoDate = string;

export type MoodId =
  | "radiant"
  | "happy"
  | "calm"
  | "grateful"
  | "neutral"
  | "tired"
  | "anxious"
  | "down"
  | "angry";

export type TemplateId = "diary" | "gratitude" | "mindfulness";

export interface DiaryContent {
  title: string;
  body: string;
}

export interface GratitudeContent {
  items: string[];
}

/** 觀心書從身（做的）、口（說的）、意（想的）三個面向觀照一天。 */
export type MindfulnessChannel = "body" | "speech" | "mind";

/** plus：做得好的；minus：要調整的；todo：接下來要練習的。 */
export type MindfulnessMark = "plus" | "minus" | "todo";

export interface MindfulnessItem {
  id: string;
  channel: MindfulnessChannel;
  mark: MindfulnessMark;
  text: string;
}

export interface MindfulnessContent {
  items: MindfulnessItem[];
}

export type BlockContent =
  | { template: "diary"; data: DiaryContent }
  | { template: "gratitude"; data: GratitudeContent }
  | { template: "mindfulness"; data: MindfulnessContent };

/**
 * 書寫內容一律掛在某個定期事項底下（`routineId`）。
 * 舊備份或已刪除事項留下的內容會是 `null`，介面上仍然讀得到。
 */
export type EntryBlock = BlockContent & { id: string; routineId: string | null };

/** 每日目標，對應「記錄每日的目標」。 */
export interface FocusItem {
  id: string;
  text: string;
  done: boolean;
}

export interface DayEntry {
  date: IsoDate;
  mood: MoodId | null;
  blocks: EntryBlock[];
  focus: FocusItem[];
  createdAt: string;
  updatedAt: string;
}

export type RoutineFrequency =
  | { kind: "daily" }
  /** weekdays 以 0（週日）到 6（週六）表示。 */
  | { kind: "weekly"; weekdays: number[] }
  | { kind: "monthly"; days: number[] }
  | { kind: "interval"; everyDays: number; startDate: IsoDate };

/** 定期事項。設定 `template` 後，打勾時會展開對應格式讓使用者書寫。 */
export interface Routine {
  id: string;
  title: string;
  emoji: string;
  note: string;
  frequency: RoutineFrequency;
  template: TemplateId | null;
  archived: boolean;
  createdAt: string;
}

/** 分享範圍：完整內容，或只公開心情與完成度。 */
export type ShareScope = "full" | "mood";

/** 邀請送出後、對方按下接受之前都是 pending。 */
export type ShareStatus = "pending" | "accepted";

/**
 * 被分享對象。
 *
 * LINE 沒有查詢好友的 API，所以不能輸入對方的帳號來加人：改由分享者送出一次性邀請連結，
 * 對方用 LINE 登入並接受之後才寫入 `lineUserId`，關聯的兩端都是 LINE 驗證過的身分。
 */
export interface ShareRecipient {
  id: string;
  /** 邀請階段是分享者自己寫的稱呼，對方接受後換成 LINE 的顯示名稱。 */
  name: string;
  /** LINE userId（U 開頭）；還沒接受邀請時為 null。 */
  lineUserId: string | null;
  avatarUrl: string | null;
  scope: ShareScope;
  status: ShareStatus;
  /** 一次性邀請碼，組成 `/invite/{code}`。 */
  inviteCode: string;
  createdAt: string;
  acceptedAt: string | null;
}

export interface LineSettings {
  enabled: boolean;
  groupName: string;
  groupId: string;
  /** onComplete：當天有紀錄就送出；manual：只在按下分享時送出。 */
  trigger: "onComplete" | "manual";
}

export interface Profile {
  name: string;
  /** LINE userId，登入後由後端帶入；尚未連接後端時是空字串。 */
  lineUserId: string;
}

export interface AppSettings {
  profile: Profile;
  line: LineSettings;
  recipients: ShareRecipient[];
}

/** 別人分享給我的紀錄本。 */
export interface SharedJournal {
  id: string;
  ownerName: string;
  ownerLineUserId: string;
  emoji: string;
  scope: ShareScope;
  entries: DayEntry[];
}

export interface DailyState {
  version: number;
  entries: Record<IsoDate, DayEntry>;
  routines: Routine[];
  /** 日期 → 當天已完成的定期事項 id。 */
  checks: Record<IsoDate, string[]>;
  settings: AppSettings;
  sharedWithMe: SharedJournal[];
}

export type ThemePreference = "light" | "dark" | "system";
