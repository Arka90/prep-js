"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Starts generating today's drill/arena in the background while you look at the dashboard. */
export function Prefetcher({ drill, arena }: { drill: boolean; arena: boolean }) {
  const router = useRouter();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const jobs = [
      drill ? fetch("/api/drill", { method: "POST" }) : null,
      arena ? fetch("/api/arena", { method: "POST" }) : null,
    ].filter(Boolean) as Promise<Response>[];
    jobs.forEach((job) => job.then(() => router.refresh()).catch(() => {}));
    // Show the "generating" state right away.
    const t = setTimeout(() => router.refresh(), 800);
    return () => clearTimeout(t);
  }, [drill, arena, router]);
  return null;
}
