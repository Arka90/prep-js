"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Flame, Gauge, LogOut, Settings, Swords, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/shell/ThemeToggle";

const ITEMS = [
  { href: "/", label: "Today", icon: Gauge },
  { href: "/drill", label: "Drill", icon: Brain },
  { href: "/arena", label: "Arena", icon: Swords },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

export function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2 font-mono text-[15px] font-semibold tracking-tight">
      <span className="grid size-7 place-items-center rounded-lg bg-fg text-bg">
        <span className="text-[13px] leading-none">
          <span className="text-accent">{"<"}</span>
          {">"}
        </span>
      </span>
      <span>
        prep<span className="text-accent">.</span>js
      </span>
    </Link>
  );
}

export function Sidebar({ dayNumber, streak }: { dayNumber: number; streak: number }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface/60 px-3 py-5 lg:flex">
      <div className="px-2">
        <Wordmark />
      </div>
      <nav className="mt-8 flex flex-col gap-0.5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active ? "bg-raised font-medium text-fg" : "text-muted hover:bg-raised/60 hover:text-fg"
              }`}
            >
              <Icon className={`size-[18px] ${active ? "text-accent" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3">
        <div className="rounded-xl border border-line bg-raised/50 p-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Training</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-semibold">Day {dayNumber}</span>
            <span className="flex items-center gap-1 font-mono text-sm text-accent" title="Day streak">
              <Flame className="size-4" />
              {streak}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between px-1">
          <ThemeToggle />
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-faint transition hover:text-fg"
          >
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/85 px-4 backdrop-blur lg:hidden">
        <Wordmark />
        <ThemeToggle />
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] ${active ? "text-accent" : "text-faint"}`}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
