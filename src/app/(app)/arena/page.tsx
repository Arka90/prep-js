import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bug, Check, Eye, Hammer } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { DifficultyDots, Pill, TrackBadge, TrackDot } from "@/components/ui/Badges";
import { ArenaGenerator } from "@/components/arena/ArenaGenerator";
import { arenaGenerating, challengesForDay } from "@/lib/arena/challenges";
import { formatDay } from "@/lib/dates";
import { db, must } from "@/lib/db";
import { getDayContext } from "@/lib/engine/drill";
import { TRACK_META } from "@/lib/tracks";
import type { ChallengeRow } from "@/lib/types";

export const metadata: Metadata = { title: "Arena" };

export default async function ArenaPage() {
  const ctx = await getDayContext();
  const [today, generating, pastRes] = await Promise.all([
    challengesForDay(ctx.today),
    arenaGenerating(),
    db()
      .from("challenges")
      .select("id, day, kind, track, title, difficulty, status, attempts")
      .lt("day", ctx.today)
      .order("day", { ascending: false })
      .limit(40),
  ]);
  const past = must(pastRes, "load past challenges") as Pick<
    ChallengeRow,
    "id" | "day" | "kind" | "track" | "title" | "difficulty" | "status" | "attempts"
  >[];
  const missing = today.length < 2;

  return (
    <div className="stagger space-y-8">
      <header>
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Day {ctx.dayNumber} · Arena</div>
        <h1 className="mt-3 font-display text-5xl leading-[0.95] sm:text-6xl">
          Write it <span className="italic text-gradient">yourself.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] text-muted">
          One build and one debug challenge a day. No autocomplete, no AI — just you, the problem and the tests. Every
          test was checked against a reference solution before you got it.
        </p>
      </header>

      {missing && <ArenaGenerator initiallyGenerating={generating} />}

      <div className="grid gap-4 md:grid-cols-2">
        {today.map((c) => (
          <Link key={c.id} href={`/arena/${c.id}`} className="group">
            <Card className="relative flex h-full flex-col overflow-hidden p-6" hover>
              <span
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-[0.15] blur-3xl"
                style={{ background: TRACK_META[c.track].color }}
              />
              <div className="flex items-center gap-2">
                <span
                  className="grid size-10 place-items-center rounded-xl"
                  style={{ background: `color-mix(in oklab, ${TRACK_META[c.track].color} 18%, transparent)`, color: TRACK_META[c.track].color }}
                >
                  {c.kind === "build" ? <Hammer className="size-4" /> : <Bug className="size-4" />}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                  {c.kind === "build" ? "Build" : "Debug"}
                </span>
                <span className="ml-auto">
                  <DifficultyDots level={c.difficulty} />
                </span>
              </div>
              <h2 className="mt-5 font-display text-3xl leading-tight">{c.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-muted">
                {c.description.replace(/[#*`>_]/g, "").replace(/\s+/g, " ").slice(0, 220)}
              </p>
              <div className="mt-auto flex items-center gap-2 pt-5">
                <TrackBadge track={c.track} />
                {c.status === "solved" && (
                  <Pill tone="good">
                    <Check className="size-3" /> solved
                  </Pill>
                )}
                {c.status === "revealed" && (
                  <Pill tone="warn">
                    <Eye className="size-3" /> revealed
                  </Pill>
                )}
                <span className="ml-auto flex items-center gap-1 text-sm text-muted group-hover:text-fg">
                  {c.status === "open" ? (c.attempts ? "Continue" : "Start") : "Open"} <ArrowRight className="size-4" />
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {past.length > 0 && (
        <Card className="p-6">
          <SectionTitle>Previous challenges</SectionTitle>
          <ul className="divide-y divide-line">
            {past.map((c) => (
              <li key={c.id}>
                <Link href={`/arena/${c.id}`} className="flex items-center gap-3 py-3 text-sm">
                  <span className="w-20 shrink-0 font-mono text-xs text-faint">{formatDay(c.day, { weekday: undefined })}</span>
                  <TrackDot track={c.track} />
                  <span className="min-w-0 flex-1 truncate">{c.title}</span>
                  <span className="hidden text-xs text-faint sm:inline">
                    {TRACK_META[c.track].short} · {c.kind}
                  </span>
                  {c.status === "solved" ? (
                    <Check className="size-4 text-good" />
                  ) : c.status === "revealed" ? (
                    <Eye className="size-4 text-warn" />
                  ) : (
                    <span className="size-4 rounded-full border border-line-strong" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
