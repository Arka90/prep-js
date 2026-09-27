"use client";

import { useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { ArrowRight, Swords } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { TrackDot } from "@/components/ui/Badges";
import { TRACK_META, TRACKS } from "@/lib/tracks";
import type { DrillQuestion } from "@/lib/types";

export function SessionSummary({ questions, onReview }: { questions: DrillQuestion[]; onReview: (index: number) => void }) {
  const answered = questions.filter((q) => q.result);
  const score = answered.reduce((sum, q) => sum + (q.result?.score ?? 0), 0);
  const pct = answered.length ? Math.round((score / answered.length) * 100) : 0;
  const misses = questions.map((q, i) => ({ q, i })).filter(({ q }) => q.result && q.result.verdict !== "correct");

  useEffect(() => {
    if (pct >= 80 && answered.length === questions.length) {
      void confetti({ particleCount: 90, spread: 70, origin: { y: 0.3 }, colors: ["#ff6a3d", "#ececef", "#3ecf8e"] });
    }
  }, [pct, answered.length, questions.length]);

  return (
    <div className="space-y-4 animate-rise">
      <Card className="relative overflow-hidden p-8 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
        />
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Drill complete</div>
        <div className="mt-3 font-display text-8xl leading-none">
          <span className={pct >= 80 ? "text-gradient" : ""}>{pct}</span>
          <span className="text-3xl text-faint">%</span>
        </div>
        <p className="mt-2 text-muted">
          {answered.filter((q) => q.result?.verdict === "correct").length} correct out of {answered.length}.{" "}
          {misses.length ? "Every miss is scheduled for tomorrow, from a different angle." : "Clean sweep. Tomorrow gets harder."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {TRACKS.map((track) => {
            const mine = answered.filter((q) => q.track === track);
            if (!mine.length) return null;
            const right = mine.filter((q) => q.result?.verdict === "correct").length;
            return (
              <div key={track} className="flex items-center gap-2 text-sm">
                <TrackDot track={track} />
                <span className="text-muted">{TRACK_META[track].short}</span>
                <span className="font-mono">
                  {right}/{mine.length}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {misses.length > 0 && (
        <Card className="p-6">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">To revisit</div>
          <ul className="divide-y divide-line">
            {misses.map(({ q, i }) => (
              <li key={q.id}>
                <button onClick={() => onReview(i)} className="flex w-full items-center gap-3 py-3 text-left">
                  <TrackDot track={q.track} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{q.conceptName}</span>
                    {q.result?.misconception && <span className="block truncate text-xs text-muted">{q.result.misconception}</span>}
                  </span>
                  <ArrowRight className="size-4 text-faint" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Link
        href="/arena"
        className="edge lift flex items-center justify-between rounded-2xl p-5"
      >
        <span className="flex items-center gap-3">
          <Swords className="size-5 text-accent" />
          <span>
            <span className="block font-medium">Now go write some code</span>
            <span className="block text-sm text-muted">Today&apos;s arena challenges are waiting.</span>
          </span>
        </span>
        <ArrowRight className="size-4 text-faint" />
      </Link>
    </div>
  );
}
