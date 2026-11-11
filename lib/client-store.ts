"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

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

function emit(key: string) {
  listeners.get(key)?.forEach((l) => l());
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

export function writeDoc<T>(key: string, value: T) {
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
      const prev = (entries.get(key)?.value ?? fallback) as T;
      const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeDoc(key, v);
    },
    // fallback is intentionally captured once per key
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  return [value, update, Boolean(snapshot?.loaded)];
}

/** Load every document under a prefix (e.g. all days). Read-only snapshot, refreshed on mount. */
export function useDocList<T>(prefix: string): { items: Record<string, T>; loaded: boolean } {
  const [state, setState] = useState<{ items: Record<string, T>; loaded: boolean }>({ items: {}, loaded: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/data?prefix=${encodeURIComponent(prefix)}`, { cache: "no-store" });
        if (res.status === 503) setSync("db_missing");
        const json = res.ok ? await res.json() : { items: [] };
        const items: Record<string, T> = {};
        for (const it of json.items as { key: string; value: T }[]) items[it.key] = it.value;
        // local unsaved edits win
        for (const [k, e] of entries) if (k.startsWith(prefix) && e.value !== undefined) items[k] = e.value as T;
        if (alive) setState({ items, loaded: true });
      } catch {
        const items: Record<string, T> = {};
        for (const [k, e] of entries) if (k.startsWith(prefix) && e.value !== undefined) items[k] = e.value as T;
        if (alive) setState({ items, loaded: true });
      }
    })();
    return () => {
      alive = false;
    };
  }, [prefix]);

  return state;
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
