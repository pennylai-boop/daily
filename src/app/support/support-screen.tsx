"use client";

import { useState } from "react";

import { HeartIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { InfoHint } from "@/components/ui/info-hint";
import { Segmented } from "@/components/ui/segmented";
import { Card, PageHeading, SectionHeading } from "@/components/ui/surfaces";
import { postToGateway } from "@/lib/payment-form";
import { usePlatform } from "@/lib/platform";
import {
  createSponsorInput,
  formatAmount,
  getMethod,
  hasErrors,
  PRESET_AMOUNTS,
  SPONSOR_METHODS,
  MESSAGE_MAX,
  validateFeedback,
  validateSponsor,
  type SponsorErrors,
  type SponsorInput,
  type SponsorMethod,
} from "@/lib/support";

const METHOD_OPTIONS = SPONSOR_METHODS.map((method) => ({
  value: method.id,
  label: method.label,
}));

export function SupportScreen({ paymentReady }: { paymentReady: boolean }) {
  const [input, setInput] = useState<SponsorInput>(createSponsorInput);
  const [amountText, setAmountText] = useState(String(createSponsorInput().amount));
  const [errors, setErrors] = useState<SponsorErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<"pay" | "note" | null>(null);

  const method = getMethod(input.method);
  const patch = (next: Partial<SponsorInput>) => setInput((current) => ({ ...current, ...next }));
  // iOS App 內這一頁不開放（見 globals.css 的 hide-in-ios-app 註解），連送出都直接擋掉。
  const blockedInApp = usePlatform() === "ios";

  const setAmount = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 6);
    setAmountText(digits);
    patch({ amount: digits ? Number(digits) : 0 });
  };

  const submit = async () => {
    if (blockedInApp) return;

    const nextErrors = validateSponsor(input);
    setErrors(nextErrors);
    setNotice(null);
    if (hasErrors(nextErrors)) return;

    setPending("pay");
    try {
      const response = await fetch("/api/support/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await response.json()) as {
        action?: string;
        fields?: Record<string, string>;
        error?: string;
        errors?: SponsorErrors;
      };

      if (!response.ok || !data.action || !data.fields) {
        if (data.errors) setErrors(data.errors);
        setNotice(data.error ?? "建立贊助訂單失敗，請稍後再試。");
        setPending(null);
        return;
      }

      // UPP 規定由瀏覽器 form post 到付款頁，這裡送出後就會離開本頁。
      postToGateway(data.action, data.fields);
    } catch {
      setNotice("連線失敗，請確認網路後再試一次。");
      setPending(null);
    }
  };

  const submitFeedback = async () => {
    if (blockedInApp) return;

    const nextErrors = validateFeedback(input);
    setErrors(nextErrors);
    setNotice(null);
    if (hasErrors(nextErrors)) return;

    setPending("note");
    try {
      const response = await fetch("/api/support/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name,
          email: input.email,
          message: input.message,
        }),
      });
      const data = (await response.json()) as { error?: string; errors?: SponsorErrors };

      if (!response.ok) {
        if (data.errors) setErrors(data.errors);
        setNotice(data.error ?? "留言送出失敗，請稍後再試。");
        setPending(null);
        return;
      }

      setNotice("謝謝你的建議，我們已收到。");
      patch({ message: "" });
      setPending(null);
    } catch {
      setNotice("連線失敗，請確認網路後再試一次。");
      setPending(null);
    }
  };

  return (
    // iOS App 內整塊隱藏，改由 page.tsx 的提示卡片接手（規則見 globals.css 的註解）。
    <div className="hide-in-ios-app mx-auto max-w-2xl space-y-6">
      <PageHeading
        title="支持天天 daily"
        description="天天 daily 沒有付費方案，也不放廣告。如果它陪你寫下了一些日子，可以用任意金額贊助，讓它繼續維護下去。"
      />

      {!paymentReady ? (
        <Card className="px-4 py-4 sm:px-5">
          <p className="text-sm font-medium text-ink">金流尚未設定</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
            這個環境還沒有填入 PAYUNi 的商店代號與串接金鑰（見 .env.example 的「贊助金流」段落），
            所以暫時無法送出付款。表單可以先操作看看。
          </p>
        </Card>
      ) : null}

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading title="贊助金額" description="選一個常用金額，或直接填你想給的數字。" />

        <div className="mt-4 grid grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className={cn(
                "h-11 rounded-lg border text-sm font-medium transition-colors",
                input.amount === preset
                  ? "border-accent bg-surface-muted text-accent ring-2 ring-line"
                  : "border-line-strong text-ink-muted hover:bg-surface-muted hover:text-ink",
              )}
            >
              {preset.toLocaleString("zh-TW")}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-1">
              <label htmlFor="support-amount" className="block text-sm font-medium text-ink-muted">
                自訂金額
              </label>
              <InfoHint label="自訂金額的說明">
                {method.label}可接受 {method.min.toLocaleString("zh-TW")}～
                {method.max.toLocaleString("zh-TW")} 元。
              </InfoHint>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-subtle">NT$</span>
              <TextInput
                id="support-amount"
                value={amountText}
                inputMode="numeric"
                autoComplete="off"
                placeholder="例如 250"
                aria-invalid={Boolean(errors.amount)}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <FieldError message={errors.amount} />
          </div>

          <div className="min-w-0 space-y-1.5 sm:shrink-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-ink-muted">付款方式</p>
              <InfoHint label="付款方式的說明">{method.hint}</InfoHint>
            </div>
            <Segmented
              options={METHOD_OPTIONS}
              value={input.method}
              ariaLabel="付款方式"
              onChange={(value: SponsorMethod) => patch({ method: value })}
            />
          </div>
        </div>
      </Card>

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading
          title="聯絡與留言"
          description="沒有贊助也可以留下使用建議。信箱與留言必填；稱呼可留空。"
        />
        <div className="mt-4 space-y-4">
          <Field label="信箱" hint="付款成功會寄感謝信；送建議時方便我們回覆。">
            <TextInput
              type="email"
              value={input.email}
              placeholder="you@example.com"
              maxLength={80}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              onChange={(event) => patch({ email: event.target.value })}
            />
            <FieldError message={errors.email} />
          </Field>
          <Field label="稱呼" hint="可留空。">
            <TextInput
              value={input.name}
              placeholder="例如：小葉"
              maxLength={20}
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => patch({ name: event.target.value })}
            />
            <FieldError message={errors.name} />
          </Field>
          <Field label="留言" hint={`可寫使用建議、想要的功能，最多 ${MESSAGE_MAX} 字。`}>
            <TextArea
              value={input.message}
              placeholder="例如：希望回顧頁能篩選事項、或每天寫觀心書幫我很多"
              maxLength={MESSAGE_MAX}
              rows={4}
              aria-invalid={Boolean(errors.message)}
              onChange={(event) => patch({ message: event.target.value })}
            />
            <FieldError message={errors.message} />
          </Field>
        </div>
      </Card>

      {notice ? (
        <p className="rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-[13px] text-ink">
          {notice}
        </p>
      ) : null}

      <footer className="space-y-3">
        <div className="card flex items-center justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <p className="text-[13px] text-ink-muted">贊助金額</p>
            <p className="text-xl font-semibold tracking-tight text-ink">
              {formatAmount(input.amount)}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Button
              size="lg"
              variant="secondary"
              disabled={pending !== null}
              onClick={submitFeedback}
            >
              {pending === "note" ? "送出中…" : "送出留言"}
            </Button>
            <Button
              size="lg"
              disabled={pending !== null || !paymentReady}
              onClick={submit}
            >
              <HeartIcon className="size-[18px] text-on-brand" />
              {pending === "pay" ? "前往付款…" : "前往付款"}
            </Button>
          </div>
        </div>
        <p className="text-[13px] leading-relaxed text-ink-subtle">
          不想贊助也可以先「送出留言」。付款由統一金流 PAYUNi 處理，卡號不會經過天天 daily。贊助不開發票；付款成功後會自動寄感謝信到你填的信箱。贊助屬於自願支持，不是商品購買，送出後不提供退款。
        </p>
      </footer>
    </div>
  );
}

/** 設計系統不用紅色，錯誤訊息走 alert 的深灰並加粗。 */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[13px] font-semibold text-alert">{message}</p>;
}

