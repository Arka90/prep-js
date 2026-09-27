import { TodayView } from "@/components/today/TodayView";
import { getTodaySummary } from "@/lib/stats";

export default async function TodayPage() {
  return <TodayView s={await getTodaySummary()} />;
}
