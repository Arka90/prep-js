import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bug, Check, Flame, Hammer, Layers, RotateCcw, Sparkles, Target } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { DifficultyDots, Pill, TrackDot } from "@/components/ui/Badges";
import { Greeting } from "@/components/today/Greeting";
import { Heatmap } from "@/components/today/Heatmap";
import { MasteryBar } from "@/components/today/MasteryBar";
import { MasteryRing } from "@/components/today/MasteryRing";
import { Prefetcher } from "@/components/today/Prefetcher";
import { formatDay } from "@/lib/dates";
import type { TodaySummary } from "@/lib/stats";
import { TRACK_META } from "@/lib/tracks";

export function TodayView({ s }: { s: TodaySummary }) {
  const mastered = s.tracks.reduce((sum, t) => sum + t.counts.mastered, 0);
  const total = s.tracks.reduce((sum, t) => sum + t.total, 0);
  const drillDone = s.drill.status === "completed";
  const needsGeneration = s.drill.status === "none" || (s.arena.challenges.length < 2 && !s.arena.generating);
  const drillPct = s.drill.total ? s.drill.answered / s.drill.total : 0;

  return (
    <div className="stagger space-y-6">
      {needsGeneration && <Prefetcher drill={s.drill.status === "none"} arena={s.arena.challenges.length < 2} />}

      {/* Hero */}
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
            {formatDay(s.today, { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <h1 className="mt-3 font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl">
            <Greeting />.<br />
            <span className="italic text-gradient">Day {s.dayNumber}</span> of training.
          </h1>
          <p className="mt-4 max-w-lg text-[15px] text-muted">
            Difficulty floor <span className="font-mono text-fg">L{s.difficultyFloor}</span> · tier{" "}
            <span className="font-mono text-fg">{s.unlockedTier}</span> unlocked ·{" "}
            <span className="text-fg">{s.dueCount}</span> concept{s.dueCount === 1 ? "" : "s"} due for review.
          </p>
        </div>
        <div className="hidden sm:block">
          <MasteryRing value={mastered} total={total} />
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Flame className={`size-4 ${s.streak ? "flame" : ""}`} />} label="Day streak" value={String(s.streak)} accent />
        <Stat icon={<RotateCcw className="size-4" />} label="Due today" value={String(s.dueCount)} />
        <Stat icon={<Layers className="size-4" />} label="Mastered" value={mastered} sub={`/ ${total}`} />
        <Stat
          icon={<Target className="size-4" />}
          label="Today's score"
          value={s.drill.answered ? String(s.drill.correct) : "—"}
          sub={s.drill.answered ? `/ ${s.drill.answered}` : undefined}
        />
      </div>

      {/* Primary actions */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="relative overflow-hidden p-6 sm:p-8 lg:col-span-3" hover>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full opacity-[0.18] blur-3xl"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          />
          <div className="relative">
            <SectionTitle>Daily drill</SectionTitle>
            <h2 className="font-display text-3xl leading-tight sm:text-4xl">
              {drillDone ? (
                <>Drill <span className="italic text-accent">complete</span>.</>
              ) : s.drill.status === "active" ? (
                <>
                  <span className="italic text-accent">{s.drill.total - s.drill.answered}</span> questions left.
                </>
              ) : s.drill.status === "generating" ? (
                <>Writing today&apos;s <span className="italic text-accent">questions</span>…</>
              ) : (
                <>
                  <span className="italic text-accent">{s.drill.total}</span> fresh questions.
                </>
              )}
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted">
              {drillDone
                ? `${s.drill.correct} of ${s.drill.answered} correct. Misses come back tomorrow from a new angle.`
                : s.drill.status === "generating"
                  ? "Running the code to verify outputs and checking the vector memory for repeats."
                  : "Reviews of weak concepts, new material, and one stretch question. Never a repeat."}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/drill"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] px-5 text-sm font-medium text-accent-fg shadow-glow transition hover:brightness-110"
              >
                {drillDone ? "Review answers" : s.drill.status === "active" ? "Continue drill" : "Start drill"}
                <ArrowRight className="size-4" />
              </Link>
              <span className="font-mono text-xs text-faint">
                {s.drill.answered}/{s.drill.total} · {Math.round(drillPct * 100)}%
              </span>
            </div>
            <div className="mt-6 flex gap-1">
              {Array.from({ length: s.drill.total }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition ${i < s.drill.answered ? "bg-[linear-gradient(90deg,var(--accent),var(--accent-2))]" : "bg-line-strong"}`}
                />
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2" hover>
          <SectionTitle
            action={
              <Link href="/arena" className="flex items-center gap-1 text-xs text-muted transition hover:text-fg">
                Enter <ArrowUpRight className="size-3.5" />
              </Link>
            }
          >
            Coding arena
          </SectionTitle>
          <div className="space-y-2">
            {s.arena.challenges.length === 0 && (
              <p className="py-6 text-sm text-muted">
                {s.arena.generating ? "Forging today's challenges and validating their tests…" : "Two new challenges are waiting to be generated."}
              </p>
            )}
            {s.arena.challenges.map((c) => (
              <Link
                key={c.id}
                href={`/arena/${c.id}`}
                className="group flex items-center gap-3 rounded-xl border border-line bg-raised/40 p-3 transition hover:border-line-strong hover:bg-raised"
              >
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl text-fg"
                  style={{ background: `color-mix(in oklab, ${TRACK_META[c.track].color} 18%, transparent)`, color: TRACK_META[c.track].color }}
                >
                  {c.kind === "build" ? <Hammer className="size-4" /> : <Bug className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.title}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-faint">
                    <TrackDot track={c.track} /> {TRACK_META[c.track].label} · {c.kind}
                  </span>
                </span>
                {c.status === "solved" ? (
                  <Pill tone="good">
                    <Check className="size-3" /> solved
                  </Pill>
                ) : (
                  <DifficultyDots level={c.difficulty} label={false} />
                )}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          <SectionTitle
            action={
              <Link href="/progress" className="flex items-center gap-1 text-xs text-muted transition hover:text-fg">
                Concept map <ArrowUpRight className="size-3.5" />
              </Link>
            }
          >
            Mastery by track
          </SectionTitle>
          <div className="space-y-5">
            {s.tracks.map((t) => (
              <MasteryBar key={t.track} mastery={t} />
            ))}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <SectionTitle>Weak spots</SectionTitle>
          {s.weakSpots.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Sparkles className="size-6 text-faint" />
              <p className="mt-3 text-sm text-muted">Nothing here yet. Answer a few questions and the gaps will show.</p>
            </div>
          ) : (
            <ul className="space-y-3.5">
              {s.weakSpots.map((w) => (
                <li key={w.conceptId} className="rounded-xl border-l-2 bg-raised/40 py-2.5 pl-3 pr-3" style={{ borderColor: TRACK_META[w.track].color }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{w.name}</span>
                    <span className={`font-mono text-[11px] ${w.accuracy < 0.5 ? "text-bad" : "text-warn"}`}>{Math.round(w.accuracy * 100)}%</span>
                  </div>
                  {w.misconception && <p className="mt-1 text-xs leading-relaxed text-muted">↳ {w.misconception}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <SectionTitle>Last 12 weeks</SectionTitle>
        <Heatmap activity={s.activity} />
      </Card>
    </div>
  );
}

function Stat({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <Card className="p-4 sm:p-5" variant="glass">
      <div className={`flex items-center gap-1.5 text-xs ${accent ? "text-accent" : "text-faint"}`}>
        {icon}
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-display text-4xl leading-none">{value}</span>
        {sub && <span className="font-mono text-xs text-faint">{sub}</span>}
      </div>
    </Card>
  );
}
