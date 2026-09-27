"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/shell/Nav";

const TRACKS = ["JavaScript", "Node.js", "MongoDB", "React", "Next.js"];

export function LoginForm() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (response.ok) {
      const next = params.get("next");
      window.location.href = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
      return;
    }
    const data = await response.json().catch(() => ({}));
    setError(data.error ?? "Sign-in failed");
    setLoading(false);
  }

  return (
    <div className="stagger relative w-full max-w-md">
      <div className="mb-10 flex flex-col items-center text-center">
        <Wordmark size="lg" />
        <h1 className="mt-8 font-display text-4xl leading-tight sm:text-5xl">
          Sharpen the muscle <br />
          <span className="italic text-gradient">AI made lazy.</span>
        </h1>
        <p className="mt-4 max-w-sm text-sm text-muted">
          A daily drill, spaced repetition and a coding arena — questions that never repeat, and get harder as you do.
        </p>
      </div>

      <form onSubmit={submit} className="glass rounded-2xl p-2">
        <label className="relative block">
          <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="h-12 w-full rounded-xl bg-transparent pl-11 pr-32 text-[15px] outline-none placeholder:text-faint"
          />
          <Button type="submit" size="sm" loading={loading} disabled={!password} className="absolute right-2 top-1/2 h-9 -translate-y-1/2 px-4">
            Enter <ArrowRight className="size-3.5" />
          </Button>
        </label>
      </form>
      {error && <p className="mt-3 text-center text-sm text-bad">{error}</p>}

      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {TRACKS.map((t) => (
          <span key={t} className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-faint">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
