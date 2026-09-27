import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/app/login/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: "radial-gradient(var(--line-strong) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "conic-gradient(from 90deg, var(--accent), var(--accent-2), var(--track-next), var(--accent))" }}
      />
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
