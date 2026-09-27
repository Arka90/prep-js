import type { DrillQuestion } from "@/lib/types";

const TONE = { correct: "bg-good", partial: "bg-warn", wrong: "bg-bad" } as const;

export function ProgressStrip({
  questions,
  index,
  onSelect,
}: {
  questions: DrillQuestion[];
  index: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {questions.map((q, i) => (
        <button
          key={q.id}
          onClick={() => onSelect(i)}
          aria-label={`Question ${i + 1}`}
          className="group flex-1 py-2"
        >
          <span
            className={`block h-1.5 rounded-full transition ${q.result ? TONE[q.result.verdict] : "bg-line group-hover:bg-line-strong"} ${
              i === index ? "ring-2 ring-accent ring-offset-2 ring-offset-bg" : ""
            }`}
          />
        </button>
      ))}
    </div>
  );
}
