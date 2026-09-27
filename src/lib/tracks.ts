import type { Track } from "@/data/curriculum";

export type { Track };

export const TRACKS: Track[] = ["javascript", "node", "mongodb", "react", "nextjs"];

export const TRACK_META: Record<
  Track,
  { label: string; short: string; color: string; language: string }
> = {
  javascript: { label: "JavaScript", short: "JS", color: "var(--track-js)", language: "javascript" },
  node: { label: "Node.js", short: "Node", color: "var(--track-node)", language: "javascript" },
  mongodb: { label: "MongoDB", short: "Mongo", color: "var(--track-mongo)", language: "javascript" },
  react: { label: "React", short: "React", color: "var(--track-react)", language: "jsx" },
  nextjs: { label: "Next.js", short: "Next", color: "var(--track-next)", language: "tsx" },
};

export function isTrack(value: unknown): value is Track {
  return typeof value === "string" && (TRACKS as string[]).includes(value);
}
