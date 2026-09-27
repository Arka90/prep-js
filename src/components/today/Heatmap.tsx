import { formatDay } from "@/lib/dates";

interface Cell {
  day: string;
  answered: number;
  correct: number;
  solved: number;
}

function level(c: Cell) {
  const effort = c.answered + c.solved * 4;
  if (!effort) return 0;
  if (effort < 6) return 1;
  if (effort < 11) return 2;
  if (effort < 16) return 3;
  return 4;
}

const FILL = [
  "var(--line)",
  "color-mix(in oklab, var(--accent) 30%, var(--line))",
  "color-mix(in oklab, var(--accent) 55%, var(--line))",
  "color-mix(in oklab, var(--accent) 80%, var(--line))",
  "var(--accent)",
];

export function Heatmap({ activity }: { activity: Cell[] }) {
  const firstWeekday = (new Date(`${activity[0].day}T12:00:00Z`).getUTCDay() + 6) % 7;
  const cells: (Cell | null)[] = [...Array(firstWeekday).fill(null), ...activity];
  const active = activity.filter((c) => c.answered || c.solved).length;
  const answered = activity.reduce((s, c) => s + c.answered, 0);
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
        {cells.map((c, i) =>
          c ? (
            <div
              key={c.day}
              className="size-3.5 rounded-[4px] transition hover:scale-125 sm:size-4"
              style={{ background: FILL[level(c)], boxShadow: level(c) >= 3 ? `0 0 6px color-mix(in oklab, var(--accent) 50%, transparent)` : undefined }}
              title={`${formatDay(c.day)} — ${c.answered} answered, ${c.correct} correct${c.solved ? `, ${c.solved} solved` : ""}`}
            />
          ) : (
            <div key={`pad-${i}`} className="size-3.5 sm:size-4" />
          ),
        )}
      </div>
      <div className="flex items-center gap-6 text-xs text-faint">
        <span>
          <span className="font-display text-2xl text-fg">{active}</span> active days
        </span>
        <span>
          <span className="font-display text-2xl text-fg">{answered}</span> answered
        </span>
        <span className="hidden items-center gap-1 sm:flex">
          {FILL.map((f) => (
            <span key={f} className="size-2.5 rounded-[3px]" style={{ background: f }} />
          ))}
        </span>
      </div>
    </div>
  );
}
