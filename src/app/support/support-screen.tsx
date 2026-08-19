"use client";

import { useState } from "react";

import { HeartIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Field, TextInput } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Card, SectionHeading } from "@/components/ui/surfaces";
import { usePlatform } from "@/lib/platform";
import {
  createSponsorInput,
  formatAmount,
  getMethod,
  hasErrors,
  INVOICE_KINDS,
  PRESET_AMOUNTS,
  SPONSOR_METHODS,
  validateSponsor,
  type SponsorErrors,
  type SponsorInput,
  type SponsorMethod,
} from "@/lib/support";

const METHOD_OPTIONS = SPONSOR_METHODS.map((method) => ({
  value: method.id,
  label: method.label,
}));

export function SupportScreen({
  paymentReady,
  invoiceReady,
}: {
  paymentReady: boolean;
  invoiceReady: boolean;
}) {
  const [input, setInput] = useState<SponsorInput>(createSponsorInput);
  const [amountText, setAmountText] = useState(String(createSponsorInput().amount));
  const [errors, setErrors] = useState<SponsorErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

    setPending(true);
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
        setPending(false);
        return;
      }

      // UPP 規定由瀏覽器 form post 到付款頁，這裡送出後就會離開本頁。
      postToGateway(data.action, data.fields);
    } catch {
      setNotice("連線失敗，請確認網路後再試一次。");
      setPending(false);
    }
  };

  return (
    // iOS App 內整塊隱藏，改由 page.tsx 的提示卡片接手（規則見 globals.css 的註解）。
    <div className="hide-in-ios-app mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">支持天天 daily</h1>
        <p className="text-sm leading-relaxed text-ink-muted">
          天天 daily 沒有付費方案，也不放廣告。如果它陪你寫下了一些日子，可以用任意金額贊助，
          讓它繼續維護下去。
        </p>
      </header>

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

        <div className="mt-4 space-y-1.5">
          <label htmlFor="support-amount" className="block text-sm font-medium text-ink-muted">
            自訂金額
          </label>
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
          <p className="text-[13px] text-ink-subtle">
            {method.label}可接受 {method.min.toLocaleString("zh-TW")}～
            {method.max.toLocaleString("zh-TW")} 元。
          </p>
          <FieldError message={errors.amount} />
        </div>

        <div className="mt-4 space-y-1.5">
          <p className="text-sm font-medium text-ink-muted">付款方式</p>
          <Segmented
            options={METHOD_OPTIONS}
            value={input.method}
            ariaLabel="付款方式"
            onChange={(value: SponsorMethod) => patch({ method: value })}
            className="max-w-full"
          />
          <p className="text-[13px] text-ink-subtle">{method.hint}</p>
        </div>
      </Card>

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading
          title="電子發票"
          description="贊助也會開立電子發票，品名固定是「贊助天天 daily」。"
        />

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {INVOICE_KINDS.map((kind) => (
            <button
              key={kind.id}
              type="button"
              onClick={() => patch({ invoiceKind: kind.id })}
              className={cn(
                "flex flex-col items-start gap-0.5 rounded-lg border px-3.5 py-3 text-left transition-colors",
                input.invoiceKind === kind.id
                  ? "border-accent bg-surface-muted ring-2 ring-line"
                  : "border-line-strong hover:bg-surface-muted",
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  input.invoiceKind === kind.id ? "text-accent" : "text-ink",
                )}
              >
                {kind.label}
              </span>
              <span className="text-[13px] leading-relaxed text-ink-muted">{kind.hint}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {input.invoiceKind === "mobile" ? (
            <Field label="手機條碼載具" hint="財政部的手機條碼，斜線加 7 位大寫英數。">
              <TextInput
                value={input.carrierId}
                placeholder="/ABC1234"
                maxLength={8}
                autoCapitalize="characters"
                aria-invalid={Boolean(errors.carrierId)}
                onChange={(event) => patch({ carrierId: event.target.value.toUpperCase() })}
              />
              <FieldError message={errors.carrierId} />
            </Field>
          ) : null}

          {input.invoiceKind === "donate" ? (
            <Field label="愛心碼" hint="社福團體的捐贈碼，3～7 位數字。">
              <TextInput
                value={input.loveCode}
                placeholder="例如 25885"
                inputMode="numeric"
                maxLength={7}
                aria-invalid={Boolean(errors.loveCode)}
                onChange={(event) =>
                  patch({ loveCode: event.target.value.replace(/\D/g, "").slice(0, 7) })
                }
              />
              <FieldError message={errors.loveCode} />
            </Field>
          ) : null}

          {input.invoiceKind === "company" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="統一編號">
                <TextInput
                  value={input.taxId}
                  placeholder="8 位數字"
                  inputMode="numeric"
                  maxLength={8}
                  aria-invalid={Boolean(errors.taxId)}
                  onChange={(event) =>
                    patch({ taxId: event.target.value.replace(/\D/g, "").slice(0, 8) })
                  }
                />
                <FieldError message={errors.taxId} />
              </Field>
              <Field label="公司名稱">
                <TextInput
                  value={input.companyName}
                  placeholder="發票抬頭"
                  maxLength={60}
                  aria-invalid={Boolean(errors.companyName)}
                  onChange={(event) => patch({ companyName: event.target.value })}
                />
                <FieldError message={errors.companyName} />
              </Field>
            </div>
          ) : null}

          <Field
            label={input.invoiceKind === "cloud" ? "信箱" : "信箱（選填）"}
            hint={
              input.invoiceKind === "cloud"
                ? "雲端發票會寄到這個信箱，付款通知也會用它。"
                : "填了會收到發票開立通知。"
            }
          >
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
        </div>

        {!invoiceReady ? (
          <p className="mt-4 rounded-lg bg-paper px-3 py-2 text-[13px] leading-relaxed text-ink-muted">
            這個環境還沒設定 SmilePay 發票憑證，付款會成功但不會自動開票。
          </p>
        ) : null}
      </Card>

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading title="想說的話" description="都是選填，只是讓我知道是誰在支持。" />
        <div className="mt-4 space-y-4">
          <Field label="稱呼" hint="留空就是匿名贊助。">
            <TextInput
              value={input.name}
              placeholder="例如：小葉"
              maxLength={20}
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => patch({ name: event.target.value })}
            />
            <FieldError message={errors.name} />
          </Field>
          <Field label="留言">
            <TextInput
              value={input.message}
              placeholder="例如：每天寫觀心書幫我很多"
              maxLength={100}
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
          <Button
            size="lg"
            disabled={pending || !paymentReady}
            onClick={submit}
            className="shrink-0"
          >
            <HeartIcon className="size-[18px]" />
            {pending ? "前往付款…" : "前往付款"}
          </Button>
        </div>
        <p className="text-[13px] leading-relaxed text-ink-subtle">
          付款由統一金流 PAYUNi 處理，卡號不會經過天天 daily；發票由速買配 SmilePay
          在付款成功後開立。贊助屬於自願支持，不是商品購買，送出後不提供退款。
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

/** 動態組一張隱藏表單送去金流，付款頁需要 top-level 的表單導覽。 */
function postToGateway(action: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.style.display = "none";

  for (const [name, value] of Object.entries(fields)) {
    const field = document.createElement("input");
    field.type = "hidden";
    field.name = name;
    field.value = value;
    form.appendChild(field);
  }

  document.body.appendChild(form);
  form.submit();
}
