import Link from "next/link";
import { ArrowRight, Bug, Check, Flame, Hammer, Layers, RotateCcw, Target } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { DifficultyDots, Pill, TrackBadge, TrackDot } from "@/components/ui/Badges";
import { Heatmap } from "@/components/today/Heatmap";
import { MasteryBar } from "@/components/today/MasteryBar";
import { Prefetcher } from "@/components/today/Prefetcher";
import { formatDay } from "@/lib/dates";
import type { TodaySummary } from "@/lib/stats";
import { TRACK_META } from "@/lib/tracks";

export function TodayView({ s }: { s: TodaySummary }) {
  const mastered = s.tracks.reduce((sum, t) => sum + t.counts.mastered, 0);
  const total = s.tracks.reduce((sum, t) => sum + t.total, 0);
  const drillDone = s.drill.status === "completed";
  const needsGeneration = s.drill.status === "none" || (s.arena.challenges.length < 2 && !s.arena.generating);

  return (
    <div className="space-y-8">
      {needsGeneration && <Prefetcher drill={s.drill.status === "none"} arena={s.arena.challenges.length < 2} />}

      <header className="animate-rise">
        <div className="font-mono text-xs uppercase tracking-[0.14em] text-faint">
          {formatDay(s.today, { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Day {s.dayNumber}</h1>
        <p className="mt-2 text-muted">
          Difficulty floor <span className="font-mono text-fg">L{s.difficultyFloor}</span> · curriculum tier{" "}
          <span className="font-mono text-fg">{s.unlockedTier}</span> unlocked. It only gets harder from here.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Flame className="size-4" />} label="Streak" value={`${s.streak}d`} accent />
        <Stat icon={<RotateCcw className="size-4" />} label="Due reviews" value={String(s.dueCount)} />
        <Stat icon={<Layers className="size-4" />} label="Mastered" value={`${mastered}/${total}`} />
        <Stat
          icon={<Target className="size-4" />}
          label="Today"
          value={s.drill.answered ? `${s.drill.correct}/${s.drill.answered}` : "—"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="relative overflow-hidden p-6 lg:col-span-3">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full opacity-20 blur-3xl"
            style={{ background: "var(--accent)" }}
          />
          <SectionTitle>Daily drill</SectionTitle>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {drillDone
                  ? "Drill complete"
                  : s.drill.status === "active"
                    ? `${s.drill.total - s.drill.answered} questions left`
                    : `${s.drill.total} fresh questions`}
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted">
                {drillDone
                  ? `${s.drill.correct} of ${s.drill.answered} correct. Misses come back tomorrow from a new angle.`
                  : s.drill.status === "generating"
                    ? "Writing today's questions, running the code to verify outputs and checking the vector memory for repeats…"
                    : "Reviews of weak concepts, new material, and one stretch question — never a repeat."}
              </p>
            </div>
            <Link
              href="/drill"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-accent-fg transition hover:brightness-110"
            >
              {drillDone ? "Review answers" : s.drill.status === "active" ? "Continue" : "Start drill"}
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-6 flex gap-1">
            {Array.from({ length: s.drill.total }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i < s.drill.answered ? "bg-accent" : "bg-line"}`}
              />
            ))}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <SectionTitle
            action={
              <Link href="/arena" className="flex items-center gap-1 text-xs text-muted hover:text-fg">
                Enter <ArrowRight className="size-3" />
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
                className="group flex items-center gap-3 rounded-xl border border-line bg-raised/40 p-3 transition hover:border-line-strong"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-raised text-muted">
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
              <Link href="/progress" className="flex items-center gap-1 text-xs text-muted hover:text-fg">
                Concept map <ArrowRight className="size-3" />
              </Link>
            }
          >
            Mastery by track
          </SectionTitle>
          <div className="space-y-4">
            {s.tracks.map((t) => (
              <MasteryBar key={t.track} mastery={t} />
            ))}
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <SectionTitle>Weak spots</SectionTitle>
          {s.weakSpots.length === 0 ? (
            <p className="py-6 text-sm text-muted">No weak spots yet. Answer a few questions and they&apos;ll show up here.</p>
          ) : (
            <ul className="space-y-3">
              {s.weakSpots.map((w) => (
                <li key={w.conceptId} className="border-l-2 pl-3" style={{ borderColor: TRACK_META[w.track].color }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{w.name}</span>
                    <span className="font-mono text-[11px] text-faint">{Math.round(w.accuracy * 100)}%</span>
                  </div>
                  {w.misconception && <p className="mt-0.5 text-xs text-muted">↳ {w.misconception}</p>}
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

      <div className="flex flex-wrap gap-2">
        {s.tracks.map((t) => (
          <TrackBadge key={t.track} track={t.track} />
        ))}
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <Card className="p-4">
      <div className={`flex items-center gap-1.5 text-xs ${accent ? "text-accent" : "text-faint"}`}>
        {icon}
        {label}
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold tracking-tight">{value}</div>
    </Card>
  );
}
