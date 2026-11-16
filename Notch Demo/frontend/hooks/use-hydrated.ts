"use client";
import { useSyncExternalStore } from "react";
import { useDemo } from "@/store/demo";

/**
 * True once persisted demo data has been read from localStorage.
 * Always false on the server and on the first client render, so markup matches
 * and store-dependent regions render their layout-matched skeletons until then.
 */
export function useHydrated() {
  return useSyncExternalStore(
    onChange => useDemo.persist.onFinishHydration(() => onChange()),
    () => useDemo.persist.hasHydrated(),
    () => false,
  );
}
