"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

const STEPS = [
  "Scheduling reviews for concepts you missed",
  "Picking new concepts at today's difficulty",
  "Writing questions for each track",
  "Running the code to verify expected outputs",
  "Checking the vector memory for repeats",
];

export function GeneratingState() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 7000);
    return () => clearInterval(timer);
  }, []);
  return (
    <Card className="relative mx-auto mt-6 max-w-xl overflow-hidden p-8 animate-rise">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full opacity-20 blur-3xl"
        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
      />
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
        <span className="size-1.5 rounded-full bg-accent pulse-dot" /> Preparing today
      </div>
      <h1 className="mt-3 font-display text-3xl leading-tight">
        Building a drill <span className="italic text-gradient">nobody has asked you</span> before.
      </h1>
      <p className="mt-2 text-sm text-muted">The first load of the day takes about a minute. It&apos;s cached after that.</p>
      <ul className="mt-6 space-y-3">
        {STEPS.map((label, i) => (
          <li key={label} className={`flex items-center gap-3 text-sm ${i > step ? "text-faint" : ""}`}>
            <span className="grid size-5 place-items-center">
              {i < step ? <Check className="size-4 text-good" /> : i === step ? <Spinner className="size-4 text-accent" /> : <span className="size-1.5 rounded-full bg-line-strong" />}
            </span>
            {label}
          </li>
        ))}
      </ul>
    </Card>
  );
}
