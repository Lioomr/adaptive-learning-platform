"use client";

import { useSyncExternalStore } from "react";
import { SunMoon } from "lucide-react";
import { useShellCopy } from "./shell-copy";

const storageKey = "notch-appearance";
type Appearance = "system" | "light" | "dark";

function applyAppearance(value: string | null) {
  if (value === "light" || value === "dark") {
    document.documentElement.dataset.notchTheme = value;
  } else {
    delete document.documentElement.dataset.notchTheme;
  }
}

function subscribe(update: () => void) {
  function sync(event: StorageEvent) {
    if (event.key === storageKey || event.key === null) {
      applyAppearance(event.newValue);
      update();
    }
  }
  window.addEventListener("storage", sync);
  window.addEventListener("notch-appearance-change", update);
  return () => {
    window.removeEventListener("storage", sync);
    window.removeEventListener("notch-appearance-change", update);
  };
}

function selectAppearance(value: Appearance) {
  applyAppearance(value);
  try {
    if (value === "system") localStorage.removeItem(storageKey);
    else localStorage.setItem(storageKey, value);
  } catch { /* The selected appearance still applies for this visit. */ }
  window.dispatchEvent(new Event("notch-appearance-change"));
}

export function AppearanceControl() {
  const { text } = useShellCopy();
  const value = useSyncExternalStore(subscribe,
    () => document.documentElement.dataset.notchTheme ?? "system",
    () => "system",
  );
  return (
    <label title={text("Appearance")} className="relative grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
      <SunMoon className="size-5" aria-hidden="true" />
      <select
        aria-label={text("Appearance")}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
        value={value}
        onChange={event => selectAppearance(event.target.value as Appearance)}
      >
        <option value="system">{text("System appearance")}</option>
        <option value="light">{text("Light")}</option>
        <option value="dark">{text("Dark")}</option>
      </select>
    </label>
  );
}
