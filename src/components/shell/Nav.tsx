"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Flame, Gauge, LogOut, Settings, Swords, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/shell/ThemeToggle";

const ITEMS = [
  { href: "/", label: "Today", icon: Gauge, hint: "1" },
  { href: "/drill", label: "Drill", icon: Brain, hint: "2" },
  { href: "/arena", label: "Arena", icon: Swords, hint: "3" },
  { href: "/progress", label: "Progress", icon: TrendingUp, hint: "4" },
  { href: "/settings", label: "Settings", icon: Settings, hint: "5" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

export function Wordmark({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-11 rounded-2xl text-lg" : "size-8 rounded-xl text-[13px]";
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span
        className={`grid place-items-center bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] font-mono font-bold text-accent-fg shadow-glow ${box}`}
      >
        {"</>"}
      </span>
      <span className={`font-display tracking-tight ${size === "lg" ? "text-3xl" : "text-[22px]"}`}>
        prep<span className="italic text-accent">.</span>js
      </span>
    </Link>
  );
}

export function Sidebar({ dayNumber, streak }: { dayNumber: number; streak: number }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col px-4 py-6 lg:flex">
      <div className="px-2">
        <Wordmark />
      </div>

      <nav className="mt-10 flex flex-col gap-1">
        {ITEMS.map(({ href, label, icon: Icon, hint }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-all ${
                active ? "glass font-medium text-fg" : "text-muted hover:bg-raised/70 hover:text-fg"
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent shadow-glow" />}
              <Icon className={`size-[18px] transition ${active ? "text-accent" : "group-hover:text-fg"}`} />
              {label}
              <kbd className="ml-auto hidden rounded-md border border-line px-1.5 font-mono text-[10px] text-faint group-hover:inline">
                {hint}
              </kbd>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="edge relative overflow-hidden rounded-2xl p-4">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full opacity-30 blur-2xl"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          />
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Training</div>
          <div className="mt-1 flex items-end justify-between">
            <span className="font-display text-4xl leading-none">
              Day <span className="italic text-accent">{dayNumber}</span>
            </span>
            <span className="flex items-center gap-1 pb-0.5 font-mono text-sm text-accent" title="Day streak">
              <Flame className={`size-4 ${streak > 0 ? "flame" : ""}`} />
              {streak}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between px-1">
          <ThemeToggle />
          <button onClick={logout} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-faint transition hover:text-fg">
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
      <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between rounded-none border-x-0 border-t-0 px-4 lg:hidden">
        <Wordmark />
        <ThemeToggle />
      </header>
      <nav className="glass fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 rounded-2xl pb-[env(safe-area-inset-bottom)] lg:hidden">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-1 py-2.5 text-[10px] transition ${active ? "text-accent" : "text-faint"}`}
            >
              {active && <span className="absolute top-1 size-1 rounded-full bg-accent" />}
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
