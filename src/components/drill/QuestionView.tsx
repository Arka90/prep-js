"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, CircleSlash, RefreshCw, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { DifficultyDots, Kbd, Pill, TrackBadge } from "@/components/ui/Badges";
import { Markdown } from "@/components/ui/Markdown";
import { TRACK_META } from "@/lib/tracks";
import { KIND_LABEL, type DrillQuestion, type DrillResult } from "@/lib/types";

/** Bare code options (no backticks) read better in monospace. */
function looksLikeCode(text: string) {
  return !text.includes("`") && /^[[{(<'"]|=>|;\s*$|^\w[\w.$]*\(.*\)$|^(const|let|var|await|return|new) /.test(text.trim());
}

const MODE_LABEL = { new: "New", review: "Review", stretch: "Stretch" } as const;
const PLACEHOLDER = {
  predict_output: "One line per console.log, in order.\ne.g.\n3\n[ 1, 2 ]\nTypeError",
  debug: "What's the root cause, and what's the fix?",
  explain: "Answer like you would in an interview — 2 to 5 sentences.",
  mcq: "",
} as const;

export function QuestionView(props: {
  question: DrillQuestion;
  position: number;
  total: number;
  draft: string;
  onDraft: (value: string) => void;
  submitting: boolean;
  variantLoading: boolean;
  onSubmit: (response: string) => void;
  onAskAgain: () => void;
  onNext: () => void;
}) {
  const { question: q, submitting } = props;
  const [value, setValue] = useState(props.draft);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const answered = Boolean(q.result);

  useEffect(() => {
    if (!answered) textarea.current?.focus();
  }, [answered]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const typing = event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement;
      if (answered) {
        if (event.key === "Enter" && !typing && !event.metaKey && !event.ctrlKey) {
          event.preventDefault();
          props.onNext();
        }
        return;
      }
      if (q.kind === "mcq" && !typing && /^[1-4]$/.test(event.key) && q.options) {
        const option = q.options[Number(event.key) - 1];
        if (option) {
          setValue(option);
          props.onDraft(option);
        }
      }
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && value.trim()) {
        event.preventDefault();
        props.onSubmit(value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="space-y-4 animate-rise" data-mcq-open={q.kind === "mcq" && !answered ? "" : undefined}>
      <Card className="relative overflow-hidden p-5 sm:p-7">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, ${TRACK_META[q.track].color}, transparent 70%)` }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <TrackBadge track={q.track} />
          <Pill tone={q.mode === "new" ? "accent" : q.mode === "stretch" ? "warn" : "neutral"}>{MODE_LABEL[q.mode]}</Pill>
          <span className="ml-auto">
            <DifficultyDots level={q.difficulty} />
          </span>
        </div>
        <div className="mt-5 flex items-baseline gap-3">
          <span className="font-display text-2xl italic text-faint">
            {String(props.position).padStart(2, "0")}
            <span className="not-italic text-line-strong">/{String(props.total).padStart(2, "0")}</span>
          </span>
          <div className="min-w-0 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {KIND_LABEL[q.kind]} <span className="text-faint">·</span> {q.conceptName}
          </div>
        </div>
        <Markdown className="mt-3 text-[17px] font-medium leading-relaxed">{q.prompt}</Markdown>
        {q.code && <CodeBlock code={q.code} language={TRACK_META[q.track].language} className="mt-5" />}

        {q.kind === "mcq" && q.options ? (
          <div className="mt-6 grid gap-2">
            {q.options.map((option, i) => {
              const picked = (q.result?.response ?? value) === option;
              const isAnswer = q.result && option === q.result.answer;
              const state = q.result
                ? isAnswer
                  ? "border-good bg-good/10"
                  : picked
                    ? "border-bad bg-bad/10"
                    : "border-line opacity-60"
                : picked
                  ? "border-accent bg-accent-soft"
                  : "border-line hover:border-line-strong";
              return (
                <button
                  key={option}
                  disabled={answered || submitting}
                  onClick={() => {
                    setValue(option);
                    props.onDraft(option);
                  }}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left text-[14.5px] transition ${state}`}
                >
                  <span className="mt-px grid size-6 shrink-0 place-items-center rounded-md border border-line bg-raised font-mono text-xs text-muted">
                    {isAnswer ? <Check className="size-3.5 text-good" /> : q.result && picked ? <X className="size-3.5 text-bad" /> : i + 1}
                  </span>
                  <span className="min-w-0 break-words">
                    {looksLikeCode(option) ? (
                      <code className="font-mono text-[13px]">{option}</code>
                    ) : (
                      <Markdown className="text-[14.5px]">{option}</Markdown>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ) : !answered ? (
          <textarea
            ref={textarea}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              props.onDraft(e.target.value);
            }}
            placeholder={PLACEHOLDER[q.kind]}
            rows={q.kind === "predict_output" ? 5 : 6}
            spellCheck={q.kind !== "predict_output"}
            className={`mt-6 w-full resize-y rounded-xl border border-line bg-bg-deep/60 p-4 text-[14.5px] outline-none transition placeholder:text-faint focus:border-accent focus:shadow-[0_0_0_4px_var(--accent-soft)] ${
              q.kind === "predict_output" ? "font-mono" : ""
            }`}
          />
        ) : null}

        {!answered && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={() => props.onSubmit(value)} disabled={!value.trim()} loading={submitting}>
              Check answer
            </Button>
            <Button variant="ghost" onClick={() => props.onSubmit("idk")} disabled={submitting}>
              <CircleSlash className="size-4" /> I don&apos;t know
            </Button>
            <span className="ml-auto hidden items-center gap-1.5 text-xs text-faint sm:flex">
              {q.kind === "mcq" && (
                <>
                  <Kbd>1</Kbd>–<Kbd>4</Kbd> pick ·
                </>
              )}
              <Kbd>⌘</Kbd>
              <Kbd>↵</Kbd> submit
            </span>
          </div>
        )}
      </Card>

      {q.result && (
        <Feedback
          question={q}
          result={q.result}
          variantLoading={props.variantLoading}
          onAskAgain={props.onAskAgain}
          onNext={props.onNext}
        />
      )}
    </div>
  );
}

const VERDICT = {
  correct: { title: "Correct", tone: "text-good", ring: "border-good/40 shadow-[0_0_0_1px_var(--good),0_20px_60px_-30px_var(--good)]", icon: Check },
  partial: { title: "Partly there", tone: "text-warn", ring: "border-warn/40 shadow-[0_0_0_1px_var(--warn),0_20px_60px_-30px_var(--warn)]", icon: RefreshCw },
  wrong: { title: "Not quite", tone: "text-bad", ring: "border-bad/40 shadow-[0_0_0_1px_var(--bad),0_20px_60px_-30px_var(--bad)]", icon: X },
} as const;

function Feedback({
  question,
  result,
  variantLoading,
  onAskAgain,
  onNext,
}: {
  question: DrillQuestion;
  result: DrillResult;
  variantLoading: boolean;
  onAskAgain: () => void;
  onNext: () => void;
}) {
  const v = VERDICT[result.verdict];
  const showAnswers = question.kind !== "mcq";
  return (
    <Card className={`border p-5 sm:p-7 animate-rise ${v.ring}`}>
      <div className="flex items-center gap-2.5">
        <span className={`grid size-8 place-items-center rounded-full bg-current/10 ${v.tone}`}>
          <v.icon className="size-4" />
        </span>
        <h3 className={`font-display text-2xl italic ${v.tone}`}>{v.title}</h3>
        {result.verified && (
          <span className="ml-auto flex items-center gap-1 text-xs text-faint" title="The expected output was produced by actually running this code">
            <ShieldCheck className="size-3.5 text-good" /> output verified by execution
          </span>
        )}
      </div>
      {result.feedback && <Markdown className="mt-2 text-muted">{result.feedback}</Markdown>}
      {result.misconception && (
        <div className="mt-4 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm">
          <span className="font-mono text-[11px] uppercase tracking-wider text-warn">Belief to unlearn</span>
          <Markdown className="mt-1 text-sm">{result.misconception}</Markdown>
        </div>
      )}

      {showAnswers && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <AnswerBox label="Your answer" text={result.response} mono={question.kind === "predict_output"} />
          <AnswerBox label={question.kind === "predict_output" ? "Actual output" : "Model answer"} text={result.answer} mono={question.kind === "predict_output"} good />
        </div>
      )}

      {result.keyPoints.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm">
          {result.keyPoints.map((point) => (
            <li key={point} className="flex gap-2">
              <span className="text-accent">▸</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 border-t border-line pt-5">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Why</div>
        <Markdown>{result.explanation}</Markdown>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={onNext}>
          Next <ArrowRight className="size-4" />
        </Button>
        {result.verdict !== "correct" && (
          <Button variant="secondary" onClick={onAskAgain} loading={variantLoading}>
            <RefreshCw className="size-4" /> Ask me again, differently
          </Button>
        )}
        <span className="ml-auto hidden items-center gap-1.5 text-xs text-faint sm:flex">
          <Kbd>↵</Kbd> next
        </span>
      </div>
    </Card>
  );
}

function AnswerBox({ label, text, mono, good }: { label: string; text: string; mono?: boolean; good?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${good ? "border-good/30 bg-good/5" : "border-line bg-bg"}`}>
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{label}</div>
      {mono ? (
        <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed">{text}</pre>
      ) : (
        <Markdown className="text-sm">{text}</Markdown>
      )}
    </div>
  );
}
