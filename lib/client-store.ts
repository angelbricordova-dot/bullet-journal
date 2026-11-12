"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

/* ---------------------------------------------------------------
 * Tiny document cache with optimistic writes and debounced saves.
 * Each key mirrors to localStorage so the notebook opens instantly,
 * then the server copy (Postgres) is the source of truth.
 * ------------------------------------------------------------- */

type Entry = { value: unknown; loaded: boolean; dirty: boolean };

const entries = new Map<string, Entry>();
const listeners = new Map<string, Set<() => void>>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const inflight = new Map<string, Promise<void>>();

export type SyncState = "idle" | "saving" | "saved" | "offline" | "error" | "db_missing";
let syncState: SyncState = "idle";
const syncListeners = new Set<() => void>();
function setSync(s: SyncState) {
  syncState = s;
  syncListeners.forEach((l) => l());
}

const LS = "bitacora:";
function lsGet(key: string): unknown {
  try {
    const raw = localStorage.getItem(LS + key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}
function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(LS + key, JSON.stringify(value));
  } catch {
    /* quota or private mode: ignore, server is the source of truth */
  }
}

let version = 0;
const anyListeners = new Set<() => void>();
function emit(key: string) {
  version++;
  listeners.get(key)?.forEach((l) => l());
  anyListeners.forEach((l) => l());
}

function subscribe(key: string, cb: () => void) {
  let set = listeners.get(key);
  if (!set) listeners.set(key, (set = new Set()));
  set.add(cb);
  return () => set!.delete(cb);
}

async function load(key: string) {
  if (inflight.has(key)) return inflight.get(key);
  const p = (async () => {
    try {
      const res = await fetch(`/api/data?key=${encodeURIComponent(key)}`, { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (res.status === 503) setSync("db_missing");
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      const e = entries.get(key);
      if (e?.dirty) return; // a local edit is pending; it will win
      const value = json.value ?? e?.value;
      entries.set(key, { value, loaded: true, dirty: false });
      if (json.value !== null) lsSet(key, json.value);
      emit(key);
    } catch {
      const e = entries.get(key);
      entries.set(key, { value: e?.value, loaded: true, dirty: e?.dirty ?? false });
      if (!navigator.onLine) setSync("offline");
      emit(key);
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

async function save(key: string) {
  const e = entries.get(key);
  if (!e) return;
  setSync("saving");
  try {
    const res = await fetch("/api/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: e.value }),
      keepalive: true,
    });
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (res.status === 503) return setSync("db_missing");
    if (!res.ok) throw new Error(String(res.status));
    const cur = entries.get(key);
    if (cur && cur.value === e.value) cur.dirty = false;
    if (![...entries.values()].some((x) => x.dirty)) setSync("saved");
  } catch {
    setSync(navigator.onLine ? "error" : "offline");
    // retry later
    schedule(key, 5000);
  }
}

function schedule(key: string, ms = 600) {
  clearTimeout(timers.get(key));
  timers.set(key, setTimeout(() => save(key), ms));
}

export function flushAll() {
  for (const [key, e] of entries) {
    if (e.dirty) {
      clearTimeout(timers.get(key));
      void save(key);
    }
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushAll);
  window.addEventListener("online", flushAll);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAll();
  });
}

/* ---------- undo / redo (Ctrl+Z, Ctrl+Shift+Z / Ctrl+Y) ---------- */
type Step = { key: string; before: unknown; after: unknown; t: number };
const undoStack: Step[] = [];
const redoStack: Step[] = [];
let replaying = false;
const histSubs = new Set<() => void>();
const histNotify = () => histSubs.forEach((f) => f());

function record(key: string, before: unknown, after: unknown) {
  if (replaying) return;
  const now = Date.now();
  const top = undoStack[undoStack.length - 1];
  // typing in the same field within a moment is one step
  if (top && top.key === key && now - top.t < 800) {
    top.after = after;
    top.t = now;
  } else {
    undoStack.push({ key, before: before === undefined ? null : before, after, t: now });
    if (undoStack.length > 300) undoStack.shift();
  }
  redoStack.length = 0;
  histNotify();
}

export function undo(): boolean {
  const s = undoStack.pop();
  if (!s) return false;
  replaying = true;
  writeDoc(s.key, s.before);
  replaying = false;
  redoStack.push(s);
  histNotify();
  return true;
}

export function redo(): boolean {
  const s = redoStack.pop();
  if (!s) return false;
  replaying = true;
  writeDoc(s.key, s.after);
  replaying = false;
  undoStack.push(s);
  histNotify();
  return true;
}

export function useHistory() {
  return useSyncExternalStore(
    (cb) => {
      histSubs.add(cb);
      return () => histSubs.delete(cb);
    },
    () => `${undoStack.length}:${redoStack.length}`,
    () => "0:0",
  );
}

export function writeDoc<T>(key: string, value: T) {
  record(key, entries.get(key)?.value, value);
  entries.set(key, { value, loaded: true, dirty: true });
  lsSet(key, value);
  emit(key);
  schedule(key);
}

export function readDoc<T>(key: string): T | undefined {
  return entries.get(key)?.value as T | undefined;
}

/**
 * Subscribe to one document. Returns [value, update, loaded].
 * `fallback` is used until a saved value exists.
 */
export function useDoc<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const snapshot = useSyncExternalStore(
    useCallback((cb) => subscribe(key, cb), [key]),
    () => entries.get(key),
    () => undefined,
  );

  useEffect(() => {
    if (!entries.has(key)) {
      const local = lsGet(key);
      if (local !== undefined) {
        entries.set(key, { value: local, loaded: false, dirty: false });
        emit(key);
      }
    }
    void load(key);
  }, [key]);

  const value = (snapshot?.value ?? fallback) as T;

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const apply = () => {
        const prev = (entries.get(key)?.value ?? fallback) as T;
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        writeDoc(key, v);
      };
      // never write on top of a document we haven't read from the server yet
      if (entries.get(key)?.loaded) apply();
      else void load(key).then(apply);
    },
    // fallback is intentionally captured once per key
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return [value, update, Boolean(snapshot?.loaded)];
}

/** Every document under a prefix (e.g. "day:2026-11"). Server snapshot on mount, live with local edits. */
export function useDocList<T>(prefix: string): { items: Record<string, T>; loaded: boolean } {
  const [server, setServer] = useState<{ prefix: string; items: Record<string, T>; loaded: boolean }>({ prefix, items: {}, loaded: false });
  const v = useSyncExternalStore(
    (cb) => {
      anyListeners.add(cb);
      return () => anyListeners.delete(cb);
    },
    () => version,
    () => 0,
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      const items: Record<string, T> = {};
      try {
        const res = await fetch(`/api/data?prefix=${encodeURIComponent(prefix)}`, { cache: "no-store" });
        if (res.status === 503) setSync("db_missing");
        const json = res.ok ? await res.json() : { items: [] };
        for (const it of json.items as { key: string; value: T }[]) items[it.key] = it.value;
      } catch {
        /* offline: local entries only */
      }
      if (alive) setServer({ prefix, items, loaded: true });
    })();
    return () => {
      alive = false;
    };
  }, [prefix]);

  return useMemo(() => {
    const items: Record<string, T> = server.prefix === prefix ? { ...server.items } : {};
    for (const [k, e] of entries) if (k.startsWith(prefix) && e.value !== undefined && (e.dirty || e.loaded)) items[k] = e.value as T;
    return { items, loaded: server.loaded && server.prefix === prefix };
    // v changes whenever any local document changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server, prefix, v]);
}

export function useSyncState(): SyncState {
  return useSyncExternalStore(
    (cb) => {
      syncListeners.add(cb);
      return () => syncListeners.delete(cb);
    },
    () => syncState,
    () => "idle" as SyncState,
  );
}

/** Make sure a document is loaded from the server, then return its value. */
export async function ensureLoaded<T>(key: string): Promise<T | undefined> {
  const e = entries.get(key);
  if (!e?.loaded) await load(key);
  return entries.get(key)?.value as T | undefined;
}
