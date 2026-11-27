"use client";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstructorPortal } from "./store";

export function InstructorLanguageControl() {
  const language = useInstructorPortal((s) => s.language);
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() =>
        useInstructorPortal
          .getState()
          .setLanguage(language === "en" ? "ar" : "en")
      }
      aria-label={language === "en" ? "Switch to Arabic" : "Switch to English"}
    >
      <Languages aria-hidden="true" />
      <span lang={language === "en" ? "ar" : "en"}>
        {language === "en" ? "العربية" : "English"}
      </span>
    </Button>
  );
}
