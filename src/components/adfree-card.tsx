"use client";

import { useEffect, useRef, useState } from "react";

import { InvoiceFields, FieldError } from "@/components/invoice-fields";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Card, SectionHeading } from "@/components/ui/surfaces";
import { ADFREE_AMOUNT, formatAdFreeUntil, isAdFreeActive } from "@/lib/adfree";
import { startAdFreeCheckout } from "@/lib/adfree-checkout";
import {
  createInvoiceInput,
  hasInvoiceErrors,
  INVOICE_KINDS,
  validateInvoice,
  type InvoiceErrors,
  type InvoiceInput,
  type InvoiceKind,
} from "@/lib/invoice";
import { formatAmount } from "@/lib/support";
import { signInWithLine } from "@/lib/line-auth";
import { refreshAdFreeStatus, useDailyStore } from "@/lib/store";
import { getMethod, SPONSOR_METHODS, type SponsorMethod } from "@/lib/support";

const METHOD_OPTIONS = SPONSOR_METHODS.map((method) => ({
  value: method.id,
  label: method.label,
}));

const INVOICE_OPTIONS = INVOICE_KINDS.map((kind) => ({ value: kind.id, label: kind.label }));

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function AdFreeCard({
  paymentReady,
  notice,
}: {
  paymentReady: boolean;
  notice?: string | null;
}) {
  const { state, ready } = useDailyStore();
  const loggedIn = Boolean(state.settings.profile.lineUserId);
  const until = state.settings.adFreeUntil;
  const active = isAdFreeActive(until);

  const [method, setMethod] = useState<SponsorMethod>("credit");
  const [email, setEmail] = useState("");
  const [invoice, setInvoice] = useState<InvoiceInput>(createInvoiceInput);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [invoiceErrors, setInvoiceErrors] = useState<InvoiceErrors>({});
  const [pending, setPending] = useState(false);
  const [localNotice, setLocalNotice] = useState<string | null>(notice ?? null);
  const [loginBusy, setLoginBusy] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const invoiceFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loggedIn) void refreshAdFreeStatus();
  }, [loggedIn]);

  useEffect(() => {
    if (notice) setLocalNotice(notice);
  }, [notice]);

  const patchInvoice = (patch: Partial<InvoiceInput>) => {
    setInvoice((current) => ({ ...current, ...patch }));
    setInvoiceErrors({});
  };

  const login = async () => {
    setLoginBusy(true);
    const result = await signInWithLine();
    if (result.status === "unavailable") setLocalNotice(result.reason);
    setLoginBusy(false);
  };

  const submit = async () => {
    setLocalNotice(null);
    const nextEmailError = EMAIL_PATTERN.test(email.trim())
      ? null
      : "請填寫正確的信箱，發票會寄到這裡。";
    const nextInvoiceErrors = validateInvoice(invoice);
    setEmailError(nextEmailError);
    setInvoiceErrors(nextInvoiceErrors);
    if (nextEmailError) {
      emailRef.current?.focus();
      return;
    }
    if (hasInvoiceErrors(nextInvoiceErrors)) {
      invoiceFieldRef.current?.focus();
      return;
    }

    setPending(true);
    const failure = await startAdFreeCheckout({ email, method, invoice });
    if (failure) {
      if (failure.invoiceErrors) setInvoiceErrors(failure.invoiceErrors);
      setLocalNotice(failure.error);
      setPending(false);
    }
  };

  const limits = getMethod(method);

  return (
    <div id="adfree" className="hide-in-ios-app scroll-mt-20">
    <Card className="px-4 py-4 sm:px-5">
      <SectionHeading
        title="無廣告訂閱"
        description="最下排的廣告可以用訂閱關掉。每月 NT$50，付款成功後效期往後加 30 天；已在期內再訂就從原到期日接著算。"
      />

      {ready && active && until ? (
        <p className="mt-3 rounded-lg bg-accent-tint px-3.5 py-2.5 text-[13px] text-ink">
          目前是無廣告版，有效至 {formatAdFreeUntil(until)}。
        </p>
      ) : null}

      {!loggedIn ? (
        <div className="mt-4 space-y-3">
          <p className="text-[13px] text-ink-muted">請先用 LINE 登入，訂閱才綁得上你的帳號，換裝置也接得回來。</p>
          <Button variant="secondary" disabled={loginBusy} onClick={() => void login()}>
            {loginBusy ? "前往登入…" : "用 LINE 登入"}
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <Field label="付款方式" hint={limits.hint}>
            <Segmented
              ariaLabel="付款方式"
              value={method}
              options={METHOD_OPTIONS}
              onChange={setMethod}
            />
          </Field>

          <Field label="信箱" htmlFor="adfree-email">
            <TextInput
              id="adfree-email"
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

          {!paymentReady ? (
            <p className="text-[13px] text-ink-subtle">金流尚未設定，暫時無法訂閱。</p>
          ) : null}

          {localNotice ? <p className="text-[13px] font-semibold text-alert">{localNotice}</p> : null}

          <Button size="lg" disabled={pending || !paymentReady} onClick={() => void submit()}>
            {pending ? "前往付款…" : `${active ? "再續一個月" : "訂閱無廣告"} ${formatAmount(ADFREE_AMOUNT)}`}
          </Button>
        </div>
      )}
    </Card>
    </div>
  );
}
