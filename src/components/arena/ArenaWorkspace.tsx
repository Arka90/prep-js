"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";
import { ArrowLeft, Bug, Check, Eye, Hammer, Lightbulb, Lock, Play, RotateCcw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DifficultyDots, Kbd, Pill, TrackBadge } from "@/components/ui/Badges";
import { Markdown } from "@/components/ui/Markdown";
import { Spinner } from "@/components/ui/Spinner";
import { post } from "@/components/drill/api";
import { runInBrowser } from "@/components/arena/browserRunner";
import type { PublicChallenge } from "@/lib/arena/challenges";
import type { TestResult } from "@/lib/types";

const CodeEditor = dynamic(() => import("@/components/arena/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-faint">
      <Spinner />
    </div>
  ),
});

interface Outcome {
  mode: "run" | "submit";
  fatal: string | null;
  results: TestResult[];
  logs: string[];
  passed?: boolean;
}

const draftKey = (id: string) => `arena-draft:${id}`;

function readDraft(id: string): string | null {
  try {
    return localStorage.getItem(draftKey(id));
  } catch {
    return null;
  }
}

export function ArenaWorkspace({ challenge: initial }: { challenge: PublicChallenge }) {
  const [challenge, setChallenge] = useState(initial);
  const [code, setCode] = useState(initial.bestCode ?? initial.starterCode);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState<"run" | "submit" | "reveal" | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [tab, setTab] = useState<"tests" | "console" | "solution">("tests");
  const codeRef = useRef(code);
  codeRef.current = code;

  useEffect(() => {
    const draft = readDraft(initial.id);
    if (draft) setCode(draft);
  }, [initial.id]);

  const updateCode = useCallback(
    (value: string) => {
      setCode(value);
      try {
        localStorage.setItem(draftKey(initial.id), value);
      } catch {}
    },
    [initial.id],
  );

  const run = useCallback(async () => {
    setBusy("run");
    const output = await runInBrowser(codeRef.current, challenge.functionName, challenge.visibleTests);
    setOutcome({ mode: "run", ...output });
    setTab(output.fatal || output.results.every((r) => r.passed) ? (output.logs.length ? "console" : "tests") : "tests");
    setBusy(null);
  }, [challenge.functionName, challenge.visibleTests]);

  const submit = useCallback(async () => {
    setBusy("submit");
    try {
      const result = await post<{ passed: boolean; fatal: string | null; results: TestResult[]; logs: string[]; solution: string | null }>(
        `/api/arena/${challenge.id}/submit`,
        { code: codeRef.current },
      );
      setOutcome({ mode: "submit", ...result });
      setTab("tests");
      if (result.passed) {
        setChallenge((c) => ({ ...c, status: c.status === "open" ? "solved" : c.status, solution: result.solution }));
        void confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 }, colors: ["#ff6a3d", "#ececef", "#3ecf8e"] });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submit failed");
    } finally {
      setBusy(null);
    }
  }, [challenge.id]);

  async function reveal() {
    if (!confirm("Reveal the reference solution? This challenge will be marked as not solved.")) return;
    setBusy("reveal");
    try {
      const { solution } = await post<{ solution: string }>(`/api/arena/${challenge.id}/reveal`, { code });
      setChallenge((c) => ({ ...c, status: c.status === "open" ? "revealed" : c.status, solution }));
      setTab("solution");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't reveal");
    } finally {
      setBusy(null);
    }
  }

  function reset() {
    if (!confirm("Reset the editor to the starter code?")) return;
    updateCode(challenge.starterCode);
  }

  const passedCount = outcome?.results.filter((r) => r.passed).length ?? 0;

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-10 lg:-mt-4">
      <div className="mb-4 flex flex-wrap items-center gap-3 px-4 sm:px-6 lg:px-10">
        <Link href="/arena" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-raised hover:text-fg" aria-label="Back to arena">
          <ArrowLeft className="size-4" />
        </Link>
        <span className="grid size-8 place-items-center rounded-lg bg-raised text-muted">
          {challenge.kind === "build" ? <Hammer className="size-4" /> : <Bug className="size-4" />}
        </span>
        <h1 className="min-w-0 flex-1 truncate font-display text-2xl">{challenge.title}</h1>
        <TrackBadge track={challenge.track} />
        <DifficultyDots level={challenge.difficulty} />
        {challenge.status === "solved" && (
          <Pill tone="good">
            <Check className="size-3" /> solved
          </Pill>
        )}
        {challenge.status === "revealed" && <Pill tone="warn">revealed</Pill>}
      </div>

      <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:px-10">
        {/* Problem */}
        <div className="space-y-4 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:pr-1">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
              <span className="size-1 rounded-full bg-accent" />
              {challenge.kind === "build" ? "Build it" : "Fix the bug"}
            </div>
            <Markdown>{challenge.description}</Markdown>
            {challenge.concepts.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {challenge.concepts.map((c) => (
                  <Pill key={c}>{c}</Pill>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Examples</span>
              <span className="flex items-center gap-1 text-xs text-faint">
                <Lock className="size-3" /> +{challenge.hiddenTestCount} hidden tests on submit
              </span>
            </div>
            <div className="space-y-2">
              {challenge.visibleTests.map((t) => (
                <div key={t.name} className="rounded-lg border border-line bg-bg p-3 font-mono text-[12.5px]">
                  <div className="mb-1 font-sans text-xs text-muted">{t.name}</div>
                  <div className="break-all">
                    <span className="text-faint">{challenge.functionName}(</span>
                    {t.input.map((arg) => JSON.stringify(arg)).join(", ")}
                    <span className="text-faint">)</span>
                  </div>
                  <div className="break-all text-good">→ {JSON.stringify(t.expected)}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Hints</span>
              {hintsShown < challenge.hints.length && (
                <Button variant="ghost" size="sm" onClick={() => setHintsShown((n) => n + 1)}>
                  <Lightbulb className="size-3.5" /> {hintsShown === 0 ? "Show a hint" : "Next hint"}
                </Button>
              )}
            </div>
            {hintsShown === 0 ? (
              <p className="text-sm text-faint">Try for 10 minutes before you peek. That struggle is the workout.</p>
            ) : (
              <ol className="space-y-2 text-sm">
                {challenge.hints.slice(0, hintsShown).map((hint, i) => (
                  <li key={hint} className="flex gap-2 animate-rise">
                    <span className="font-mono text-accent">{i + 1}.</span>
                    <span>{hint}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        {/* Editor + results */}
        <div className="edge flex min-h-[70dvh] flex-col overflow-hidden rounded-2xl lg:h-[calc(100dvh-8rem)]">
          <div className="flex items-center gap-2 border-b border-line bg-raised/50 px-3 py-2">
            <span className="mr-1 flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
            </span>
            <span className="font-mono text-xs text-faint">solution.js</span>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={reset} title="Reset to starter code">
                <RotateCcw className="size-3.5" />
              </Button>
              {challenge.status === "open" && (
                <Button variant="ghost" size="sm" onClick={reveal} loading={busy === "reveal"}>
                  <Eye className="size-3.5" /> Give up
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={run} loading={busy === "run"} disabled={busy !== null}>
                <Play className="size-3.5" /> Run
              </Button>
              <Button size="sm" onClick={submit} loading={busy === "submit"} disabled={busy !== null}>
                <Send className="size-3.5" /> Submit
              </Button>
            </div>
          </div>
          <div className="min-h-[320px] flex-1 overflow-hidden">
            <CodeEditor value={code} onChange={updateCode} onRun={run} onSubmit={submit} />
          </div>
          <div className="flex h-[38%] min-h-[180px] flex-col border-t border-line">
            <div className="flex items-center gap-1 border-b border-line px-2">
              {(["tests", "console", ...(challenge.solution ? (["solution"] as const) : [])] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`border-b-2 px-3 py-2 text-xs font-medium capitalize transition ${
                    tab === t ? "border-accent text-fg" : "border-transparent text-faint hover:text-muted"
                  }`}
                >
                  {t}
                  {t === "console" && outcome?.logs.length ? ` (${outcome.logs.length})` : ""}
                </button>
              ))}
              {outcome && !outcome.fatal && (
                <span className={`ml-auto pr-2 font-mono text-xs ${passedCount === outcome.results.length ? "text-good" : "text-bad"}`}>
                  {outcome.mode === "submit" ? "submit" : "run"} · {passedCount}/{outcome.results.length} passed
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {tab === "tests" && <TestsPanel outcome={outcome} functionName={challenge.functionName} />}
              {tab === "console" && (
                <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] text-muted">
                  {outcome?.logs.length ? outcome.logs.join("\n") : "console.log output from your last run shows up here."}
                </pre>
              )}
              {tab === "solution" && challenge.solution && (
                <div className="h-full min-h-[240px] overflow-hidden rounded-lg border border-line">
                  <CodeEditor value={challenge.solution} readOnly />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 hidden px-10 text-xs text-faint lg:block">
        <Kbd>⌘</Kbd> <Kbd>↵</Kbd> run visible tests · <Kbd>⌘</Kbd> <Kbd>⇧</Kbd> <Kbd>↵</Kbd> submit against all tests
      </p>
    </div>
  );
}

function TestsPanel({ outcome, functionName }: { outcome: Outcome | null; functionName: string }) {
  if (!outcome) {
    return <p className="text-sm text-faint">Run checks the visible examples in your browser. Submit runs every test, including hidden ones, on the server.</p>;
  }
  if (outcome.fatal) {
    return <pre className="whitespace-pre-wrap break-words rounded-lg border border-bad/30 bg-bad/10 p-3 font-mono text-[12.5px] text-bad">{outcome.fatal}</pre>;
  }
  return (
    <div className="space-y-1.5">
      {outcome.passed && (
        <div className="mb-3 rounded-lg border border-good/30 bg-good/10 p-3 text-sm text-good">
          All tests pass, hidden ones included. The solution tab has the reference to compare approaches.
        </div>
      )}
      {outcome.results.map((r) => (
        <details key={r.name} className="group rounded-lg border border-line bg-bg" open={!r.passed && !r.hidden}>
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-[13px]">
            {r.passed ? <Check className="size-3.5 text-good" /> : <X className="size-3.5 text-bad" />}
            <span className="min-w-0 flex-1 truncate">{r.name}</span>
            {r.hidden && <Lock className="size-3 text-faint" />}
            <span className="font-mono text-[11px] text-faint">{r.ms}ms</span>
          </summary>
          {(!r.hidden || r.error) && (
            <div className="space-y-1 border-t border-line px-3 py-2 font-mono text-[12px]">
              {r.input && (
                <div className="break-all text-muted">
                  {functionName}({r.input.map((a) => JSON.stringify(a)).join(", ")})
                </div>
              )}
              {r.expected !== undefined && <div className="break-all">expected <span className="text-good">{JSON.stringify(r.expected)}</span></div>}
              {r.actual !== undefined && !r.error && <div className="break-all">received <span className={r.passed ? "text-good" : "text-bad"}>{String(r.actual)}</span></div>}
              {r.error && <div className="break-all text-bad">{r.error}</div>}
            </div>
          )}
        </details>
      ))}
    </div>
  );
}
