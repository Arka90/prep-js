"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
    <form onSubmit={submit} className="relative w-full max-w-sm animate-rise">
      <div className="mb-10 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-fg font-mono text-lg font-semibold text-bg">
          <span>
            <span className="text-accent">{"<"}</span>
            {">"}
          </span>
        </div>
        <h1 className="mt-5 font-mono text-2xl font-semibold tracking-tight">
          prep<span className="text-accent">.</span>js
        </h1>
        <p className="mt-2 text-sm text-muted">Sharpen the muscle AI made lazy.</p>
      </div>
      <label className="relative block">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-[15px] outline-none transition placeholder:text-faint focus:border-accent"
        />
      </label>
      {error && <p className="mt-3 text-center text-sm text-bad">{error}</p>}
      <Button type="submit" size="lg" loading={loading} disabled={!password} className="mt-4 w-full">
        Enter <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
