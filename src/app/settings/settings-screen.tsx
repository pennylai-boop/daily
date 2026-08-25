"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { LinkIcon, ShareIcon, TrashIcon } from "@/components/icons";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Field, TextInput } from "@/components/ui/field";
import { Segmented, Switch } from "@/components/ui/segmented";
import { Card, Chip, PageHeading, SectionHeading } from "@/components/ui/surfaces";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal";
import { todayIso } from "@/lib/date";
import { copyInviteUrl, shareInvite } from "@/lib/line-invite";
import { signInWithLine, signOutFromLine } from "@/lib/line-auth";
import { DEFAULT_PEP_TALKS, resolvePepTalks } from "@/lib/pep-talk";
import { recordedDates } from "@/lib/stats";
import { useDailyStore } from "@/lib/store";
import { normalizeState } from "@/lib/storage";
import { setThemePreference, useThemePreference } from "@/lib/theme";
import type { Profile, ShareRecipient, ShareScope, ThemePreference } from "@/lib/types";

const THEME_OPTIONS = [
  { value: "light", label: "淺色" },
  { value: "dark", label: "深色" },
  { value: "system", label: "跟隨系統" },
] as const satisfies readonly { value: ThemePreference; label: string }[];

const TRIGGER_OPTIONS = [
  { value: "onComplete", label: "完成當日紀錄時" },
  { value: "manual", label: "只在我按下分享時" },
] as const;

const SCOPE_OPTIONS = [
  { value: "full", label: "完整內容" },
  { value: "mood", label: "只看心情" },
] as const satisfies readonly { value: ShareScope; label: string }[];

export function SettingsScreen() {
  const store = useDailyStore();
  const { state, ready, replaceState } = store;
  const preference = useThemePreference();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { profile, line } = state.settings;

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
        description="帳號、通知與分享、資料備份；打氣小語與法律條款在頁面最下方。"
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
        <SectionHeading
          title="帳號"
          description="只支援 LINE 登入。登入後會帶入名稱與頭貼，顯示名稱可以再改。"
        />
        <AccountPanel
          profile={profile}
          onMessage={setMessage}
        />
      </Card>

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading
          title="傳送到 LINE 群組"
          description={
            <>
              每日紀錄完成後，把當天的內容送到指定的 LINE 群組。
              自動推送需要後端串接 LINE Messaging API（前端無法直接呼叫，token 也不能放在瀏覽器）。
              目前設定會先保存下來；在每日紀錄頁按「分享成圖片」，手機的分享面板選 LINE
              就能立刻送到這個群組。
            </>
          }
          action={
            <Switch
              checked={line.enabled}
              onChange={(enabled) => store.updateLineSettings({ enabled })}
              label="啟用 LINE 通知"
            />
          }
        />

        {line.enabled ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="群組名稱" htmlFor="line-group-name">
                <TextInput
                  id="line-group-name"
                  value={line.groupName}
                  maxLength={30}
                  placeholder="例如：家人群"
                  onChange={(event) => store.updateLineSettings({ groupName: event.target.value })}
                />
              </Field>
              <Field
                label="群組 ID"
                hint="從 LINE Messaging API 的 webhook 取得，格式為 C 開頭的字串。"
                htmlFor="line-group-id"
              >
                <TextInput
                  id="line-group-id"
                  value={line.groupId}
                  placeholder="Cxxxxxxxxxxxxxxxx"
                  onChange={(event) => store.updateLineSettings({ groupId: event.target.value })}
                />
              </Field>
            </div>

            <Field label="傳送時機">
              <Segmented
                options={TRIGGER_OPTIONS}
                value={line.trigger}
                onChange={(trigger) => store.updateLineSettings({ trigger })}
                ariaLabel="傳送時機"
              />
            </Field>
          </div>
        ) : null}
      </Card>

      <ShareCard />

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading
          title="資料"
          description={
            ready
              ? `目前有 ${recordedDates(state).length} 天的紀錄、${state.routines.length} 個定期目標。`
              : "讀取中…"
          }
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportJson} disabled={!ready}>
            匯出 JSON 備份
          </Button>
          <Button variant="secondary" onClick={() => fileInput.current?.click()} disabled={!ready}>
            匯入備份
          </Button>
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
        </div>
      </Card>

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading title="關於天天" />
        <dl className="mt-3 space-y-2 text-[13px]">
          {[
            ["產品名稱", "天天 daily"],
            ["網域", "daily.introvsita.ai"],
            ["使用地區", "台灣（繁體中文）"],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-3">
              <dt className="w-20 shrink-0 text-ink-subtle">{label}</dt>
              <dd className="text-ink-muted">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <PepTalkSettingsCard />

      <LegalLinks />
    </div>
  );
}

/** LINE userId 很長且沒有可讀性，只留頭尾當作連結狀態的佐證。 */
function maskLineUserId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

function AccountPanel({
  profile,
  onMessage,
}: {
  profile: Profile;
  onMessage: (message: string) => void;
}) {
  const store = useDailyStore();
  const [busy, setBusy] = useState(false);
  const loggedIn = Boolean(profile.lineUserId);

  const login = async () => {
    setBusy(true);
    try {
      const result = await signInWithLine();
      if (result.status === "ok") {
        store.applyLineProfile(result.profile);
        onMessage("已用 LINE 登入。");
      } else if (result.status === "unavailable") {
        onMessage(result.reason);
      }
      // redirect：LIFF 會整頁轉走，這裡不用做事。
    } catch {
      onMessage("LINE 登入沒有成功，請稍後再試。");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    if (!window.confirm("確定要登出嗎？這台裝置上的日記與事項會留著，只是解除 LINE 帳號。")) {
      return;
    }
    setBusy(true);
    try {
      await signOutFromLine();
      store.signOut();
      onMessage("已登出。");
    } catch {
      store.signOut();
      onMessage("已登出（本機狀態已清除）。");
    } finally {
      setBusy(false);
    }
  };

  if (!loggedIn) {
    return (
      <div className="mt-4 space-y-3">
        <p className="text-[13px] leading-relaxed text-ink-muted">
          登入後右上角會顯示你的 LINE 頭貼，分享與被分享紀錄也才能對上同一個身分。
        </p>
        <Button type="button" className="w-full sm:w-auto" disabled={busy} onClick={() => void login()}>
          {busy ? "前往 LINE…" : "用 LINE 登入"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center gap-3">
        <ProfileAvatar profile={profile} size={48} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{profile.name || "LINE 使用者"}</p>
          <p className="mt-0.5 truncate text-[13px] text-ink-muted">
            LINE {maskLineUserId(profile.lineUserId)}
          </p>
        </div>
      </div>

      <Field label="顯示名稱" htmlFor="profile-name" hint="會出現在分享邀請裡；可和 LINE 名稱不同。">
        <TextInput
          id="profile-name"
          value={profile.name}
          maxLength={20}
          placeholder="例如：小葉"
          onChange={(event) => store.updateProfile({ name: event.target.value })}
        />
      </Field>

      <Button type="button" variant="secondary" disabled={busy} onClick={() => void logout()}>
        {busy ? "登出中…" : "登出"}
      </Button>
    </div>
  );
}

function PepTalkSettingsCard() {
  const store = useDailyStore();
  const { pepTalk } = store.state.settings;
  const quotes = resolvePepTalks(pepTalk.quotes);
  const usingDefault = pepTalk.quotes === null;
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState(false);

  const filtered = filter.trim()
    ? quotes
        .map((text, index) => ({ text, index }))
        .filter(({ text }) => text.includes(filter.trim()))
    : quotes.map((text, index) => ({ text, index }));

  const shown = expanded ? filtered : filtered.slice(0, 8);

  return (
    <Card className="px-4 py-4 sm:px-5">
      <SectionHeading
        title="打氣小語"
        description="貼在畫面最上方的一句話。點太陽可隱藏，這裡可以重新開啟，也可新增、修改全部金句。"
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
          if (!store.addPepTalkQuote(draft)) return;
          setDraft("");
          setExpanded(true);
        }}
      >
        <TextInput
          value={draft}
          maxLength={120}
          aria-label="新增金句"
          placeholder="新增一則金句…"
          className="flex-1"
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" size="sm" disabled={!draft.trim()} className="shrink-0">
          新增
        </Button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TextInput
          value={filter}
          aria-label="搜尋金句"
          placeholder="搜尋…"
          className="max-w-xs flex-1"
          onChange={(event) => setFilter(event.target.value)}
        />
        <p className="text-[13px] text-ink-muted">
          共 {quotes.length} 則
          {usingDefault ? "（預設）" : "（已自訂）"}
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="ml-auto"
          onClick={() => {
            if (!window.confirm("還原成內建金句？你新增或改過的內容會消失。")) return;
            store.resetPepTalkQuotes();
            setFilter("");
          }}
        >
          還原預設（{DEFAULT_PEP_TALKS.length}）
        </Button>
      </div>

      <ul className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
        {shown.map(({ text, index }) => (
          <li key={`${index}-${text.slice(0, 12)}`} className="flex items-start gap-2">
            <textarea
              value={text}
              rows={1}
              maxLength={120}
              aria-label={`金句 ${index + 1}`}
              className="min-h-10 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-[13px] leading-relaxed text-ink outline-none focus:border-brand"
              onChange={(event) => store.setPepTalkQuote(index, event.target.value)}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label={`刪除金句 ${index + 1}`}
              className="mt-1 size-9 shrink-0 px-0 text-alert"
              onClick={() => store.removePepTalkQuote(index)}
            >
              <TrashIcon className="size-4" />
            </Button>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="py-6 text-center text-[13px] text-ink-muted">沒有符合的金句。</li>
        ) : null}
      </ul>

      {filtered.length > 8 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 w-full"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "收合列表" : `展開全部（還有 ${filtered.length - 8} 則）`}
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
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-subtle">
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

function ShareCard() {
  const store = useDailyStore();
  const { profile, recipients } = store.state.settings;
  const [name, setName] = useState("");
  const [scope, setScope] = useState<ShareScope>("full");
  const [note, setNote] = useState<string | null>(null);

  const send = async (recipient: ShareRecipient) => {
    try {
      const channel = await shareInvite(profile.name, recipient.inviteCode);
      setNote(
        {
          line: "已在 LINE 送出邀請，等對方按下接受。",
          share: "已開啟分享面板，選 LINE 傳給對方。",
          clipboard: "邀請連結已複製，貼到 LINE 傳給對方即可。",
          cancelled: "邀請已建立，隨時可以再分享一次或複製連結。",
        }[channel],
      );
    } catch {
      setNote("分享沒有成功，可以改用「複製連結」。");
    }
  };

  return (
    <Card className="px-4 py-4 sm:px-5">
      <SectionHeading
        title="分享給誰看"
        description={
          <>
            用 LINE 送出邀請，對方接受之後你的紀錄才會出現在他的「被分享紀錄」。
            LINE 不提供查詢好友的 API，所以沒辦法輸入對方的 LINE ID 加人。在 LINE
            裡開啟本站時會跳出 LINE 的好友選擇畫面，其他瀏覽器則會退回系統分享面板或複製連結。
          </>
        }
      />

      {recipients.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {recipients.map((recipient) => (
            <li key={recipient.id}>
              <RecipientRow
                recipient={recipient}
                onScopeChange={(next) => store.updateRecipient(recipient.id, { scope: next })}
                onShare={() => void send(recipient)}
                onCopy={() => {
                  void copyInviteUrl(recipient.inviteCode);
                  setNote("邀請連結已複製。");
                }}
                onRemove={() => store.removeRecipient(recipient.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[13px] text-ink-muted">還沒有分享給任何人。</p>
      )}

      <form
        className="mt-4 space-y-3 border-t border-line pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          const recipient = store.createInvite({ name: name.trim(), scope });
          setName("");
          setScope("full");
          void send(recipient);
        }}
      >
        <TextInput
          value={name}
          maxLength={20}
          aria-label="對方的稱呼"
          placeholder="對方的稱呼（選填，方便自己辨認）"
          onChange={(event) => setName(event.target.value)}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            options={SCOPE_OPTIONS}
            value={scope}
            onChange={setScope}
            ariaLabel="這次邀請的分享範圍"
          />
          <Button type="submit" size="sm">
            <ShareIcon className="size-4" />
            用 LINE 邀請
          </Button>
        </div>
      </form>

      {note ? <p className="mt-3 text-[13px] text-accent">{note}</p> : null}
    </Card>
  );
}

function RecipientRow({
  recipient,
  onScopeChange,
  onShare,
  onCopy,
  onRemove,
}: {
  recipient: ShareRecipient;
  onScopeChange: (scope: ShareScope) => void;
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

      <Segmented
        options={SCOPE_OPTIONS}
        value={recipient.scope}
        onChange={onScopeChange}
        ariaLabel={`${label}的分享範圍`}
      />

      <div className="ml-auto flex items-center gap-1 sm:ml-0">
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
