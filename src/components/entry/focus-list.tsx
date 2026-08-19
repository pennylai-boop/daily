"use client";

import { useState } from "react";

import { CheckIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { TextInput } from "@/components/ui/field";
import { createId } from "@/lib/storage";
import type { FocusItem } from "@/lib/types";

export function FocusList({
  items,
  onChange,
}: {
  items: FocusItem[];
  onChange: (next: FocusItem[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    onChange([...items, { id: createId(), text, done: false }]);
    setDraft("");
  };

  return (
    <div className="space-y-2.5">
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={item.done}
                aria-label={item.text}
                onClick={() =>
                  onChange(
                    items.map((current) =>
                      current.id === item.id ? { ...current, done: !current.done } : current,
                    ),
                  )
                }
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                  item.done
                    ? "border-accent bg-accent text-on-accent"
                    : "border-line-strong bg-surface hover:border-accent",
                )}
              >
                {item.done ? <CheckIcon className="size-3.5" strokeWidth={2.6} /> : null}
              </button>
              <span
                className={cn(
                  "flex-1 text-sm",
                  item.done ? "text-ink-subtle line-through" : "text-ink",
                )}
              >
                {item.text}
              </span>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`刪除目標：${item.text}`}
                className="size-7 px-0"
                onClick={() => onChange(items.filter((current) => current.id !== item.id))}
              >
                <TrashIcon className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex items-center gap-2">
        <TextInput
          value={draft}
          placeholder="新增一個今天想完成的目標"
          className="h-9 py-0 text-sm"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button size="sm" variant="secondary" aria-label="新增目標" onClick={add} className="size-9 px-0">
          <PlusIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
