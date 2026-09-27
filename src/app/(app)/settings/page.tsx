import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { getAppState } from "@/lib/engine/drill";
import { env } from "@/lib/env";
import { REVIEW_INTERVALS } from "@/lib/engine/scheduler";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const state = await getAppState();
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="animate-rise">
        <div className="font-mono text-xs uppercase tracking-[0.14em] text-faint">Settings</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Tune the training</h1>
      </header>
      <SettingsForm
        initialCount={state.daily_question_count}
        initialTracks={state.enabled_tracks}
        startedOn={state.started_on}
        timezone={env.timezone}
        models={{ writer: env.openaiModel, grader: env.openaiFastModel, embeddings: env.embeddingModel }}
        intervals={REVIEW_INTERVALS}
      />
    </div>
  );
}
