"use client";

import { useSyncExternalStore } from "react";

import { loadTheme, saveTheme, THEME_KEY } from "./storage";
import type { ThemePreference } from "./types";

/**
 * 在 hydration 之前先套用 data-theme，避免深色模式使用者看到白色閃爍。
 */
export const themeBootstrapScript = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_KEY}') || 'system';
    var dark = stored === 'dark' ||
      (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  } catch (error) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;

const DARK_QUERY = "(prefers-color-scheme: dark)";

let preference: ThemePreference | null = null;
let media: MediaQueryList | null = null;
const listeners = new Set<() => void>();

function resolve(value: ThemePreference): "light" | "dark" {
  if (value !== "system") return value;
  return media?.matches ? "dark" : "light";
}

/** data-theme 由這裡直接寫入 DOM，React 不需要用 effect 再同步一次。 */
function apply() {
  if (preference === null) return;
  document.documentElement.dataset.theme = resolve(preference);
}

function ensureInitialized() {
  if (preference !== null) return;
  preference = loadTheme();
  media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", () => {
    apply();
    for (const listener of listeners) listener();
  });
}

function subscribe(listener: () => void): () => void {
  ensureInitialized();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ThemePreference {
  ensureInitialized();
  return preference ?? "system";
}

function getServerSnapshot(): ThemePreference {
  return "system";
}

export function setThemePreference(next: ThemePreference): void {
  preference = next;
  saveTheme(next);
  apply();
  for (const listener of listeners) listener();
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
