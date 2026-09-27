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

const FILL = ["var(--line)", "color-mix(in oklab, var(--accent) 30%, var(--line))", "color-mix(in oklab, var(--accent) 55%, var(--line))", "color-mix(in oklab, var(--accent) 80%, var(--line))", "var(--accent)"];

export function Heatmap({ activity }: { activity: Cell[] }) {
  // Columns are weeks starting Monday; pad the first column.
  const firstWeekday = (new Date(`${activity[0].day}T12:00:00Z`).getUTCDay() + 6) % 7;
  const cells: (Cell | null)[] = [...Array(firstWeekday).fill(null), ...activity];
  return (
    <div className="flex items-end gap-4 overflow-x-auto">
      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {cells.map((c, i) =>
          c ? (
            <div
              key={c.day}
              className="size-3.5 rounded-[4px] sm:size-4"
              style={{ background: FILL[level(c)] }}
              title={`${formatDay(c.day)} — ${c.answered} answered, ${c.correct} correct${c.solved ? `, ${c.solved} solved` : ""}`}
            />
          ) : (
            <div key={`pad-${i}`} className="size-3.5 sm:size-4" />
          ),
        )}
      </div>
      <div className="hidden shrink-0 items-center gap-1 pb-0.5 text-[10px] text-faint sm:flex">
        less
        {FILL.map((f) => (
          <span key={f} className="size-2.5 rounded-[3px]" style={{ background: f }} />
        ))}
        more
      </div>
    </div>
  );
}
