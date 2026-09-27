/** Radial progress: mastered / total concepts. Animates in on mount. */
export function MasteryRing({ value, total, size = 148 }: { value: number; total: number; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? value / total : 0;
  const offset = c * (1 - pct);
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--line-strong)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="ring-anim"
          style={{ ["--ring-len" as string]: c, filter: "drop-shadow(0 0 6px color-mix(in oklab, var(--accent) 60%, transparent))" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-4xl leading-none">
            {Math.round(pct * 100)}
            <span className="text-xl text-faint">%</span>
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">mastered</div>
        </div>
      </div>
    </div>
  );
}
