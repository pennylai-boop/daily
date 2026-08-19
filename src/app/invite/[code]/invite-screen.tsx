"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/field";
import { Card, EmptyState, SectionHeading, TextLink } from "@/components/ui/surfaces";
import { useDailyStore } from "@/lib/store";

/**
 * 邀請頁。
 *
 * 正式流程是對方點開連結、用 LINE 登入，後端比對邀請碼後建立關聯。
 * 後端還沒接上之前，這裡只認得同一個瀏覽器裡建立的邀請，用來預覽接受之後的樣子。
 */
export function InviteScreen({ code }: { code: string }) {
  const { state, ready, acceptInvite } = useDailyStore();
  const [name, setName] = useState("示範好友");
  const [accepted, setAccepted] = useState(false);

  const recipient = state.settings.recipients.find((item) => item.inviteCode === code);
  const owner = state.settings.profile.name || "對方";

  if (!ready) {
    return (
      <div className="mx-auto max-w-lg space-y-4" aria-busy>
        <div className="h-8 w-40 rounded-lg bg-paper-tint" />
        <div className="h-40 rounded-xl bg-paper-tint" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">接受分享邀請</h1>
        <p className="text-sm text-ink-muted">
          邀請碼 <span className="font-medium tabular-nums text-ink">{code}</span>
        </p>
      </header>

      {!recipient ? (
        <Card>
          <EmptyState
            emoji="🔍"
            title="找不到這張邀請"
            description="邀請碼可能已經被使用或輸入有誤。後端上線前，邀請只在建立它的那台裝置上讀得到。"
            action={<TextLink href="/">回到日曆 →</TextLink>}
          />
        </Card>
      ) : recipient.status === "accepted" || accepted ? (
        <Card className="px-4 py-5 sm:px-5">
          <SectionHeading
            title="已經接受了"
            description={`${owner}的紀錄會出現在你的「被分享紀錄」，分享範圍是${
              recipient.scope === "full" ? "完整內容" : "只有心情"
            }。`}
          />
          <div className="mt-4">
            <TextLink href="/shared">前往被分享紀錄 →</TextLink>
          </div>
        </Card>
      ) : (
        <Card className="space-y-4 px-4 py-5 sm:px-5">
          <SectionHeading
            title={`${owner}想把每天的紀錄分享給你`}
            description={
              recipient.scope === "full"
                ? "接受後你可以看到對方每天的書寫內容與目標。"
                : "接受後你只會看到對方每天的心情，書寫內容不會顯示。"
            }
          />

          <Button size="lg" className="w-full" disabled>
            用 LINE 登入並接受
          </Button>
          <p className="text-[13px] leading-relaxed text-ink-subtle">
            LINE 登入要等後端接上 Supabase 之後才會啟用。登入後兩邊的身分都是 LINE 驗證過的
            userId，不需要交換 email。
          </p>

          <div className="space-y-2.5 border-t border-line pt-4">
            <p className="text-[13px] text-ink-muted">本機預覽：直接模擬對方接受這張邀請。</p>
            <div className="flex flex-wrap gap-2">
              <TextInput
                value={name}
                maxLength={20}
                aria-label="模擬接受者的名稱"
                className="min-w-0 flex-1"
                onChange={(event) => setName(event.target.value)}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  const ok = acceptInvite(code, {
                    name: name.trim() || "示範好友",
                    lineUserId: `U${code.toLowerCase()}demo0000000000000000`,
                  });
                  if (ok) setAccepted(true);
                }}
              >
                模擬接受
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
