import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-24 text-center">
      <span aria-hidden className="text-4xl">
        🗓️
      </span>
      <h1 className="text-xl font-semibold tracking-tight text-ink">找不到這一頁</h1>
      <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
        這個網址可能不存在，或是日期格式不正確（正確格式為 2026-08-17）。
      </p>
      <LinkButton href="/">回到日曆</LinkButton>
    </div>
  );
}
