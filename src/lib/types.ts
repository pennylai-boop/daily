/** 日期一律使用本地時區的 `YYYY-MM-DD` 字串，避免 UTC 位移造成跨日錯誤。 */
export type IsoDate = string;

export type BuiltInMoodId =
  | "radiant"
  | "happy"
  | "calm"
  | "grateful"
  | "neutral"
  | "tired"
  | "anxious"
  | "down"
  | "angry";

/**
 * 自訂心情的 id 一律是 `custom:` 開頭，因此不會和內建的撞名。
 * `(string & {})` 讓內建 id 仍然有自動完成，同時容得下自訂的字串。
 */
export type MoodId = BuiltInMoodId | (string & {});

/** 新使用者一進紀錄頁就是這個心情，沒有特別選過也會以它入帳。 */
export const DEFAULT_MOOD_ID: BuiltInMoodId = "happy";

/**
 * 自訂心情的正負向程度。折線圖需要一個分數，但要使用者自己填 1–5 太抽象，
 * 所以改成挑一個程度，分數與色票由 `src/lib/moods.ts` 換算。
 */
export type MoodLevel = "great" | "good" | "okay" | "low" | "bad";

/** 使用者自己建立的心情。圖示可以是 emoji，也可以是上傳並壓縮過的小圖。 */
export interface CustomMood {
  id: string;
  label: string;
  emoji: string | null;
  /** 壓縮成 96×96 的 data URL；有值時優先於 emoji 顯示。 */
  imageDataUrl: string | null;
  level: MoodLevel;
  createdAt: string;
}

export type TemplateId = "diary" | "gratitude" | "mindfulness" | "timer" | "metric";

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

/** 碼表累積時間，或番茄鐘倒數。秒數寫在當天的內容裡，回顧用來畫曲線。 */
export type TimerMode = "stopwatch" | "pomodoro";

export interface TimerDefaults {
  mode: TimerMode;
  pomodoroMinutes: number;
}

export const DEFAULT_TIMER: TimerDefaults = { mode: "stopwatch", pomodoroMinutes: 25 };

export interface TimerContent {
  mode: TimerMode;
  /** 今天已記入的秒數（不含目前還在跑的那一段）。 */
  totalSeconds: number;
  /** 正在計時時為開始當下的 ISO；暫停或未開始為 null。 */
  runningStartedAt: string | null;
  pomodoroMinutes: number;
  pomodoroDone: number;
}

/** 紀錄格式在建立事項時就定好的欄位，例如體重、腰圍。 */
export interface MetricFieldDef {
  id: string;
  label: string;
  unit: string;
}

export interface MetricContent {
  fields: MetricFieldDef[];
  /** 欄位 id → 數字字串，方便輸入過程保留小數點。 */
  values: Record<string, string>;
}

export type BlockContent =
  | { template: "diary"; data: DiaryContent }
  | { template: "gratitude"; data: GratitudeContent }
  | { template: "mindfulness"; data: MindfulnessContent }
  | { template: "timer"; data: TimerContent }
  | { template: "metric"; data: MetricContent };

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

/** 當天的照片紀錄。上傳時會壓縮，尺寸留著是為了排版時不用等圖片載入。 */
export interface EntryPhoto {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface DayEntry {
  date: IsoDate;
  mood: MoodId | null;
  blocks: EntryBlock[];
  focus: FocusItem[];
  photos: EntryPhoto[];
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
  /** 紀錄格式的欄位；其他格式忽略。 */
  metricFields?: MetricFieldDef[];
  /** 計時格式的預設；其他格式忽略。 */
  timerDefaults?: TimerDefaults;
  archived: boolean;
  createdAt: string;
  /** 登入同步時用來判斷本機／雲端哪一份較新；沒登入過的舊資料以 createdAt 補上。 */
  updatedAt: string;
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

/**
 * 常用的 LINE 群組或好友。
 *
 * 新增時用 LIFF shareTargetPicker 打開 LINE 的好友／群組列表。
 * LINE 不會回傳選到誰，所以本機只記顯示名稱，傳送時再開一次選擇畫面。
 */
export interface LineShareTarget {
  id: string;
  name: string;
  /** 最近一次選用的時間，用來把常用的排前面；從未用過為 null。 */
  lastUsedAt: string | null;
}

export interface LineSettings {
  targets: LineShareTarget[];
}

export interface Profile {
  name: string;
  /** LINE userId，登入後由後端帶入；尚未連接後端時是空字串。 */
  lineUserId: string;
  /** LINE 的 pictureUrl；未登入或對方沒設頭貼時為 null。 */
  avatarUrl: string | null;
}

export interface PepTalkSettings {
  /** 頂部彈層是否顯示；點太陽會關掉，設定頁可再打開。 */
  visible: boolean;
  /**
   * 舊版本機自訂清單，不再使用。金句改為系統預設＋全站共享的 `sharedPepTalks`。
   */
  quotes: string[] | null;
}

/** 使用者新增、全站共享的打氣小語。只有作者能刪。 */
export interface SharedPepTalk {
  id: string;
  text: string;
  userId: string;
  authorName: string;
  createdAt: string;
}

export interface AppSettings {
  profile: Profile;
  line: LineSettings;
  recipients: ShareRecipient[];
  pepTalk: PepTalkSettings;
  /**
   * 無廣告訂閱到期時間（ISO）。真正的來源在伺服器，這裡只是登入後抄下來，
   * 避免每次換頁都先閃出廣告列。
   */
  adFreeUntil: string | null;
}

/** 卜過的卦。免費額度用完之後還看得到上一次問的是什麼。 */
export interface DivinationRecord {
  id: string;
  question: string;
  numbers: number[];
  hexagramName: string;
  changedHexagramName: string;
  movingLine: number;
  analysis: string;
  createdAt: string;
  /** 這一卦是用免費額度還是點數換的。 */
  paidWith: "free" | "credit";
  /**
   * 自己加的附註：當時怎麼讀這一卦、後來實際發生什麼。
   * 卦象與 AI 解讀都不可改，只有這一欄是使用者的。
   */
  note: string;
}

/**
 * 卜卦的額度。
 *
 * 卦算的是當下的天時地利人和，效期大約三個月，所以免費額度也以三個月為一輪；
 * 想在同一輪裡再問，就用點數換。
 */
export interface DivinationState {
  /** 上一次用掉免費額度的時間；null 表示這輪還沒用過。 */
  lastFreeCastAt: string | null;
  /**
   * 點數兌換碼。餘額的真正來源在伺服器，這裡只留憑據：
   * 清掉瀏覽器資料或換裝置後，重新輸入信件裡的同一組碼就能接回剩下的點數。
   */
  creditCode: string | null;
  /** 伺服器回報的剩餘點數，只用來顯示與判斷要不要給按鈕。 */
  credits: number;
  /** 由新到舊，只留最近幾筆。 */
  history: DivinationRecord[];
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

/**
 * 週／月目標條列，形狀與每日目標相同。
 * 週以該週週一（`startOfWeek`）的 ISO 當 key；月以 `YYYY-MM` 當 key。
 */
export type PeriodGoalMap = Record<string, FocusItem[]>;

/** 專心模式的一筆已結束時段。進行中的倒數另外記在 `FocusState.runningStartedAt`。 */
export interface FocusSession {
  id: string;
  date: IsoDate;
  plannedMinutes: number;
  elapsedSeconds: number;
  startedAt: string;
  endedAt: string;
  /** 倒數走完為 true；中途結束為 false。 */
  completed: boolean;
}

/** timed：番茄鐘倒數；open：碼表直接往上加。 */
export type FocusRunKind = "timed" | "open";

export interface FocusState {
  pomodoroMinutes: number;
  runningStartedAt: string | null;
  runningPlannedMinutes: number;
  runningKind: FocusRunKind;
  sessions: FocusSession[];
}

export const DEFAULT_FOCUS: FocusState = {
  pomodoroMinutes: 25,
  runningStartedAt: null,
  runningPlannedMinutes: 25,
  runningKind: "timed",
  sessions: [],
};

export interface DailyState {
  version: number;
  entries: Record<IsoDate, DayEntry>;
  /** 使用者自己加的心情，內建的九種不存在這裡。 */
  customMoods: CustomMood[];
  routines: Routine[];
  /** 日期 → 當天已完成的定期事項 id。 */
  checks: Record<IsoDate, string[]>;
  /** 本週目標，key = 該週週日的 ISO。 */
  weekGoals: PeriodGoalMap;
  /** 本月目標，key = `YYYY-MM`。 */
  monthGoals: PeriodGoalMap;
  settings: AppSettings;
  sharedWithMe: SharedJournal[];
  divination: DivinationState;
  focus: FocusState;
  /** 大家新增的打氣小語（不含系統預設）。離線時用上次拉到的快取。 */
  sharedPepTalks: SharedPepTalk[];
}

/** 橘色＝現況淺色；藍色＝主色改 #262f8b；深色＝原本的深色模式。 */
export type ThemePreference = "orange" | "blue" | "dark";
