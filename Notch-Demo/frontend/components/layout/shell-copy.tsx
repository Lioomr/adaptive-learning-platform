"use client";
import { createContext, useContext } from "react";
/** Optional portal localization. Other portals retain their existing English copy. */
export const ShellCopyContext = createContext({
  text: (value: string) => value,
  name: (_id: string, fallback: string) => fallback,
  direction: "ltr" as "ltr" | "rtl",
});
export const useShellCopy = () => useContext(ShellCopyContext);
