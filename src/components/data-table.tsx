"use client";

/**
 * 表格共用元件（UI_design_system4 §7.2）
 *
 * - <TableScroll>：取代表格外層的 overflow-x-auto 容器；內容超出寬度時，左右兩側浮現半透明捲動按鈕
 *   （行動裝置常駐、桌面 hover 時出現）。按鈕以 fixed 定位在「表格可見區」的垂直中央，表格很長時也不必捲到底。
 * - <DataTable tableKey>：取代 <table>；表頭欄位可拖曳調整順序（觸控裝置長按後拖曳），
 *   順序記錄於使用者帳號（Supabase user_metadata，跨裝置同步；localStorage 為即時快取）。
 * - <Tr>：取代 <tr>（表頭與資料列都要換），依使用者設定的順序排列儲存格。
 *   儲存格數與表頭不同的列（如 colSpan 的空白列）維持原樣；表頭含 colSpan 時不啟用拖曳。
 *
 * 欄位識別：th 的 data-col → React key → 標題文字 → 位置。th 加上 data-col-lock 可固定不拖曳。
 */

import {
  Fragment,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type TableHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* ───────────────────────── 使用者欄位順序（帳號層級） ───────────────────────── */

const APP_KEY = "daily";

function getAuthClient() {
  try {
    return getSupabaseBrowser();
  } catch {
    return null;
  }
}

type OrderMap = Record<string, string[]>;
const META_KEY = `ui_table_cols_${APP_KEY}`;
const LAST_USER_KEY = `ui-table-cols:${APP_KEY}:last-user`;

let orders: OrderMap = {};
let currentUser: string | null = null;
let started = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const subscribers = new Set<() => void>();
const EMPTY: OrderMap = {};

function storageKey(user: string | null) {
  return `ui-table-cols:${APP_KEY}:${user ?? "anon"}`;
}

function readLocal(user: string | null): OrderMap {
  try {
    const raw = window.localStorage.getItem(storageKey(user));
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === "object" ? (parsed as OrderMap) : {};
  } catch {
    return {};
  }
}

function writeLocal() {
  try {
    window.localStorage.setItem(storageKey(currentUser), JSON.stringify(orders));
    if (currentUser) window.localStorage.setItem(LAST_USER_KEY, currentUser);
  } catch {
    /* 無痕模式等情況忽略 */
  }
}

function emit() {
  subscribers.forEach((fn) => fn());
}

function cleanOrderMap(v: unknown): OrderMap {
  if (!v || typeof v !== "object") return {};
  const out: OrderMap = {};
  for (const [k, ids] of Object.entries(v as Record<string, unknown>)) {
    if (Array.isArray(ids)) out[k] = ids.filter((x): x is string => typeof x === "string").slice(0, 200);
  }
  return out;
}

function adoptUser(user: { id: string; user_metadata?: Record<string, unknown> } | null | undefined) {
  if (!user) return;
  const remote = cleanOrderMap(user.user_metadata?.[META_KEY]);
  const local = currentUser === user.id ? orders : readLocal(user.id);
  currentUser = user.id;
  orders = { ...local, ...remote };
  writeLocal();
  emit();
}

function startPrefs() {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    currentUser = window.localStorage.getItem(LAST_USER_KEY);
  } catch {
    currentUser = null;
  }
  orders = readLocal(currentUser);
  emit();
  const sb = getAuthClient();
  if (!sb) return;
  void (async () => {
    try {
      const { data } = await sb.auth.getSession();
      adoptUser(data.session?.user);
      // 取得最新 metadata（其他裝置剛改過的順序）
      const fresh = await sb.auth.getUser();
      adoptUser(fresh.data.user);
    } catch {
      /* 未登入或離線：沿用本機快取 */
    }
  })();
}

function subscribe(fn: () => void) {
  subscribers.add(fn);
  startPrefs();
  return () => {
    subscribers.delete(fn);
  };
}

function setTableOrder(tableKey: string, order: string[] | null) {
  const next = { ...orders };
  if (order) next[tableKey] = order;
  else delete next[tableKey];
  orders = next;
  writeLocal();
  emit();
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const sb = getAuthClient();
    if (!sb || !currentUser) return;
    void sb.auth.updateUser({ data: { [META_KEY]: orders } }).catch(() => undefined);
  }, 800);
}

function useTableOrder(tableKey: string | undefined): string[] | null {
  const map = useSyncExternalStore(
    subscribe,
    () => orders,
    () => EMPTY,
  );
  return tableKey ? (map[tableKey] ?? null) : null;
}

/* ───────────────────────── 儲存格處理 ───────────────────────── */

type Cell = { el: ReactElement<Record<string, unknown>>; id: string };

function textOf(node: ReactNode, depth = 0): string {
  if (node == null || typeof node === "boolean" || depth > 6) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((n) => textOf(n, depth + 1)).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children, depth + 1);
  return "";
}

function collectCells(children: ReactNode, prefix: string, out: ReactElement<Record<string, unknown>>[], keys: string[]) {
  const visit = (node: ReactNode, pre: string) => {
    if (node == null || typeof node === "boolean" || node === "") return;
    if (Array.isArray(node)) {
      node.forEach((n) => visit(n, pre));
      return;
    }
    if (!isValidElement(node)) return;
    const el = node as ReactElement<Record<string, unknown>>;
    if (el.type === Fragment) {
      const fk = el.key != null ? `${pre}${String(el.key)}.` : pre;
      visit(el.props.children as ReactNode, fk);
      return;
    }
    out.push(el);
    keys.push(el.key != null ? `${pre}${String(el.key)}` : "");
  };
  visit(children, prefix);
}

function readCells(children: ReactNode): Cell[] {
  const els: ReactElement<Record<string, unknown>>[] = [];
  const keys: string[] = [];
  collectCells(children, "", els, keys);
  const seen = new Map<string, number>();
  return els.map((el, i) => {
    const explicit = el.props["data-col"];
    let id =
      explicit != null
        ? `c:${String(explicit)}`
        : keys[i]
          ? `k:${keys[i]}`
          : (() => {
              const t = textOf(el.props.children as ReactNode).replace(/\s+/g, " ").trim();
              return t ? `t:${t.slice(0, 40)}` : `i:${i}`;
            })();
    const n = seen.get(id) ?? 0;
    seen.set(id, n + 1);
    if (n > 0) id = `${id}#${n}`;
    return { el, id };
  });
}

function permutation(ids: string[], saved: string[] | null): number[] {
  const idx = ids.map((_, i) => i);
  if (!saved || saved.length === 0) return idx;
  const pos = new Map(saved.map((id, i) => [id, i]));
  let last = -1;
  const rank = ids.map((id, i) => {
    const p = pos.get(id);
    if (p !== undefined) {
      last = p;
      return p;
    }
    // 新出現的欄位：接在原本前一欄之後
    return last + 0.5 + i * 1e-4;
  });
  return idx.sort((a, b) => rank[a] - rank[b]);
}

/* ───────────────────────── Context ───────────────────────── */

type DragState = { id: string; label: string; x: number; y: number } | null;
type DropTarget = { id: string; side: "before" | "after" } | null;

type TableCtx = {
  enabled: boolean;
  saved: string[] | null;
  header: { ids: string[]; perm: number[]; locked: Set<string> } | null;
  setHeader: (ids: string[], perm: number[], locked: Set<string>) => void;
  dropTarget: DropTarget;
  dragId: string | null;
  onHeaderPointerDown: (e: ReactPointerEvent<HTMLTableCellElement>, id: string, label: string) => void;
};

const TableContext = createContext<TableCtx | null>(null);
type ScrollCtx = { setReset: (fn: (() => void) | null) => void };
const ScrollContext = createContext<ScrollCtx | null>(null);

/** 原生 th／thead，或以 `Component.dataTableRole = "th" | "thead"` 標記的包裝元件（如 shadcn TableHead） */
function hasRole(el: ReactElement, role: "th" | "thead") {
  return el.type === role || (el.type as { dataTableRole?: string } | null)?.dataTableRole === role;
}

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ───────────────────────── <Tr> ───────────────────────── */

export function Tr({ children, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  const ctx = useContext(TableContext);
  if (!ctx || !ctx.enabled) return <tr {...rest}>{children}</tr>;

  const cells = readCells(children);
  if (cells.length === 0) return <tr {...rest}>{children}</tr>;
  const isHeader = cells.every((c) => hasRole(c.el, "th"));
  const hasSpan = cells.some((c) => Number(c.el.props.colSpan ?? 1) > 1);

  if (isHeader) {
    if (hasSpan || cells.length < 2) return <tr {...rest}>{children}</tr>;
    const ids = cells.map((c) => c.id);
    const locked = new Set(cells.filter((c) => c.el.props["data-col-lock"] != null).map((c) => c.id));
    const perm = permutation(ids, ctx.saved);
    ctx.setHeader(ids, perm, locked);
    return (
      <tr {...rest}>
        {perm.map((i) => {
          const { el, id } = cells[i];
          const isLocked = locked.has(id);
          const p = el.props;
          const target = ctx.dropTarget?.id === id ? ctx.dropTarget.side : null;
          const style: CSSProperties = {
            ...(p.style as CSSProperties | undefined),
            ...(isLocked ? null : { cursor: ctx.dragId ? "grabbing" : "grab" }),
            ...(target === "before"
              ? { boxShadow: "inset 3px 0 0 #262f8b" }
              : target === "after"
                ? { boxShadow: "inset -3px 0 0 #262f8b" }
                : null),
            ...(ctx.dragId === id ? { opacity: 0.45 } : null),
          };
          return cloneElement(el, {
            key: el.key ?? `c${i}`,
            "data-col-id": id,
            style,
            title: (p.title as string | undefined) ?? (isLocked ? undefined : "拖曳可調整欄位順序"),
            onPointerDown: (e: ReactPointerEvent<HTMLTableCellElement>) => {
              (p.onPointerDown as ((ev: ReactPointerEvent<HTMLTableCellElement>) => void) | undefined)?.(e);
              if (!isLocked) ctx.onHeaderPointerDown(e, id, textOf(p.children as ReactNode).trim() || "欄位");
            },
          });
        })}
      </tr>
    );
  }

  const header = ctx.header;
  if (!header || hasSpan || cells.length !== header.ids.length) return <tr {...rest}>{children}</tr>;
  return (
    <tr {...rest}>
      {header.perm.map((i) => {
        const el = cells[i].el;
        return cloneElement(el, { key: el.key ?? `c${i}` });
      })}
    </tr>
  );
}

/* ───────────────────────── <TableScroll> ───────────────────────── */

type ScrollState = {
  left: boolean;
  right: boolean;
  top: number;
  leftX: number;
  rightX: number;
  visible: boolean;
  /** 表格是否在畫面內（不論是否需要橫向捲動），供「預設順序」按鈕使用 */
  inView: boolean;
  headTop: number;
};

const BTN =
  "flex h-10 w-10 items-center justify-center rounded-full border border-gray-600 bg-gray-600/80 text-white shadow-md backdrop-blur-[1px] transition-[opacity,background-color,transform] hover:bg-gray-700/90 active:scale-95";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {dir === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  );
}

const HOVER_MEDIA = "(hover: hover) and (pointer: fine)";
const noopSubscribe = () => () => {};
function subscribeHoverMedia(fn: () => void) {
  const mq = window.matchMedia(HOVER_MEDIA);
  mq.addEventListener?.("change", fn);
  return () => mq.removeEventListener?.("change", fn);
}
function readHoverMedia() {
  return window.matchMedia(HOVER_MEDIA).matches;
}

/** 表格橫向捲動容器（取代原本的 overflow-x-auto div；className 原樣套用在捲動容器上） */
export function TableScroll({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const canHover = useSyncExternalStore(subscribeHoverMedia, readHoverMedia, () => false);
  const [hover, setHover] = useState(false);
  const [st, setSt] = useState<ScrollState>({ left: false, right: false, top: 0, leftX: 0, rightX: 0, visible: false, inView: false, headTop: 0 });
  const [reset, setResetState] = useState<(() => void) | null>(null);
  const scrollCtx = useMemo<ScrollCtx>(() => ({ setReset: (fn) => setResetState(() => fn) }), []);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const visTop = Math.max(rect.top, 0);
    const visBottom = Math.min(rect.bottom, vh);
    let inView = rect.width > 0 && visBottom - visTop > 48;
    let visible = max > 1 && inView;
    const top = (visTop + visBottom) / 2;
    if (visible) {
      // 被彈窗等覆蓋時不顯示
      const probe = document.elementFromPoint(rect.left + rect.width / 2, top);
      if (probe && !el.contains(probe) && !(probe as HTMLElement).closest?.("[data-table-scroll-btn]")) visible = false;
    }
    if (inView && !visible && max > 1) inView = false;
    setSt((prev) => {
      const next = {
        left: el.scrollLeft > 1,
        right: el.scrollLeft < max - 1,
        top,
        leftX: Math.max(rect.left, 0) + 8,
        rightX: Math.min(rect.right, window.innerWidth) - 8 - 40,
        visible,
        inView,
        headTop: Math.max(rect.top, 0) + 6,
      };
      return prev.left === next.left &&
        prev.right === next.right &&
        Math.abs(prev.top - next.top) < 0.5 &&
        Math.abs(prev.leftX - next.leftX) < 0.5 &&
        Math.abs(prev.rightX - next.rightX) < 0.5 &&
        prev.visible === next.visible &&
        prev.inView === next.inView &&
        Math.abs(prev.headTop - next.headTop) < 0.5
        ? prev
        : next;
    });
  }, []);

  useEffect(() => {
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    const el = ref.current;
    const ro = new ResizeObserver(schedule);
    if (el) {
      ro.observe(el);
      if (el.firstElementChild) ro.observe(el.firstElementChild);
    }
    const mo = new MutationObserver(schedule);
    if (el) mo.observe(el, { childList: true, subtree: true });
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [measure]);

  const enter = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setHover(true);
  };
  const leave = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setHover(false), 120);
  };

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.7), behavior: "smooth" });
  };

  const show = st.visible && (!canHover || hover);
  const btnStyle = (x: number): CSSProperties => ({
    position: "fixed",
    top: st.top,
    left: x,
    transform: "translateY(-50%)",
    zIndex: 35,
    opacity: show ? 1 : 0,
    pointerEvents: show ? "auto" : "none",
  });

  return (
    <ScrollContext.Provider value={scrollCtx}>
      <div
        ref={ref}
        className={className}
        {...rest}
        onPointerEnter={(e) => {
          enter();
          rest.onPointerEnter?.(e);
        }}
        onPointerLeave={(e) => {
          leave();
          rest.onPointerLeave?.(e);
        }}
      >
        {children}
      </div>
      {mounted
        ? createPortal(
            <>
              {st.left ? (
                <button
                  type="button"
                  data-table-scroll-btn
                  aria-label="向左捲動，查看左側欄位"
                  className={BTN}
                  style={btnStyle(st.leftX)}
                  onPointerEnter={enter}
                  onPointerLeave={leave}
                  onClick={() => scrollBy(-1)}
                >
                  <Chevron dir="left" />
                </button>
              ) : null}
              {st.right ? (
                <button
                  type="button"
                  data-table-scroll-btn
                  aria-label="向右捲動，查看右側欄位"
                  className={BTN}
                  style={btnStyle(st.rightX)}
                  onPointerEnter={enter}
                  onPointerLeave={leave}
                  onClick={() => scrollBy(1)}
                >
                  <Chevron dir="right" />
                </button>
              ) : null}
              {reset && st.inView ? (
                <button
                  type="button"
                  data-table-scroll-btn
                  onClick={reset}
                  onPointerEnter={enter}
                  onPointerLeave={leave}
                  title="恢復預設欄位順序"
                  className="flex h-6 items-center gap-1 rounded-full border border-gray-200 bg-white/95 px-2 text-[11px] text-gray-500 shadow-sm transition-opacity hover:text-[#262f8b]"
                  style={{
                    position: "fixed",
                    top: st.headTop,
                    left: st.rightX + 40,
                    transform: "translateX(-100%)",
                    zIndex: 36,
                    opacity: !canHover || hover ? 1 : 0,
                    pointerEvents: !canHover || hover ? "auto" : "none",
                  }}
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  預設順序
                </button>
              ) : null}
            </>,
            document.body,
          )
        : null}
    </ScrollContext.Provider>
  );
}

/* ───────────────────────── <DataTable> ───────────────────────── */

const DEFAULT_SCROLL = "max-w-full min-w-0 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]";
const TABLE_BASE = "[&_th]:whitespace-nowrap";
const FORM_CONTROLS = "input,select,textarea,[role=checkbox],[contenteditable=true]";

type DataTableProps = TableHTMLAttributes<HTMLTableElement> & {
  /** 欄位順序的儲存鍵（同一 app 內唯一）；不給則只有捲動按鈕、不可拖曳 */
  tableKey?: string;
  /** 自帶捲動容器時（未包在 <TableScroll> 內）套用到容器的 class */
  scrollClassName?: string;
};

export function DataTable(props: DataTableProps) {
  const inScroll = useContext(ScrollContext);
  if (inScroll) return <DataTableInner {...props} />;
  return (
    <TableScroll className={props.scrollClassName ?? DEFAULT_SCROLL}>
      <DataTableInner {...props} />
    </TableScroll>
  );
}

function DataTableInner({ tableKey, className, children, ...props }: DataTableProps) {
  const { scrollClassName, ...rest } = props;
  void scrollClassName;
  const scrollCtx = useContext(ScrollContext);
  const saved = useTableOrder(tableKey);
  const headerRef = useRef<TableCtx["header"]>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const [drag, setDrag] = useState<DragState>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);
  const [, force] = useState(0);
  const pending = useRef<{ id: string; label: string; x: number; y: number; pointer: string; timer: ReturnType<typeof setTimeout> | null } | null>(null);
  const dragRef = useRef<DragState>(null);
  const targetRef = useRef<DropTarget>(null);
  const startRef = useRef<((p: NonNullable<typeof pending.current>, x: number, y: number) => void) | null>(null);

  // 表頭在 render 時登記；資料列於同一輪 render 讀取。首次掛載後補一次 render，確保資料列套用到表頭順序。
  useLayoutEffect(() => {
    if (headerRef.current) force((n) => n + 1);
  }, [saved]);

  const setHeader = useCallback((ids: string[], perm: number[], locked: Set<string>) => {
    headerRef.current = { ids, perm, locked };
  }, []);

  const finishDrag = useCallback(
    (commit: boolean) => {
      const d = dragRef.current;
      const t = targetRef.current;
      const header = headerRef.current;
      dragRef.current = null;
      targetRef.current = null;
      setDrag(null);
      setDropTarget(null);
      document.body.style.userSelect = "";
      if (!commit || !d || !t || !header || !tableKey || t.id === d.id || header.locked.has(t.id)) return;
      const shown = header.perm.map((i) => header.ids[i]).filter((id) => id !== d.id);
      const at = shown.indexOf(t.id);
      if (at < 0) return;
      shown.splice(t.side === "before" ? at : at + 1, 0, d.id);
      const isDefault = shown.every((id, i) => id === header.ids[i]);
      setTableOrder(tableKey, isDefault ? null : shown);
      // 拖曳結束後吞掉下一次 click，避免觸發表頭排序按鈕
      const swallow = (ev: MouseEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      window.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 50);
    },
    [tableKey],
  );

  useEffect(() => {
    if (!tableKey) return;
    const preventTouch = (e: TouchEvent) => {
      if (dragRef.current) e.preventDefault();
    };
    const findTarget = (x: number, y: number): DropTarget => {
      const hit = document.elementFromPoint(x, y)?.closest?.("th[data-col-id]") as HTMLElement | null;
      if (!hit || !tableRef.current?.contains(hit)) return targetRef.current;
      const r = hit.getBoundingClientRect();
      return { id: hit.dataset.colId ?? "", side: x < r.left + r.width / 2 ? "before" : "after" };
    };
    const autoScroll = (x: number) => {
      const sc = tableRef.current?.parentElement;
      if (!sc) return;
      const r = sc.getBoundingClientRect();
      if (x < r.left + 40) sc.scrollLeft -= 14;
      else if (x > r.right - 40) sc.scrollLeft += 14;
    };
    const start = (p: NonNullable<typeof pending.current>, x: number, y: number) => {
      const d = { id: p.id, label: p.label, x, y };
      dragRef.current = d;
      setDrag(d);
      document.body.style.userSelect = "none";
      try {
        window.getSelection()?.removeAllRanges();
      } catch {
        /* ignore */
      }
    };
    const onMove = (e: PointerEvent) => {
      const p = pending.current;
      if (dragRef.current) {
        const d = { ...dragRef.current, x: e.clientX, y: e.clientY };
        dragRef.current = d;
        setDrag(d);
        const t = findTarget(e.clientX, e.clientY);
        targetRef.current = t;
        setDropTarget(t);
        autoScroll(e.clientX);
        return;
      }
      if (!p) return;
      const dist = Math.hypot(e.clientX - p.x, e.clientY - p.y);
      if (p.pointer === "mouse") {
        if (dist > 6) {
          pending.current = null;
          start(p, e.clientX, e.clientY);
        }
      } else if (dist > 10) {
        // 觸控：長按前就移動視為捲動
        if (p.timer) clearTimeout(p.timer);
        pending.current = null;
      }
    };
    const onUp = () => {
      const p = pending.current;
      if (p?.timer) clearTimeout(p.timer);
      pending.current = null;
      if (dragRef.current) finishDrag(true);
    };
    const onCancel = () => {
      const p = pending.current;
      if (p?.timer) clearTimeout(p.timer);
      pending.current = null;
      if (dragRef.current) finishDrag(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dragRef.current) finishDrag(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
    document.addEventListener("touchmove", preventTouch, { passive: false });
    startRef.current = start;
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("touchmove", preventTouch);
    };
  }, [tableKey, finishDrag]);

  const onHeaderPointerDown = useCallback((e: ReactPointerEvent<HTMLTableCellElement>, id: string, label: string) => {
    if (!tableKey || e.button !== 0) return;
    // 表單控制項（如全選勾選框）不啟動拖曳；按鈕／連結上仍可拖曳（移動超過門檻才開始，單純點擊不受影響）
    if ((e.target as HTMLElement).closest(FORM_CONTROLS)) return;
    const p = { id, label, x: e.clientX, y: e.clientY, pointer: e.pointerType, timer: null as ReturnType<typeof setTimeout> | null };
    if (e.pointerType !== "mouse") {
      p.timer = setTimeout(() => {
        if (pending.current === p) {
          pending.current = null;
          startRef.current?.(p, p.x, p.y);
          try {
            navigator.vibrate?.(10);
          } catch {
            /* ignore */
          }
        }
      }, 350);
    }
    pending.current = p;
  }, [tableKey]);

  const dragId = drag?.id ?? null;
  // 只有具 <thead> 的清單型表格才啟用拖曳（欄位／值的明細表不適用）
  const hasHead = (() => {
    const els: ReactElement<Record<string, unknown>>[] = [];
    collectCells(children, "", els, []);
    return els.some((el) => hasRole(el, "thead"));
  })();
  const enabled = Boolean(tableKey) && hasHead;
  const ctxValue = useMemo<TableCtx>(
    () => ({
      enabled,
      saved,
      // 表頭 <Tr> 於 render 時登記，資料列讀取當下最新值
      get header() {
        return headerRef.current;
      },
      setHeader,
      dropTarget,
      dragId,
      onHeaderPointerDown,
    }),
    [enabled, saved, setHeader, dropTarget, dragId, onHeaderPointerDown],
  );

  useEffect(() => {
    if (!scrollCtx) return;
    scrollCtx.setReset(enabled && tableKey && saved ? () => setTableOrder(tableKey, null) : null);
    return () => scrollCtx.setReset(null);
  }, [scrollCtx, enabled, tableKey, saved]);

  const table = (
    <TableContext.Provider value={ctxValue}>
      <table ref={tableRef} className={cx(TABLE_BASE, className)} {...rest}>
        {children}
      </table>
    </TableContext.Provider>
  );

  const ghost =
    drag && typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none fixed z-[140] -translate-x-1/2 -translate-y-[130%] whitespace-nowrap rounded-md border border-[#262f8b]/30 bg-white px-2.5 py-1 text-xs font-medium text-[#262f8b] shadow-lg"
            style={{ left: drag.x, top: drag.y }}
          >
            {drag.label}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {table}
      {ghost}
    </>
  );
}
