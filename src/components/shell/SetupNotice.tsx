import { Card } from "@/components/ui/Card";

const STEPS = [
  "Create a Supabase project (or reuse the old one).",
  "Old project only: run db/drop_legacy.sql in the SQL editor to delete the v1 tables.",
  "Run db/schema.sql in the SQL editor — it enables pgvector and creates everything.",
  "Copy .env.example to .env.local and fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, APP_PASSWORD and AUTH_SECRET.",
  "Restart npm run dev.",
];

export function SetupNotice({ message }: { message: string }) {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <Card className="w-full max-w-xl p-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Setup needed</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">prep.js can&apos;t reach its database yet</h1>
        <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-bad/30 bg-bad/10 p-3 font-mono text-xs text-bad">
          {message}
        </pre>
        <ol className="mt-6 space-y-3 text-sm text-muted">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="font-mono text-faint">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
