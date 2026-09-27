"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { post } from "@/components/drill/api";

/** Kicks off (or waits for) generation of today's challenges, then refreshes the page. */
export function ArenaGenerator({ initiallyGenerating }: { initiallyGenerating: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function generate() {
    setError(null);
    try {
      const result = await post<{ status: "ready" | "generating"; error?: string }>("/api/arena");
      if (result.status === "generating") {
        setTimeout(generate, 5000);
        return;
      }
      if (result.error) setError(result.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-sm text-bad">{error}</p>
        <Button className="mt-4" size="sm" onClick={generate}>
          Try again
        </Button>
      </Card>
    );
  }
  return (
    <Card className="flex items-center gap-4 p-6">
      <Spinner className="size-5 text-accent" />
      <div>
        <div className="font-medium">{initiallyGenerating ? "Still forging today's challenges…" : "Forging today's challenges…"}</div>
        <div className="text-sm text-muted">
          Writing the problem, running the reference solution against every test, and making sure it&apos;s nothing you&apos;ve
          seen before. Up to a minute or two.
        </div>
      </div>
    </Card>
  );
}
