import { getMark, getTemplate, groupMindfulnessItems } from "@/lib/templates";
import type { EntryBlock } from "@/lib/types";

/** 唯讀呈現一段書寫內容，用於被分享的紀錄。 */
export function BlockReader({ block }: { block: EntryBlock }) {
  const meta = getTemplate(block.template);

  return (
    <section className="space-y-2">
      <h4 className="flex items-center gap-1.5 text-[13px] font-semibold text-brand">
        <span aria-hidden>{meta.emoji}</span>
        {meta.name}
      </h4>

      {block.template === "diary" ? (
        <div className="space-y-1">
          {block.data.title.trim() ? (
            <p className="text-[15px] font-semibold text-ink">{block.data.title}</p>
          ) : null}
          <p className="prose-zh text-sm text-ink-muted">{block.data.body}</p>
        </div>
      ) : null}

      {block.template === "gratitude" ? (
        <ol className="space-y-1.5">
          {block.data.items
            .map((item, index) => ({ item: item.trim(), index }))
            .filter(({ item }) => item.length > 0)
            .map(({ item, index }) => (
              <li key={index} className="flex gap-2.5 text-sm text-ink-muted">
                <span
                  aria-hidden
                  className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-tint text-[11px] font-semibold text-accent"
                >
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
        </ol>
      ) : null}

      {block.template === "mindfulness" ? (
        <dl className="space-y-2.5">
          {groupMindfulnessItems(block.data.items)
            .map((channel) => ({
              ...channel,
              items: channel.items.filter((item) => item.text.trim().length > 0),
            }))
            .filter(({ items }) => items.length > 0)
            .map(({ key, label, items }) => (
              <div key={key} className="space-y-1">
                <dt className="text-xs font-medium text-accent">{label}</dt>
                {items.map((item) => (
                  <dd key={item.id} className="flex gap-2 text-sm text-ink-muted">
                    <span aria-label={getMark(item.mark).label} className="shrink-0 text-ink-subtle">
                      {getMark(item.mark).symbol}
                    </span>
                    <span className="prose-zh">{item.text}</span>
                  </dd>
                ))}
              </div>
            ))}
        </dl>
      ) : null}
    </section>
  );
}
