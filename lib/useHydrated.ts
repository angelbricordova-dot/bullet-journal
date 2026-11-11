"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** false while prerendering on the server, true in the browser. */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
