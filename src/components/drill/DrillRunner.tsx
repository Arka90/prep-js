"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { loadDrill, requestVariant, sendAnswer } from "@/components/drill/api";
import { GeneratingState } from "@/components/drill/GeneratingState";
import { ProgressStrip } from "@/components/drill/ProgressStrip";
import { QuestionView } from "@/components/drill/QuestionView";
import { SessionSummary } from "@/components/drill/SessionSummary";
import type { DrillQuestion } from "@/lib/types";

type Phase = { kind: "loading" } | { kind: "generating" } | { kind: "error"; message: string } | { kind: "ready" };

export function DrillRunner() {
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [questions, setQuestions] = useState<DrillQuestion[]>([]);
  const [dayNumber, setDayNumber] = useState(1);
  const [index, setIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [variantLoading, setVariantLoading] = useState(false);
  const drafts = useRef(new Map<string, string>());
  const shownAt = useRef(Date.now());

  const load = useCallback(async () => {
    try {
      const data = await loadDrill();
      if (data.status === "generating") {
        setPhase({ kind: "generating" });
        setTimeout(load, 4000);
        return;
      }
      setQuestions(data.questions);
      setDayNumber(data.dayNumber);
      const firstOpen = data.questions.findIndex((q) => !q.result);
      setIndex(firstOpen === -1 ? 0 : firstOpen);
      setShowSummary(firstOpen === -1);
      setPhase({ kind: "ready" });
    } catch (error) {
      setPhase({ kind: "error", message: error instanceof Error ? error.message : String(error) });
    }
  }, []);

  useEffect(() => {
    setPhase({ kind: "generating" });
    void load();
  }, [load]);

  useEffect(() => {
    shownAt.current = Date.now();
  }, [index]);

  const current = questions[index];

  async function submit(response: string) {
    if (!current || submitting) return;
    setSubmitting(true);
    try {
      const { result } = await sendAnswer(current.id, response, Date.now() - shownAt.current);
      setQuestions((qs) => qs.map((q) => (q.id === current.id ? { ...q, result } : q)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't grade that answer");
    } finally {
      setSubmitting(false);
    }
  }

  async function askAgain() {
    if (!current || variantLoading) return;
    setVariantLoading(true);
    try {
      const { question } = await requestVariant(current.id);
      setQuestions((qs) => {
        const next = [...qs];
        next.splice(index + 1, 0, question);
        return next;
      });
      setIndex(index + 1);
      toast.success("New angle on the same concept");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't create a variant");
    } finally {
      setVariantLoading(false);
    }
  }

  function next() {
    const after = questions.findIndex((q, i) => i > index && !q.result);
    const before = questions.findIndex((q) => !q.result);
    const target = after !== -1 ? after : before;
    if (target === -1) setShowSummary(true);
    else setIndex(target);
  }

  if (phase.kind === "loading" || phase.kind === "generating") return <GeneratingState />;
  if (phase.kind === "error") {
    return (
      <Card className="mx-auto mt-10 max-w-lg p-8 text-center">
        <AlertTriangle className="mx-auto size-8 text-warn" />
        <h1 className="mt-4 text-xl font-semibold">Couldn&apos;t build today&apos;s drill</h1>
        <p className="mt-2 break-words text-sm text-muted">{phase.message}</p>
        <Button className="mt-6" onClick={() => { setPhase({ kind: "generating" }); void load(); }}>
          Try again
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">Day {dayNumber} · Drill</div>
          <div className="mt-1 font-display text-2xl">
            <span className="italic text-accent">{questions.filter((q) => q.result).length}</span>
            <span className="text-faint"> / {questions.length}</span> answered
          </div>
        </div>
        {questions.every((q) => q.result) && !showSummary && (
          <Button variant="secondary" size="sm" onClick={() => setShowSummary(true)}>
            Summary
          </Button>
        )}
      </div>
      <ProgressStrip
        questions={questions}
        index={showSummary ? -1 : index}
        onSelect={(i) => {
          setShowSummary(false);
          setIndex(i);
        }}
      />
      <div className="mt-6">
        {showSummary ? (
          <SessionSummary questions={questions} onReview={(i) => { setShowSummary(false); setIndex(i); }} />
        ) : current ? (
          <QuestionView
            key={current.id}
            question={current}
            position={index + 1}
            total={questions.length}
            draft={drafts.current.get(current.id) ?? ""}
            onDraft={(value) => drafts.current.set(current.id, value)}
            submitting={submitting}
            variantLoading={variantLoading}
            onSubmit={submit}
            onAskAgain={askAgain}
            onNext={next}
          />
        ) : null}
      </div>
    </div>
  );
}
