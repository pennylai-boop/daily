"use client";

import { useRef, useState } from "react";

import { Button, LinkButton } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Field, TextInput } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Card, PageHeading, SectionHeading } from "@/components/ui/surfaces";
import {
  BEST_VALUE_PACK_ID,
  CREDIT_PACKS,
  formatPricePerCredit,
  formatRedeemCode,
  isRedeemCodeShaped,
  normalizeRedeemCode,
  type CreditPack,
} from "@/lib/divination-credits";
import {
  createInvoiceInput,
  hasInvoiceErrors,
  INVOICE_KINDS,
  validateInvoice,
  type InvoiceErrors,
  type InvoiceInput,
  type InvoiceKind,
} from "@/lib/invoice";
import { postToGateway } from "@/lib/payment-form";
import { useDailyStore } from "@/lib/store";
import { getMethod, SPONSOR_METHODS, type SponsorMethod } from "@/lib/support";

const METHOD_OPTIONS = SPONSOR_METHODS.map((method) => ({
  value: method.id,
  label: method.label,
}));

const INVOICE_OPTIONS = INVOICE_KINDS.map((kind) => ({ value: kind.id, label: kind.label }));

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function CreditsScreen({ paymentReady }: { paymentReady: boolean }) {
  const { state, ready, setDivinationCredits, clearDivinationCredits } = useDailyStore();
  const [method, setMethod] = useState<SponsorMethod>("credit");
  const [email, setEmail] = useState("");
  const [invoice, setInvoice] = useState<InvoiceInput>(createInvoiceInput);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [invoiceErrors, setInvoiceErrors] = useState<InvoiceErrors>({});
  const [pendingPack, setPendingPack] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const invoiceFieldRef = useRef<HTMLInputElement>(null);

  const limits = getMethod(method);

  const patchInvoice = (patch: Partial<InvoiceInput>) => {
    setInvoice((current) => ({ ...current, ...patch }));
    setInvoiceErrors({});
  };

  /** 回傳是否可以送出；不行的話把焦點移到第一個有問題的欄位。 */
  const validate = (): boolean => {
    const nextEmailError = EMAIL_PATTERN.test(email.trim())
      ? null
      : "請填寫正確的信箱，兌換碼會寄到這裡。";
    const nextInvoiceErrors = validateInvoice(invoice);

    setEmailError(nextEmailError);
    setInvoiceErrors(nextInvoiceErrors);

    if (nextEmailError) {
      emailRef.current?.focus();
      return false;
    }
    if (hasInvoiceErrors(nextInvoiceErrors)) {
      invoiceFieldRef.current?.focus();
      return false;
    }
    return true;
  };

  const buy = async (pack: CreditPack) => {
    setNotice(null);
    if (!validate()) return;

    setPendingPack(pack.id);
    try {
      const response = await fetch("/api/divination/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack.id, method, email, invoice }),
      });
      const data = (await response.json()) as {
        action?: string;
        fields?: Record<string, string>;
        error?: string;
        invoiceErrors?: InvoiceErrors;
      };

      if (!response.ok || !data.action || !data.fields) {
        if (data.invoiceErrors) setInvoiceErrors(data.invoiceErrors);
        setNotice(data.error ?? "建立訂單失敗，請稍後再試。");
        setPendingPack(null);
        return;
      }

      postToGateway(data.action, data.fields);
    } catch {
      setNotice("連線失敗，請確認網路後再試一次。");
      setPendingPack(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeading
        title="卜卦點數"
        description="一點卜一次。每三個月有一次免費卜卦，想在同一輪裡再問就用點數。付款成功後兌換碼與發票會寄到你的信箱，點數餘額記在我們這邊，換裝置也接得回來。"
        action={
          <LinkButton variant="ghost" href="/divination">
            回到卜卦
          </LinkButton>
        }
      />

      <RedeemCard
        ready={ready}
        code={state.divination.creditCode}
        credits={state.divination.credits}
        onRedeemed={setDivinationCredits}
        onCleared={clearDivinationCredits}
      />

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading title="付款與發票" description="兌換碼和發票都會寄到這個信箱。" />

        <div className="mt-4 space-y-4">
          <Field label="付款方式" hint={limits.hint}>
            <Segmented
              ariaLabel="付款方式"
              value={method}
              options={METHOD_OPTIONS}
              onChange={setMethod}
            />
          </Field>

          <Field label="信箱" htmlFor="credits-email">
            <TextInput
              id="credits-email"
              ref={emailRef}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError(null);
              }}
              placeholder="you@example.com"
              inputMode="email"
              autoComplete="email"
              aria-invalid={emailError ? true : undefined}
            />
          </Field>
          <FieldError message={emailError ?? undefined} />

          <Field label="發票" hint={INVOICE_KINDS.find((k) => k.id === invoice.kind)?.hint}>
            <Segmented
              ariaLabel="發票類型"
              value={invoice.kind}
              options={INVOICE_OPTIONS}
              onChange={(kind) => patchInvoice({ kind: kind as InvoiceKind })}
              className="flex-wrap"
            />
          </Field>

          <InvoiceFields
            invoice={invoice}
            errors={invoiceErrors}
            firstFieldRef={invoiceFieldRef}
            onChange={patchInvoice}
          />
        </div>
      </Card>

      <Card className="px-4 py-4 sm:px-5">
        <SectionHeading title="儲值方案" description="買得越多，每點越便宜。點數沒有期限。" />

        {notice ? <p className="mt-3 text-[13px] font-semibold text-alert">{notice}</p> : null}

        {!paymentReady ? (
          <p className="mt-3 text-[13px] text-ink-subtle">金流尚未設定，暫時無法儲值。</p>
        ) : null}

        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {CREDIT_PACKS.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              best={pack.id === BEST_VALUE_PACK_ID}
              outOfRange={pack.amount < limits.min || pack.amount > limits.max}
              methodLabel={limits.label}
              disabled={!paymentReady || pendingPack !== null}
              pending={pendingPack === pack.id}
              onBuy={() => void buy(pack)}
            />
          ))}
        </ul>
      </Card>
    </div>
  );
}

function PackCard({
  pack,
  best,
  outOfRange,
  methodLabel,
  disabled,
  pending,
  onBuy,
}: {
  pack: CreditPack;
  best: boolean;
  outOfRange: boolean;
  methodLabel: string;
  disabled: boolean;
  pending: boolean;
  onBuy: () => void;
}) {
  return (
    <li
      className={cn(
        "flex flex-col rounded-xl border px-3.5 py-3.5",
        best ? "border-brand bg-brand-tint/30" : "border-line-strong",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{pack.label}</p>
        {best ? (
          <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-on-brand">
            最划算
          </span>
        ) : null}
      </div>

      <p className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums text-ink">
          {pack.amount.toLocaleString("zh-TW")}
        </span>
        <span className="text-[13px] text-ink-muted">元</span>
      </p>
      <p className="text-[13px] tabular-nums text-ink-muted">{pack.credits.toLocaleString("zh-TW")} 點</p>
      <p className="text-[12px] tabular-nums text-ink-subtle">
        約 {formatPricePerCredit(pack)} 元/點
      </p>

      <div className="mt-3.5">
        {outOfRange ? (
          <p className="text-[12px] leading-relaxed text-ink-subtle">
            這個金額不能用{methodLabel}，請改用信用卡。
          </p>
        ) : (
          <Button
            variant={best ? "primary" : "outline"}
            className="w-full"
            disabled={disabled}
            onClick={onBuy}
          >
            {pending ? "前往付款…" : "立即付款"}
          </Button>
        )}
      </div>
    </li>
  );
}

function InvoiceFields({
  invoice,
  errors,
  firstFieldRef,
  onChange,
}: {
  invoice: InvoiceInput;
  errors: InvoiceErrors;
  firstFieldRef: React.RefObject<HTMLInputElement | null>;
  onChange: (patch: Partial<InvoiceInput>) => void;
}) {
  if (invoice.kind === "mobile") {
    return (
      <div className="space-y-1.5">
        <Field label="手機條碼" htmlFor="invoice-carrier">
          <TextInput
            id="invoice-carrier"
            ref={firstFieldRef}
            value={invoice.carrierId}
            onChange={(event) => onChange({ carrierId: event.target.value })}
            placeholder="/ABC1234"
            autoComplete="off"
            spellCheck={false}
            className="font-mono uppercase"
            aria-invalid={errors.carrierId ? true : undefined}
          />
        </Field>
        <FieldError message={errors.carrierId} />
      </div>
    );
  }

  if (invoice.kind === "donate") {
    return (
      <div className="space-y-1.5">
        <Field label="愛心碼" htmlFor="invoice-love">
          <TextInput
            id="invoice-love"
            ref={firstFieldRef}
            value={invoice.loveCode}
            onChange={(event) => onChange({ loveCode: event.target.value })}
            placeholder="例如 25885"
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={errors.loveCode ? true : undefined}
          />
        </Field>
        <FieldError message={errors.loveCode} />
      </div>
    );
  }

  if (invoice.kind === "company") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Field label="統一編號" htmlFor="invoice-tax-id">
            <TextInput
              id="invoice-tax-id"
              ref={firstFieldRef}
              value={invoice.taxId}
              onChange={(event) => onChange({ taxId: event.target.value })}
              placeholder="12345678"
              inputMode="numeric"
              autoComplete="off"
              maxLength={8}
              aria-invalid={errors.taxId ? true : undefined}
            />
          </Field>
          <FieldError message={errors.taxId} />
        </div>
        <div className="space-y-1.5">
          <Field label="公司名稱" htmlFor="invoice-company">
            <TextInput
              id="invoice-company"
              value={invoice.companyName}
              onChange={(event) => onChange({ companyName: event.target.value })}
              placeholder="○○有限公司"
              autoComplete="organization"
              aria-invalid={errors.companyName ? true : undefined}
            />
          </Field>
          <FieldError message={errors.companyName} />
        </div>
      </div>
    );
  }

  return null;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[13px] font-semibold text-alert">{message}</p>;
}

function RedeemCard({
  ready,
  code,
  credits,
  onRedeemed,
  onCleared,
}: {
  ready: boolean;
  code: string | null;
  credits: number;
  onRedeemed: (code: string, remaining: number) => void;
  onCleared: () => void;
}) {
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    const normalized = normalizeRedeemCode(input);
    if (!isRedeemCodeShaped(normalized)) {
      setNotice("兌換碼是 12 位英數字，請對照信件再輸入一次。");
      return;
    }

    setNotice(null);
    setPending(true);
    try {
      const response = await fetch("/api/divination/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized }),
      });
      const data = (await response.json()) as {
        code?: string;
        remaining?: number;
        error?: string;
      };

      if (!response.ok || !data.code || typeof data.remaining !== "number") {
        setNotice(data.error ?? "兌換失敗，請稍後再試。");
        return;
      }

      onRedeemed(data.code, data.remaining);
      setInput("");
      setNotice(
        data.remaining > 0
          ? `已接上這組兌換碼，還有 ${data.remaining} 點。`
          : "這組兌換碼的點數已經用完了。",
      );
    } catch {
      setNotice("連線失敗，請確認網路後再試一次。");
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="px-4 py-4 sm:px-5">
      <SectionHeading
        title="已經有兌換碼"
        description="換手機或清掉瀏覽器資料之後，輸入信件裡的同一組碼就能接回剩下的點數。"
      />

      {ready && code ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-surface-muted/60 px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold tabular-nums text-ink">目前還有 {credits} 點</p>
            <p className="font-mono text-[13px] text-ink-subtle">{formatRedeemCode(code)}</p>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={onCleared}>
            移除
          </Button>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div className="min-w-52 flex-1">
          <Field label="兌換碼" htmlFor="redeem-code">
            <TextInput
              id="redeem-code"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="XXXX-XXXX-XXXX"
              autoComplete="off"
              spellCheck={false}
              className="font-mono uppercase"
            />
          </Field>
        </div>
        <Button variant="secondary" onClick={submit} disabled={pending || !input.trim()}>
          {pending ? "確認中…" : "確認"}
        </Button>
      </div>

      {notice ? <p className="mt-2 text-[13px] text-ink-muted">{notice}</p> : null}
    </Card>
  );
}
