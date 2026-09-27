"use client";

import { Moon, Sun } from "lucide-react";
import { useIsDark } from "@/components/shell/useIsDark";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const dark = useIsDark();
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };
  return (
    <button
      onClick={toggle}
      className={`grid size-9 place-items-center rounded-lg text-muted transition hover:bg-raised hover:text-fg ${className}`}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
