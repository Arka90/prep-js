import { TRACK_META } from "@/lib/tracks";
import type { TrackMastery } from "@/lib/stats";

export function MasteryBar({ mastery }: { mastery: TrackMastery }) {
  const { track, total, counts } = mastery;
  const color = TRACK_META[track].color;
  const segments = [
    { key: "mastered", n: counts.mastered, bg: color },
    { key: "reviewing", n: counts.reviewing, bg: `color-mix(in oklab, ${color} 55%, transparent)` },
    { key: "learning", n: counts.learning, bg: `color-mix(in oklab, ${color} 25%, transparent)` },
  ];
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className="size-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
          {TRACK_META[track].label}
        </span>
        <span className="font-mono text-[11px] text-faint">
          <span className="text-fg">{counts.mastered}</span>
          <span className="mx-1 text-faint">/</span>
          {total}
          <span className="ml-2 text-faint">· {counts.reviewing + counts.learning} active</span>
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-line">
        {segments.map((s) =>
          s.n ? (
            <div key={s.key} className="bar-grow" style={{ background: s.bg, width: `${(s.n / total) * 100}%` }} title={`${s.n} ${s.key}`} />
          ) : null,
        )}
      </div>
    </div>
  );
}
