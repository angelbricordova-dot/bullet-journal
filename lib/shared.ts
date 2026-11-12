"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Tiny in-memory UI state shared between the two faces of a spread (and across the book). */
const values = new Map<string, unknown>();
const subs = new Map<string, Set<() => void>>();

export function setShared<T>(key: string, v: T) {
  values.set(key, v);
  subs.get(key)?.forEach((f) => f());
}

export function useShared<T>(key: string, initial: T): [T, (v: T) => void] {
  const value = useSyncExternalStore(
    useCallback(
      (cb: () => void) => {
        let s = subs.get(key);
        if (!s) subs.set(key, (s = new Set()));
        s.add(cb);
        return () => s!.delete(cb);
      },
      [key],
    ),
    () => (values.has(key) ? (values.get(key) as T) : initial),
    () => initial,
  );
  return [value, useCallback((v: T) => setShared(key, v), [key])];
}

export function getShared<T>(key: string, initial: T): T {
  return values.has(key) ? (values.get(key) as T) : initial;
}
