import { TRACK_META, type Track } from "@/lib/tracks";

export function TrackDot({ track, className = "size-2" }: { track: Track; className?: string }) {
  return <span className={`inline-block shrink-0 rounded-full ${className}`} style={{ background: TRACK_META[track].color }} />;
}

export function TrackBadge({ track }: { track: Track }) {
  const color = TRACK_META[track].color;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium"
      style={{ color, borderColor: `color-mix(in oklab, ${color} 35%, transparent)`, background: `color-mix(in oklab, ${color} 10%, transparent)` }}
    >
      <TrackDot track={track} className="size-1.5" />
      {TRACK_META[track].label}
    </span>
  );
}

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" | "good" | "bad" | "warn" }) {
  const tones = {
    neutral: "text-muted border-line bg-raised",
    accent: "text-accent border-accent/30 bg-accent-soft",
    good: "text-good border-good/30 bg-good/10",
    bad: "text-bad border-bad/30 bg-bad/10",
    warn: "text-warn border-warn/30 bg-warn/10",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function DifficultyDots({ level, label = true }: { level: number; label?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={`Difficulty ${level} of 5`}>
      <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`h-2.5 w-1 rounded-full ${i <= level ? "bg-accent" : "bg-line-strong"}`} />
        ))}
      </span>
      {label && <span className="font-mono text-[11px] text-faint">L{level}</span>}
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-[10px] text-faint">{children}</kbd>
  );
}
