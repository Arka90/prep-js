import type { Metadata } from "next";
import { DrillRunner } from "@/components/drill/DrillRunner";

export const metadata: Metadata = { title: "Drill" };

export default function DrillPage() {
  return <DrillRunner />;
}
