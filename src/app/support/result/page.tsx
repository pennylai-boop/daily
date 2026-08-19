import type { Metadata } from "next";

import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/surfaces";
import { formatAmount, PAYMENT_TYPE_LABELS } from "@/lib/support";

export const metadata: Metadata = {
  title: "贊助結果",
  description: "PAYUNi 付款完成後的結果頁。",
};

export const dynamic = "force-dynamic";

export default async function Page(props: PageProps<"/support/result">) {
  const params = await props.searchParams;
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  };

  const status = read("status");
  const tradeStatus = read("tradeStatus");
  const amount = Number(read("amount")) || 0;
  const payNo = read("payNo");
  const paymentType = read("paymentType");
  const view = describe({ status, tradeStatus, payNo });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{view.title}</h1>
        <p className="text-sm leading-relaxed text-ink-muted">{view.description}</p>
      </header>

      <Card className="divide-y divide-line">
        {amount > 0 ? <Row label="金額" value={formatAmount(amount)} /> : null}
        {paymentType ? (
          <Row label="付款方式" value={PAYMENT_TYPE_LABELS[paymentType] ?? paymentType} />
        ) : null}
        {read("no") ? <Row label="訂單編號" value={read("no")} /> : null}
        {payNo ? (
          <Row label={paymentType === "2" ? "虛擬帳號" : "繳費代碼"} value={payNo} mono />
        ) : null}
        {read("bankType") ? <Row label="轉入銀行代碼" value={read("bankType")} /> : null}
        {read("expireDate") ? <Row label="繳費期限" value={read("expireDate")} /> : null}
        {read("invoice") ? <Row label="發票號碼" value={read("invoice")} mono /> : null}
        {read("message") ? <Row label="金流回應" value={read("message")} /> : null}
      </Card>

      <p className="text-[13px] leading-relaxed text-ink-subtle">
        發票會在款項入帳後由速買配 SmilePay 開立，若填了信箱大約五分鐘內會收到。
        有任何問題可以帶著訂單編號來信詢問。
      </p>

      <LinkButton href="/">回到日曆</LinkButton>
    </div>
  );
}

function describe({
  status,
  tradeStatus,
  payNo,
}: {
  status: string;
  tradeStatus: string;
  payNo: string;
}) {
  if (status === "SUCCESS" && tradeStatus === "1") {
    return {
      title: "謝謝你的支持",
      description: "款項已經收到，這份心意會變成繼續維護的動力。",
    };
  }

  // ATM／超商是先取號再繳費，TradeStatus=0 代表號碼拿到了但還沒付款。
  if (status === "SUCCESS" && tradeStatus === "0" && payNo) {
    return {
      title: "已取得繳費資訊",
      description: "請在期限內完成繳費，入帳後才會開立發票。",
    };
  }

  if (status === "UNKNOWN") {
    return {
      title: "尚未確認結果",
      description: "金流還在等銀行回應，結果確認後會依你填的信箱通知。",
    };
  }

  if (status === "unconfigured" || status === "invalid" || status === "unknown") {
    return {
      title: "無法確認這筆交易",
      description: "沒有收到可驗證的金流回傳，請回到支持頁重新操作，或與我們聯絡。",
    };
  }

  return {
    title: "這筆贊助沒有完成",
    description: "付款未成功或已取消，沒有任何款項被扣除，可以回到支持頁再試一次。",
  };
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <span className="text-[13px] text-ink-muted">{label}</span>
      <span className={mono ? "font-mono text-sm text-ink" : "text-sm text-ink"}>{value}</span>
    </div>
  );
}
