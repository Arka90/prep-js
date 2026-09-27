import { TRACK_META } from "@/lib/tracks";
import type { TrackMastery } from "@/lib/stats";

export function MasteryBar({ mastery }: { mastery: TrackMastery }) {
  const { track, total, counts } = mastery;
  const color = TRACK_META[track].color;
  const segments = [
    { key: "mastered", n: counts.mastered, style: { background: color } },
    { key: "reviewing", n: counts.reviewing, style: { background: `color-mix(in oklab, ${color} 55%, transparent)` } },
    { key: "learning", n: counts.learning, style: { background: `color-mix(in oklab, ${color} 25%, transparent)` } },
  ];
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-medium">{TRACK_META[track].label}</span>
        <span className="font-mono text-xs text-faint">
          <span className="text-fg">{counts.mastered}</span> mastered · {counts.reviewing + counts.learning} in progress · {total}
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-line">
        {segments.map((s) =>
          s.n ? <div key={s.key} style={{ ...s.style, width: `${(s.n / total) * 100}%` }} title={`${s.n} ${s.key}`} /> : null,
        )}
      </div>
    </div>
  );
}
