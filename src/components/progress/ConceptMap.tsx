"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Badges";
import { formatDay } from "@/lib/dates";
import { TRACK_META } from "@/lib/tracks";
import type { ProgressOverview } from "@/lib/stats";

type TrackData = ProgressOverview["tracks"][number];
type ConceptData = TrackData["concepts"][number];

const STATUS_LABEL = { unseen: "Not started", learning: "Learning", reviewing: "Reviewing", mastered: "Mastered" } as const;

export function ConceptMap({ tracks }: { tracks: TrackData[] }) {
  const [active, setActive] = useState(tracks.find((t) => t.enabled)?.track ?? tracks[0].track);
  const [selected, setSelected] = useState<ConceptData | null>(null);
  const track = tracks.find((t) => t.track === active)!;
  const color = TRACK_META[active].color;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1">
        {tracks.map((t) => (
          <button
            key={t.track}
            onClick={() => {
              setActive(t.track);
              setSelected(null);
            }}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm transition ${
              t.track === active ? "bg-raised font-medium text-fg" : "text-muted hover:text-fg"
            } ${t.enabled ? "" : "opacity-50"}`}
          >
            <span className="size-2 rounded-full" style={{ background: TRACK_META[t.track].color }} />
            {TRACK_META[t.track].label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          {[1, 2, 3, 4, 5].map((tier) => {
            const concepts = track.concepts.filter((c) => c.tier === tier);
            if (!concepts.length) return null;
            return (
              <div key={tier}>
                <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Tier {tier}</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {concepts.map((c) => {
                    const fill =
                      c.status === "mastered" ? 100 : c.status === "reviewing" ? 55 : c.status === "learning" ? 22 : 0;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelected(c)}
                        className={`relative overflow-hidden rounded-xl border p-3 text-left text-[13px] transition ${
                          selected?.id === c.id ? "border-accent" : c.status === "unseen" ? "border-dashed border-line" : "border-line hover:border-line-strong"
                        }`}
                      >
                        <span
                          aria-hidden
                          className="absolute inset-y-0 left-0"
                          style={{ width: `${fill}%`, background: `color-mix(in oklab, ${color} ${c.status === "mastered" ? 16 : 10}%, transparent)` }}
                        />
                        <span className="relative flex items-center justify-between gap-2">
                          <span className={`min-w-0 truncate ${c.status === "unseen" ? "text-faint" : ""}`}>{c.name}</span>
                          {c.status === "mastered" ? (
                            <Check className="size-3.5 shrink-0" style={{ color }} />
                          ) : c.attempts ? (
                            <span className="shrink-0 font-mono text-[10px] text-faint">
                              {c.correct}/{c.attempts}
                            </span>
                          ) : null}
                        </span>
                        <span className="relative mt-2 flex gap-0.5">
                          {[0, 1, 2, 3].map((i) => (
                            <span
                              key={i}
                              className="h-1 flex-1 rounded-full"
                              style={{ background: i < Math.min(c.box, 4) ? color : "var(--line)" }}
                            />
                          ))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card className="p-5">
            {selected ? (
              <div className="animate-rise">
                <div className="flex items-center gap-2">
                  <Pill tone={selected.status === "mastered" ? "good" : selected.status === "unseen" ? "neutral" : "accent"}>
                    {STATUS_LABEL[selected.status]}
                  </Pill>
                  <span className="font-mono text-[11px] text-faint">tier {selected.tier}</span>
                </div>
                <h3 className="mt-3 font-semibold">{selected.name}</h3>
                <p className="mt-2 text-sm text-muted">{selected.focus}</p>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Metric label="Accuracy" value={selected.attempts ? `${Math.round((selected.correct / selected.attempts) * 100)}%` : "—"} />
                  <Metric label="Level" value={selected.level ? `L${selected.level}` : "—"} />
                  <Metric label="Next" value={selected.nextDue ? formatDay(selected.nextDue, { weekday: undefined }) : "—"} />
                </dl>
                {selected.misconceptions.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-warn">Beliefs to unlearn</div>
                    <ul className="space-y-1.5 text-sm">
                      {selected.misconceptions.map((m) => (
                        <li key={m} className="text-muted">↳ {m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">Pick a concept to see what it covers, how you&apos;re doing and what still trips you up.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-bg px-2 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-faint">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm">{value}</dd>
    </div>
  );
}
