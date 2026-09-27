import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArenaWorkspace } from "@/components/arena/ArenaWorkspace";
import { getChallenge, publicChallenge } from "@/lib/arena/challenges";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const challenge = await getChallenge((await params).id);
  return { title: challenge?.title ?? "Arena" };
}

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const challenge = await getChallenge(id);
  if (!challenge) notFound();
  return <ArenaWorkspace challenge={publicChallenge(challenge)} />;
}
