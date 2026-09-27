"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, LogOut, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { post } from "@/components/drill/api";
import { formatDay } from "@/lib/dates";
import { TRACK_META, TRACKS, type Track } from "@/lib/tracks";

export function SettingsForm(props: {
  initialCount: number;
  initialTracks: Track[];
  startedOn: string;
  timezone: string;
  models: { writer: string; grader: string; embeddings: string };
  intervals: number[];
}) {
  const [count, setCount] = useState(props.initialCount);
  const [tracks, setTracks] = useState<Track[]>(props.initialTracks);
  const [saving, setSaving] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const dirty = count !== props.initialCount || tracks.join() !== props.initialTracks.join();

  async function save() {
    setSaving(true);
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailyQuestionCount: count, enabledTracks: tracks }),
    });
    setSaving(false);
    if (response.ok) toast.success("Saved — applies from tomorrow's drill");
    else toast.error((await response.json().catch(() => ({}))).error ?? "Couldn't save");
  }

  async function reset() {
    setResetting(true);
    try {
      await post("/api/settings/reset", { confirm: confirmText });
      toast.success("Everything wiped. Day 1 starts now.");
      window.location.href = "/";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reset failed");
      setResetting(false);
    }
  }

  function toggle(track: Track) {
    setTracks((current) =>
      current.includes(track) ? current.filter((t) => t !== track) : TRACKS.filter((t) => current.includes(t) || t === track),
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionTitle>Daily drill</SectionTitle>
        <div className="flex items-baseline justify-between">
          <label htmlFor="count" className="text-sm font-medium">Questions per day</label>
          <span className="font-mono text-2xl font-semibold">{count}</span>
        </div>
        <input
          id="count"
          type="range"
          min={4}
          max={30}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="mt-3 w-full accent-[var(--accent)]"
        />
        <p className="mt-1 text-xs text-faint">About half go to due reviews, one stretches a mastered concept, the rest are new.</p>

        <div className="mt-6 text-sm font-medium">Tracks</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {TRACKS.map((track) => {
            const on = tracks.includes(track);
            return (
              <button
                key={track}
                onClick={() => toggle(track)}
                disabled={on && tracks.length === 1}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${on ? "border-line-strong bg-raised" : "border-line opacity-60 hover:opacity-100"}`}
              >
                <span className="size-2.5 rounded-full" style={{ background: TRACK_META[track].color }} />
                <span className="flex-1">{TRACK_META[track].label}</span>
                <span className={`grid size-5 place-items-center rounded-md border ${on ? "border-accent bg-accent text-accent-fg" : "border-line"}`}>
                  {on && <Check className="size-3.5" />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={save} disabled={!dirty} loading={saving}>
            Save changes
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <SectionTitle>How the engine works</SectionTitle>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <Info label="Day 1" value={formatDay(props.startedOn, { year: "numeric" })} />
          <Info label="Day rolls over in" value={props.timezone} />
          <Info label="Question writer" value={props.models.writer} />
          <Info label="Grader" value={props.models.grader} />
          <Info label="Vector memory" value={`${props.models.embeddings} · pgvector`} />
          <Info label="Review spacing (days)" value={props.intervals.join(" → ")} />
        </dl>
        <p className="mt-4 text-xs text-faint">
          Models and time zone are set with OPENAI_MODEL, OPENAI_FAST_MODEL and APP_TIMEZONE in your environment.
        </p>
      </Card>

      <Card className="border-bad/30 p-6">
        <SectionTitle>Danger zone</SectionTitle>
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-bad" />
          <div className="flex-1">
            <div className="font-medium">Start over from an empty database</div>
            <p className="mt-1 text-sm text-muted">
              Permanently deletes every question, answer, challenge and all mastery progress. Settings are kept and today
              becomes Day 1. This can&apos;t be undone.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type RESET"
                className="h-10 w-40 rounded-lg border border-line bg-bg px-3 font-mono text-sm outline-none focus:border-bad"
              />
              <Button variant="danger" disabled={confirmText !== "RESET"} loading={resetting} onClick={reset}>
                Wipe everything
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Button
        variant="ghost"
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login";
        }}
      >
        <LogOut className="size-4" /> Sign out
      </Button>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-faint">{label}</dt>
      <dd className="mt-0.5 font-mono text-[13px]">{value}</dd>
    </div>
  );
}
