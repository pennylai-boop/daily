"use client";

import { useSyncExternalStore } from "react";

import { loadTheme, normalizeTheme, saveTheme, THEME_KEY } from "./storage";
import type { ThemePreference } from "./types";

/**
 * 在 hydration 之前先套用 data-theme，避免深色模式使用者看到淺色閃爍。
 * 舊值 light／system 當成橘色。
 */
export const themeBootstrapScript = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_KEY}') || 'orange';
    if (stored === 'orange' || stored === 'blue' || stored === 'dark') {
      document.documentElement.dataset.theme = stored;
      return;
    }
    document.documentElement.dataset.theme = 'orange';
  } catch (error) {
    document.documentElement.dataset.theme = 'orange';
  }
})();
`;

let preference: ThemePreference | null = null;
const listeners = new Set<() => void>();

/** data-theme 由這裡直接寫入 DOM，React 不需要用 effect 再同步一次。 */
function apply() {
  if (preference === null) return;
  document.documentElement.dataset.theme = preference;
}

function ensureInitialized() {
  if (preference !== null) return;
  preference = loadTheme();
  apply();
}

function subscribe(listener: () => void): () => void {
  ensureInitialized();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ThemePreference {
  ensureInitialized();
  return preference ?? "orange";
}

function getServerSnapshot(): ThemePreference {
  return "orange";
}

export function setThemePreference(next: ThemePreference): void {
  preference = normalizeTheme(next);
  saveTheme(preference);
  apply();
  for (const listener of listeners) listener();
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
