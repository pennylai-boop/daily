import { addDays, todayIso } from "./date";
import { isRoutineDueOn } from "./routines";
import { createId, createInviteCode, STORE_VERSION } from "./storage";
import type {
  AppSettings,
  DailyState,
  DayEntry,
  MindfulnessChannel,
  MindfulnessMark,
  MoodId,
  Routine,
  SharedJournal,
} from "./types";

const DEMO_MOODS: MoodId[] = [
  "calm",
  "happy",
  "grateful",
  "tired",
  "radiant",
  "neutral",
  "anxious",
  "down",
];

const DEMO_DIARIES = [
  {
    title: "散步的傍晚",
    body: "下班後沿著河堤走了三十分鐘，風很涼。走著走著才發現，最近很少讓自己什麼都不做。",
  },
  {
    title: "會議之後",
    body: "提案被追問了很多細節，一開始有點慌，後來想起來自己準備得很足。回家煮了一碗麵，補上今天沒吃的午餐。",
  },
  {
    title: "重新開始的一天",
    body: "早上六點起床，把桌面整理乾淨。清出空間之後，思緒也跟著清楚了一些。",
  },
  {
    title: "和朋友的通話",
    body: "聊了快兩個小時，很久沒有這樣笑到肚子痛。有些關係不需要常常聯絡，也依然穩固。",
  },
];

const DEMO_GRATITUDES = [
  ["同事幫忙分擔了報表", "巷口的豆漿店還沒關", "捷運剛好有位子", "傍晚的雲很漂亮", "身體還算健康"],
  ["媽媽打電話來", "把待辦清空了", "咖啡剛好喝", "下雨前趕到家", "有人記得我的名字"],
  ["早上準時起床", "午餐吃到想吃的", "讀完一章書", "貓來蹭我的腳", "今天沒有加班"],
];

/** 觀心書的示範內容，依身、口、意分組，記號分別是做得好、要調整、要練習。 */
const DEMO_MINDFULNESS: [MindfulnessChannel, MindfulnessMark, string][][] = [
  [
    ["body", "plus", "早上六點就起床，做完了十分鐘伸展。"],
    ["body", "minus", "急件一來就整天沒離開椅子，肩膀又緊了。"],
    ["body", "todo", "每工作一小時起來走動一次。"],
    ["speech", "minus", "被追問細節時語氣有點衝。"],
    ["speech", "todo", "先聽完再回應，不急著解釋。"],
    ["mind", "plus", "願意承認自己其實是累了，不是能力不夠。"],
    ["mind", "minus", "心裡一直在想「為什麼總是我」。"],
  ],
  [
    ["body", "plus", "把桌面整理乾淨才開始工作。"],
    ["body", "todo", "晚上十一點前放下手機。"],
    ["speech", "plus", "主動謝謝幫我看文件的同事。"],
    ["mind", "minus", "看到別人升遷，湧上一股說不出的失落。"],
    ["mind", "plus", "發現自己是拿別人的時間表在量自己的路。"],
    ["mind", "todo", "每天寫下一件自己做到的事。"],
  ],
];

function demoMindfulness(seed: number) {
  return {
    items: DEMO_MINDFULNESS[seed % DEMO_MINDFULNESS.length].map(([channel, mark, text]) => ({
      id: createId(),
      channel,
      mark,
      text,
    })),
  };
}

const DEMO_ROUTINES: Omit<Routine, "id" | "createdAt">[] = [
  {
    title: "寫日記",
    emoji: "✍️",
    note: "",
    frequency: { kind: "daily" },
    template: "diary",
    archived: false,
  },
  {
    title: "五感恩",
    emoji: "❤️",
    note: "睡前回想今天",
    frequency: { kind: "daily" },
    template: "gratitude",
    archived: false,
  },
  {
    title: "觀心書",
    emoji: "💭",
    note: "情緒起伏較大的日子",
    frequency: { kind: "weekly", weekdays: [0, 3] },
    template: "mindfulness",
    archived: false,
  },
  {
    title: "靜坐十分鐘",
    emoji: "🧘",
    note: "起床後、盥洗前",
    frequency: { kind: "daily" },
    template: null,
    archived: false,
  },
  {
    title: "喝滿 2000ml 水",
    emoji: "💧",
    note: "",
    frequency: { kind: "daily" },
    template: null,
    archived: false,
  },
  {
    title: "重量訓練",
    emoji: "🏃",
    note: "上肢 / 下肢交替",
    frequency: { kind: "weekly", weekdays: [1, 3, 5] },
    template: null,
    archived: false,
  },
  {
    title: "閱讀 20 頁",
    emoji: "📖",
    note: "",
    frequency: { kind: "weekly", weekdays: [0, 2, 4, 6] },
    template: null,
    archived: false,
  },
  {
    title: "月初記帳盤點",
    emoji: "💰",
    note: "整理上個月的收支",
    frequency: { kind: "monthly", days: [1] },
    template: null,
    archived: false,
  },
];

/** 產生約六週的示範資料，讓日曆與統計一眼就能看出樣貌。 */
export function buildDemoState(): DailyState {
  const today = todayIso();
  const routines: Routine[] = DEMO_ROUTINES.map((routine, index) => ({
    ...routine,
    id: createId(),
    createdAt: new Date(Date.now() - (index + 1) * 86_400_000).toISOString(),
  }));

  const diaryRoutine = routines.find((routine) => routine.template === "diary")!;
  const gratitudeRoutine = routines.find((routine) => routine.template === "gratitude")!;
  const mindfulnessRoutine = routines.find((routine) => routine.template === "mindfulness")!;

  const entries: DailyState["entries"] = {};
  const checks: DailyState["checks"] = {};

  for (let offset = 41; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset);
    const seed = (offset * 7919) % 97;

    // 刻意留下空白的日子，讓日曆看起來像真實的使用軌跡。
    if (seed % 11 === 0) continue;

    const now = new Date().toISOString();
    const entry: DayEntry = {
      date,
      mood: DEMO_MOODS[seed % DEMO_MOODS.length],
      blocks: [],
      focus: [],
      photos: [],
      createdAt: now,
      updatedAt: now,
    };

    const writtenRoutineIds: string[] = [];

    if (seed % 3 === 0) {
      const diary = DEMO_DIARIES[seed % DEMO_DIARIES.length];
      entry.blocks.push({
        id: createId(),
        routineId: diaryRoutine.id,
        template: "diary",
        data: { ...diary },
      });
      writtenRoutineIds.push(diaryRoutine.id);
    }
    if (seed % 4 === 1) {
      entry.blocks.push({
        id: createId(),
        routineId: gratitudeRoutine.id,
        template: "gratitude",
        data: { items: [...DEMO_GRATITUDES[seed % DEMO_GRATITUDES.length]] },
      });
      writtenRoutineIds.push(gratitudeRoutine.id);
    }
    if (seed % 7 === 2 && isRoutineDueOn(mindfulnessRoutine, date)) {
      entry.blocks.push({
        id: createId(),
        routineId: mindfulnessRoutine.id,
        template: "mindfulness",
        data: demoMindfulness(seed),
      });
      writtenRoutineIds.push(mindfulnessRoutine.id);
    }
    if (entry.blocks.length === 0) {
      entry.blocks.push({
        id: createId(),
        routineId: diaryRoutine.id,
        template: "diary",
        data: { title: "", body: "今天沒什麼特別的事，安穩地過完了。" },
      });
      writtenRoutineIds.push(diaryRoutine.id);
    }

    if (offset <= 2) {
      entry.focus = [
        { id: createId(), text: "把提案的架構寫完", done: offset !== 0 },
        { id: createId(), text: "十一點前上床", done: seed % 2 === 0 },
      ];
    }

    entries[date] = entry;

    const doneIds = new Set(writtenRoutineIds);
    routines.forEach((routine, index) => {
      if (routine.template !== null) return;
      if (isRoutineDueOn(routine, date) && (seed + index) % 3 !== 0) doneIds.add(routine.id);
    });
    if (doneIds.size > 0) checks[date] = [...doneIds];
  }

  return {
    version: STORE_VERSION,
    entries,
    customMoods: [],
    routines,
    checks,
    weekGoals: {},
    monthGoals: {},
    settings: buildDemoSettings(),
    sharedWithMe: buildDemoSharedJournals(),
  };
}

function buildDemoSettings(): AppSettings {
  const now = new Date().toISOString();
  return {
    profile: {
      name: "小葉",
      lineUserId: "Ud41f2a9c7b0e5163",
      // 示範用頭貼（公開示意圖）；正式 LINE 登入會換成 pictureUrl。
      avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=daily-yeh",
    },
    line: {
      enabled: true,
      groupName: "家人群",
      groupId: "Cf1a2b3c4d5e6f7a8",
      trigger: "onComplete",
    },
    recipients: [
      {
        id: createId(),
        name: "阿霖",
        lineUserId: "U7c0b3e91a24d5f68",
        avatarUrl: null,
        scope: "full",
        status: "accepted",
        inviteCode: createInviteCode(),
        createdAt: now,
        acceptedAt: now,
      },
      {
        id: createId(),
        name: "小魚",
        lineUserId: "U2e5d8a3f61c04b79",
        avatarUrl: null,
        scope: "mood",
        status: "accepted",
        inviteCode: createInviteCode(),
        createdAt: now,
        acceptedAt: now,
      },
      {
        id: createId(),
        name: "還沒回覆的朋友",
        lineUserId: null,
        avatarUrl: null,
        scope: "full",
        status: "pending",
        inviteCode: createInviteCode(),
        createdAt: now,
        acceptedAt: null,
      },
    ],
    pepTalk: { visible: true, quotes: null },
  };
}

/** 模擬別人分享給我的紀錄；正式版會由後端依接受過的邀請關聯回傳。 */
function buildDemoSharedJournals(): SharedJournal[] {
  const today = todayIso();
  const now = new Date().toISOString();

  const day = (
    offset: number,
    mood: MoodId,
    blocks: DayEntry["blocks"],
    focus: DayEntry["focus"] = [],
  ): DayEntry => ({
    date: addDays(today, -offset),
    mood,
    blocks,
    focus,
    photos: [],
    createdAt: now,
    updatedAt: now,
  });

  return [
    {
      id: createId(),
      ownerName: "阿霖",
      ownerLineUserId: "U7c0b3e91a24d5f68",
      emoji: "🌿",
      scope: "full",
      entries: [
        day(
          0,
          "calm",
          [
            {
              id: createId(),
              routineId: null,
              template: "gratitude",
              data: {
                items: [
                  "早上的陽光剛好落在書桌上",
                  "同事主動幫我看了一份文件",
                  "午餐的湯很暖",
                  "回家路上聽到喜歡的歌",
                  "今天沒有滑手機到太晚",
                ],
              },
            },
          ],
          [{ id: createId(), text: "把讀書會的講稿寫完", done: true }],
        ),
        day(1, "tired", [
          {
            id: createId(),
            routineId: null,
            template: "diary",
            data: {
              title: "有點超載的一天",
              body: "連著三個會議，中間只來得及喝水。晚上什麼都不想做，就坐在陽台看了一會兒天空。發現只要有十分鐘不被打擾，就能把自己接回來。",
            },
          },
        ]),
        day(3, "anxious", [
          {
            id: createId(),
            routineId: null,
            template: "mindfulness",
            data: {
              items: [
                { id: createId(), channel: "body", mark: "minus", text: "翻來覆去睡不著，只睡了四個小時。" },
                { id: createId(), channel: "body", mark: "todo", text: "十一點洗完澡就關燈。" },
                { id: createId(), channel: "speech", mark: "plus", text: "老實跟主管說時程有風險。" },
                { id: createId(), channel: "mind", mark: "minus", text: "「一定做不完」「別人會覺得我不夠好」。" },
                {
                  id: createId(),
                  channel: "mind",
                  mark: "plus",
                  text: "焦慮是因為任務還沒拆開，腦袋裡都是一整團。",
                },
                { id: createId(), channel: "mind", mark: "todo", text: "先寫下三件明天要做的事。" },
              ],
            },
          },
        ]),
      ],
    },
    {
      id: createId(),
      ownerName: "小魚",
      ownerLineUserId: "U2e5d8a3f61c04b79",
      emoji: "🐟",
      scope: "mood",
      entries: [
        day(0, "happy", []),
        day(1, "grateful", []),
        day(2, "neutral", []),
        day(4, "radiant", []),
      ],
    },
  ];
}
