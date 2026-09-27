import type { Metadata } from "next";
import Link from "next/link";
import { Check, Eye } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { TrackDot } from "@/components/ui/Badges";
import { ConceptMap } from "@/components/progress/ConceptMap";
import { MasteryBar } from "@/components/today/MasteryBar";
import { formatDay } from "@/lib/dates";
import { getProgressOverview } from "@/lib/stats";

export const metadata: Metadata = { title: "Progress" };

export default async function ProgressPage() {
  const data = await getProgressOverview();
  return (
    <div className="stagger space-y-8">
      <header>
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Day {data.dayNumber} · Progress</div>
        <h1 className="mt-3 font-display text-5xl leading-[0.95] sm:text-6xl">
          The <span className="italic text-gradient">concept map.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] text-muted">
          A concept is mastered after four correct answers in a row, spaced 1 → 2 → 4 → 7 days apart. Any miss sends it
          back to tomorrow, asked a different way.
        </p>
      </header>

      <Card className="grid gap-5 p-6 md:grid-cols-2 lg:grid-cols-3">
        {data.mastery.map((m) => (
          <MasteryBar key={m.track} mastery={m} />
        ))}
      </Card>

      <ConceptMap tracks={data.tracks} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <SectionTitle>Drill history</SectionTitle>
          {data.sessions.length === 0 ? (
            <p className="text-sm text-muted">No drills yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {data.sessions.map((s) => (
                <li key={s.day} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 font-mono text-xs text-faint">Day {s.dayNumber}</span>
                  <span className="w-24 shrink-0 text-xs text-muted">{formatDay(s.day)}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.round(s.score * 100)}%` }} />
                  </span>
                  <span className="w-14 shrink-0 text-right font-mono text-xs">
                    {s.correct}/{s.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-6">
          <SectionTitle>Arena history</SectionTitle>
          {data.challenges.length === 0 ? (
            <p className="text-sm text-muted">No challenges yet.</p>
          ) : (
            <ul className="space-y-1">
              {data.challenges.map((c) => (
                <li key={c.id}>
                  <Link href={`/arena/${c.id}`} className="flex items-center gap-3 rounded-lg px-1 py-1.5 text-sm hover:bg-raised">
                    <TrackDot track={c.track} />
                    <span className="min-w-0 flex-1 truncate">{c.title}</span>
                    <span className="text-xs text-faint">{c.kind}</span>
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
          )}
        </Card>
      </div>
    </div>
  );
}
