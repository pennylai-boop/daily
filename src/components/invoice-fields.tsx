"use client";

import type { RefObject } from "react";

import { Field, TextInput } from "@/components/ui/field";
import type { InvoiceErrors, InvoiceInput } from "@/lib/invoice";

export function InvoiceFields({
  invoice,
  errors,
  firstFieldRef,
  onChange,
}: {
  invoice: InvoiceInput;
  errors: InvoiceErrors;
  firstFieldRef: RefObject<HTMLInputElement | null>;
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

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[13px] font-semibold text-alert">{message}</p>;
}
