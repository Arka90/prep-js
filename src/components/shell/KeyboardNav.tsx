"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ROUTES = ["/", "/drill", "/arena", "/progress", "/settings"];

/** Press 1–5 anywhere (outside inputs) to jump between sections. */
export function KeyboardNav() {
  const router = useRouter();
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const t = event.target as HTMLElement | null;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || t.closest(".cm-editor"))) return;
      // Number keys are reserved for picking MCQ options while a drill question is open.
      if (document.querySelector("[data-mcq-open]")) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < ROUTES.length) router.push(ROUTES[index]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
  return null;
}
