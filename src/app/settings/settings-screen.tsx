"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ImageIcon, LinkIcon, ShareIcon, TrashIcon } from "@/components/icons";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { TextInput } from "@/components/ui/field";
import { Segmented, Switch } from "@/components/ui/segmented";
import { Card, Chip, PageHeading, SectionHeading } from "@/components/ui/surfaces";
import { SIGN_OUT_CONFIRM, maskLineUserId, performSignOut } from "@/lib/account";
import { AdFreeCard } from "@/components/adfree-card";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal";
import { todayIso } from "@/lib/date";
import { copyInviteUrl, pickLineChat, shareInvite } from "@/lib/line-invite";
import { sessionAccessToken } from "@/lib/session-token";
import { isShareId } from "@/lib/storage";
import { shareDayImage } from "@/lib/share-image";
import { signInWithLine } from "@/lib/line-auth";
import { DEFAULT_PEP_TALKS } from "@/lib/pep-talk";
import { hasContent } from "@/lib/stats";
import {
  addSharedPepTalk,
  refreshRecipients,
  refreshSharedPepTalks,
  removeSharedPepTalk,
  createDayEntry,
  markLineTargetUsed,
  useDailyStore,
} from "@/lib/store";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { normalizeState } from "@/lib/storage";
import { setThemePreference, useThemePreference } from "@/lib/theme";
import type { Profile, ShareRecipient, ThemePreference } from "@/lib/types";

const THEME_OPTIONS = [
  { value: "orange", label: "橘色" },
  { value: "blue", label: "藍色" },
  { value: "dark", label: "深色" },
] as const satisfies readonly { value: ThemePreference; label: string }[];

export function SettingsScreen({
  paymentReady,
  adFreeNotice,
}: {
  paymentReady: boolean;
  adFreeNotice?: string | null;
}) {
  const store = useDailyStore();
  const { state, ready, replaceState } = store;
  const preference = useThemePreference();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { profile } = state.settings;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `daily-${todayIso()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("已匯出備份檔。");
  };

  const importJson = async (file: File) => {
    try {
      const parsed = normalizeState(JSON.parse(await file.text()));
      replaceState(parsed);
      setMessage(`已匯入 ${Object.keys(parsed.entries).length} 天的紀錄。`);
    } catch {
      setMessage("匯入失敗：檔案格式不正確。");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeading
        title="設定"
        description="帳號、無廣告訂閱、分享對象；打氣小語與法律條款在頁面最下方。"
        action={
          <Segmented
            options={THEME_OPTIONS}
            value={preference}
            onChange={setThemePreference}
            ariaLabel="外觀"
          />
        }
      />

      {message ? <p className="text-[13px] text-accent">{message}</p> : null}

      <Card className="px-4 py-4 sm:px-5">
        <AccountPanel
          profile={profile}
          onMessage={setMessage}
        />
      </Card>

      <AdFreeCard paymentReady={paymentReady} notice={adFreeNotice} />

      <ShareTargetsCard />

      <ShareCard />

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading title="關於天天" />
        <div className="mt-3 flex items-start justify-between gap-4">
          <dl className="min-w-0 flex-1 space-y-2 text-[13px]">
            {[
              ["產品名稱", "天天 daily"],
              ["網域", "daily.introvista.ai"],
              ["使用地區", "台灣（繁體中文）"],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <dt className="w-20 shrink-0 text-ink-subtle">{label}</dt>
                <dd className="text-ink-muted">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex shrink-0 flex-col items-stretch gap-2">
            <Button variant="secondary" onClick={exportJson} disabled={!ready}>
              匯出 JSON 備份
            </Button>
            <Button variant="secondary" onClick={() => fileInput.current?.click()} disabled={!ready}>
              匯入備份
            </Button>
          </div>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importJson(file);
            event.target.value = "";
          }}
        />
      </Card>

      <PepTalkSettingsCard />

      <LegalLinks />
    </div>
  );
}

function AccountPanel({
  profile,
  onMessage,
}: {
  profile: Profile;
  onMessage: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const loggedIn = Boolean(profile.lineUserId);

  const login = async () => {
    setBusy(true);
    try {
      const result = await signInWithLine();
      if (result.status === "unavailable") onMessage(result.reason);
      // redirect：瀏覽器會整頁轉去 LINE 的登入頁，回來後由 app-shell 偵測 session 並同步資料。
    } catch {
      onMessage("LINE 登入沒有成功，請稍後再試。");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    if (!window.confirm(SIGN_OUT_CONFIRM)) return;
    setBusy(true);
    const cleared = await performSignOut();
    setBusy(false);
    onMessage(cleared ? "已登出。" : "已登出（本機狀態已清除）。");
  };

  return (
    <>
      <SectionHeading
        title="帳號"
        description="只支援 LINE 登入。登入後會帶入名稱與頭貼。"
        action={
          loggedIn ? undefined : (
            <Button type="button" size="sm" className="shrink-0" disabled={busy} onClick={() => void login()}>
              {busy ? "前往 LINE…" : "用 LINE 登入"}
            </Button>
          )
        }
      />
      {loggedIn ? (
        <div className="mt-4 flex items-center gap-3">
          <ProfileAvatar profile={profile} size={48} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{profile.name || "LINE 使用者"}</p>
            <p className="mt-0.5 truncate text-[13px] text-ink-muted">
              LINE {maskLineUserId(profile.lineUserId)}
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0"
            disabled={busy}
            onClick={() => void logout()}
          >
            {busy ? "登出中…" : "登出"}
          </Button>
        </div>
      ) : null}
    </>
  );
}

function PepTalkSettingsCard() {
  const store = useDailyStore();
  const { pepTalk } = store.state.settings;
  const loggedIn = Boolean(store.state.settings.profile.lineUserId);
  const shared = store.state.sharedPepTalks;
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    void refreshSharedPepTalks();
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const query = filter.trim();
  const sharedShown = query ? shared.filter((item) => item.text.includes(query)) : shared;
  const defaultsShown = query
    ? DEFAULT_PEP_TALKS.filter((text) => text.includes(query))
    : DEFAULT_PEP_TALKS;
  const defaultPreview = expanded ? defaultsShown : defaultsShown.slice(0, 6);

  const submit = async () => {
    setNotice(null);
    setPending(true);
    const error = await addSharedPepTalk(draft);
    setPending(false);
    if (error) {
      setNotice(error);
      return;
    }
    setDraft("");
  };

  return (
    <Card className="px-4 py-4 sm:px-5">
      <SectionHeading
        title="打氣小語"
        description="頂部跑馬燈會輪播系統預設與大家新增的金句。預設不能改；你新增的會給所有人看到，也只有你能刪。"
        action={
          <Switch
            checked={pepTalk.visible}
            onChange={store.setPepTalkVisible}
            label="顯示頂部打氣小語"
          />
        }
      />

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <TextInput
          value={draft}
          maxLength={120}
          aria-label="新增金句"
          placeholder={loggedIn ? "寫一則給大家的金句…" : "登入後才能新增給大家看的金句"}
          className="flex-1"
          disabled={!loggedIn || pending}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" size="sm" disabled={!loggedIn || !draft.trim() || pending} className="shrink-0">
          {pending ? "新增中…" : "新增"}
        </Button>
      </form>
      {notice ? <p className="mt-2 text-[13px] font-semibold text-alert">{notice}</p> : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TextInput
          value={filter}
          aria-label="搜尋金句"
          placeholder="搜尋…"
          className="max-w-xs flex-1"
          onChange={(event) => setFilter(event.target.value)}
        />
        <p className="text-[13px] text-ink-muted">
          大家新增 {shared.length} 則・預設 {DEFAULT_PEP_TALKS.length} 則
        </p>
      </div>

      {sharedShown.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {sharedShown.map((item) => {
            const mine = Boolean(userId && item.userId === userId);
            return (
              <li key={item.id} className="flex items-start gap-2 rounded-lg border border-line bg-surface px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-relaxed text-ink">{item.text}</p>
                  <p className="mt-1 text-[12px] text-ink-subtle">
                    {item.authorName || "朋友"}
                    {mine ? "（你新增的）" : ""}
                  </p>
                </div>
                {mine ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label="刪除這則金句"
                    className="mt-0.5 size-9 shrink-0 px-0 text-alert"
                    onClick={() => {
                      void removeSharedPepTalk(item.id).then((error) => {
                        if (error) setNotice(error);
                      });
                    }}
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-ink-muted">
          {query ? "沒有符合的共享金句。" : "還沒有人新增共享金句。"}
        </p>
      )}

      <p className="mt-5 text-[13px] font-medium text-ink-muted">系統預設（不能刪）</p>
      <ul className="mt-2 max-h-[22rem] space-y-2 overflow-y-auto pr-1">
        {defaultPreview.map((text) => (
          <li
            key={text.slice(0, 24)}
            className="rounded-lg bg-paper-tint px-3 py-2 text-[13px] leading-relaxed text-ink-muted"
          >
            {text}
          </li>
        ))}
        {defaultsShown.length === 0 ? (
          <li className="py-4 text-center text-[13px] text-ink-muted">沒有符合的預設金句。</li>
        ) : null}
      </ul>

      {defaultsShown.length > 6 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 w-full"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "收合預設清單" : `展開預設（還有 ${defaultsShown.length - 6} 則）`}
        </Button>
      ) : null}
    </Card>
  );
}

/** 條款平常不會有人點，收成頁尾一排小灰字連結就夠，全文放獨立頁。 */
function LegalLinks() {
  const linkClass =
    "inline-flex min-h-9 items-center text-xs text-ink-subtle underline-offset-4 transition-colors hover:text-ink-muted hover:underline sm:min-h-0";
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-ink-subtle">
      <Link href="/privacy" className={linkClass}>
        隱私權政策
      </Link>
      <Link href="/terms" className={linkClass}>
        使用條款
      </Link>
      <span>生效日 {LEGAL_EFFECTIVE_DATE}</span>
    </p>
  );
}

/**
 * 常傳的 LINE 群組／對象清單。
 *
 * 按新增會打開 LINE 的好友與群組列表。選完後本機只記顯示名稱，
 * 因為 LINE 基於隱私不會把選到的聊天室身分回給網頁。
 */
function ShareTargetsCard() {
  const store = useDailyStore();
  const { targets } = store.state.settings.line;
  const [name, setName] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [picking, setPicking] = useState(false);

  const addFromLine = async () => {
    setPicking(true);
    setNote(null);
    const result = await pickLineChat();
    setPicking(false);

    if (result === "cancelled") return;
    if (result === "unavailable") {
      setNote("請在 LINE App 內開啟天天 daily，才能從好友與群組列表選取。");
      return;
    }

    const used = new Set(targets.map((target) => target.name));
    let next = name.trim().slice(0, 30);
    if (!next) {
      let index = 1;
      while (used.has(`群組 ${index}`)) index += 1;
      next = `群組 ${index}`;
    } else if (used.has(next)) {
      setNote("這個名稱已經有了，請換一個顯示名稱再選一次。");
      return;
    }
    store.addLineTarget(next);
    setName("");
    setNote(`已加入「${next}」。可再按新增繼續從 LINE 列表選。`);
  };

  const sendToday = async () => {
    const today = todayIso();
    const entry = store.state.entries[today] ?? createDayEntry(today);
    const checkedIds = store.state.checks[today] ?? [];
    if (!hasContent(entry) && checkedIds.length === 0) {
      setNote("今天還沒有紀錄，寫完再到這裡傳送。");
      return;
    }

    setSending(true);
    setNote(null);
    try {
      const preferred = [...targets].sort((a, b) =>
        (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? ""),
      )[0];
      const { result } = await shareDayImage(entry, store.state.routines, checkedIds, store.state.customMoods);
      if (preferred) markLineTargetUsed(preferred.id);
      if (result === "downloaded") {
        setNote(
          preferred
            ? `已下載圖片，傳到 LINE 的「${preferred.name}」即可。`
            : "已下載圖片，可以直接傳到 LINE。",
        );
      } else if (preferred) {
        setNote(`分享面板開好了，選 LINE →「${preferred.name}」送出。`);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setNote("圖片產生失敗，請再試一次。");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="px-4 py-4 sm:px-5">
      <SectionHeading
        title="常傳的 LINE 對象"
        description="按新增會打開 LINE 的好友與群組列表。選取後可填顯示名稱方便辨認；傳送今天會把手帳圖送到你選的聊天室。"
      />

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <TextInput
          id="line-target-name"
          value={name}
          maxLength={30}
          aria-label="顯示名稱"
          placeholder="選填顯示名稱，例如：家人群"
          className="min-w-48 flex-1"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void addFromLine();
            }
          }}
        />
        <Button variant="secondary" disabled={picking} onClick={() => void addFromLine()}>
          {picking ? "開啟 LINE…" : "新增"}
        </Button>
      </div>

      {targets.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {targets.map((target) => (
            <li
              key={target.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2"
            >
              <span className="min-w-0 truncate text-sm text-ink">{target.name}</span>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`移除${target.name}`}
                onClick={() => store.removeLineTarget(target.id)}
              >
                <TrashIcon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {note ? <p className="mt-3 text-[13px] text-accent">{note}</p> : null}

      <div className="mt-4 flex justify-end">
        <Button type="button" disabled={sending} onClick={() => void sendToday()}>
          <ImageIcon className="size-4" />
          {sending ? "產生圖片中…" : "傳送今天"}
        </Button>
      </div>
    </Card>
  );
}

function ShareCard() {
  const store = useDailyStore();
  const { profile, recipients } = store.state.settings;
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"id" | "add" | "line" | null>(null);

  useEffect(() => {
    if (!profile.lineUserId) return;
    void refreshRecipients();
    void (async () => {
      const token = await sessionAccessToken();
      if (!token) return;
      const response = await fetch("/api/share/id", { headers: { Authorization: `Bearer ${token}` } });
      const data = (await response.json()) as { id?: string };
      if (data.id) setShareId(data.id);
    })();
  }, [profile.lineUserId]);

  const sendLink = async (code: string) => {
    try {
      const channel = await shareInvite(profile.name, code);
      setNote(
        {
          line: "已把邀請連結送到 LINE，對方點開後就能在「被分享」看到你的紀錄。",
          share: "已開啟分享面板，選 LINE 把連結傳給對方。",
          clipboard: "邀請連結已複製，貼到 LINE 傳給朋友即可。",
          cancelled: "已取消。可再按一次，或先複製右上角 ID。",
        }[channel],
      );
    } catch {
      await copyInviteUrl(code);
      setNote("邀請連結已複製，貼到 LINE 傳給朋友即可。");
    }
  };

  const copyMyId = async () => {
    if (!shareId) return;
    setBusy("id");
    await copyInviteUrl(shareId);
    setBusy(null);
    setNote("已複製邀請連結。傳給對方，對方在 LINE 點開就能看到你的紀錄。");
  };

  const addById = async () => {
    const token = draft.trim().toUpperCase();
    if (!profile.lineUserId) {
      setNote("要先用 LINE 登入。");
      return;
    }
    if (!isShareId(token)) {
      setNote("請輸入對方 8 碼的分享 ID。");
      return;
    }
    setBusy("add");
    const access = await sessionAccessToken();
    if (!access) {
      setBusy(null);
      setNote("要先用 LINE 登入。");
      return;
    }
    const response = await fetch("/api/share/add-viewer", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${access}` },
      body: JSON.stringify({ token }),
    });
    const data = (await response.json()) as { error?: string; viewerName?: string };
    setBusy(null);
    if (!response.ok) {
      setNote(data.error ?? "新增失敗。");
      return;
    }
    setDraft("");
    setNote(`已把「${data.viewerName ?? "對方"}」加進可以看你紀錄的名單。`);
    void refreshRecipients();
  };

  const inviteOnLine = async () => {
    if (!profile.lineUserId) {
      setNote("要先用 LINE 登入。");
      return;
    }
    setBusy("line");
    const code = shareId ?? (await ensureLocalShareId());
    setBusy(null);
    if (!code) {
      setNote("還不能產生邀請連結，請稍後再試。");
      return;
    }
    void sendLink(code);
  };

  const ensureLocalShareId = async () => {
    const access = await sessionAccessToken();
    if (!access) return null;
    const response = await fetch("/api/share/id", { headers: { Authorization: `Bearer ${access}` } });
    const data = (await response.json()) as { id?: string };
    if (data.id) setShareId(data.id);
    return data.id ?? null;
  };

  return (
    <Card className="px-4 py-4 sm:px-5">
      <SectionHeading
        title="分享給誰看"
        description="把右上角 ID 或邀請連結給對方，對方在 LINE 點開後，你的紀錄會出現在對方的「被分享」。也可以填對方的 ID 直接新增。"
        action={
          shareId ? (
            <button
              type="button"
              onClick={() => void copyMyId()}
              className="shrink-0 rounded-lg border border-line-strong bg-surface px-2.5 py-1 font-mono text-[13px] font-semibold tracking-wide text-ink hover:bg-surface-muted"
              aria-label={`複製分享 ID ${shareId}`}
            >
              ID {shareId}
            </button>
          ) : profile.lineUserId ? (
            <span className="text-[13px] text-ink-subtle">{busy === "id" ? "…" : "讀取 ID…"}</span>
          ) : null
        }
      />

      {recipients.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {recipients.map((recipient) => (
            <li key={recipient.id}>
              <RecipientRow
                recipient={recipient}
                onShare={() => void sendLink(recipient.inviteCode || shareId || "")}
                onCopy={() => {
                  void copyInviteUrl(recipient.inviteCode || shareId || "");
                  setNote("邀請連結已複製。");
                }}
                onRemove={() => store.removeRecipient(recipient.id)}
              />
            </li>
          ))}
        </ul>
      ) : null}

      <form
        className="mt-4 space-y-3 border-t border-line pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          void addById();
        }}
      >
        <TextInput
          value={draft}
          maxLength={20}
          aria-label="對方的分享 ID"
          placeholder="對方的 ID（8 碼）"
          className="font-mono uppercase"
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="submit" size="sm" variant="secondary" disabled={busy !== null}>
            {busy === "add" ? "新增中…" : "新增"}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={busy !== null}
            onClick={() => void inviteOnLine()}
          >
            <ShareIcon className="size-4" />
            {busy === "line" ? "複製中…" : "用 LINE 邀請"}
          </Button>
        </div>
      </form>

      {note ? <p className="mt-3 text-[13px] text-accent">{note}</p> : null}
    </Card>
  );
}

function RecipientRow({
  recipient,
  onShare,
  onCopy,
  onRemove,
}: {
  recipient: ShareRecipient;
  onShare: () => void;
  onCopy: () => void;
  onRemove: () => void;
}) {
  const accepted = recipient.status === "accepted";
  const label = recipient.name.trim() || "待接受的邀請";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-xl border border-line px-3.5 py-3">
      <div className="flex w-full min-w-0 items-center gap-2.5 sm:w-auto sm:flex-1">
        <span
          aria-hidden
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-medium",
            accepted ? "bg-accent text-on-accent" : "bg-paper text-ink-subtle",
          )}
        >
          {accepted ? label.slice(0, 1) : "?"}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-ink">{label}</span>
            <Chip tone={accepted ? "accent" : "neutral"}>{accepted ? "已接受" : "待接受"}</Chip>
          </p>
          <p className="mt-0.5 truncate text-[13px] text-ink-muted">
            {accepted
              ? `LINE ${maskLineUserId(recipient.lineUserId ?? "")}`
              : `邀請碼 ${recipient.inviteCode}`}
          </p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {accepted ? null : (
          <>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`再分享一次${label}`}
              className="size-9 px-0 sm:size-8"
              onClick={onShare}
            >
              <ShareIcon className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`複製${label}的連結`}
              className="size-9 px-0 sm:size-8"
              onClick={onCopy}
            >
              <LinkIcon className="size-4" />
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant="ghost"
          aria-label={`移除${label}`}
          className="size-9 px-0 text-alert sm:size-8"
          onClick={onRemove}
        >
          <TrashIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
