# prep.js

A personal training app for staying sharp in **JavaScript, Node.js, MongoDB, React and Next.js** while writing most code with AI.

- **Daily drill** — fresh questions every day (predict the output, find the bug, multiple choice, explain it), mixing reviews of weak concepts with new material.
- **Spaced repetition per concept** — miss something and it comes back tomorrow in a *different format and from a different angle*, aimed at the exact misconception you showed, until you get it right four times in a row, spaced out over days.
- **Progressive difficulty** — the difficulty floor rises every 12 days, harder curriculum tiers unlock over time, and each concept levels up as you keep getting it right.
- **Never a repeat** — every question and challenge is embedded into a vector store (pgvector); anything too close to something you've already seen is rejected and rewritten.
- **Verified answers** — JS/Node "predict the output" questions are *executed* in a sandbox; the real output becomes the answer.
- **Coding arena** — a daily *build* kata and a daily *debug* challenge with test cases. Tests are validated against a reference solution before you see them. Run visible tests in the browser, submit against hidden tests on the server.
- **Single user** — one password, no accounts.

## Stack

Next.js 16 (App Router) · Supabase Postgres + pgvector · OpenAI (writer, grader and embeddings) · Tailwind 4 · CodeMirror.

## Setup

### 1. Database — start from empty

You have two options:

- **New Supabase project (cleanest).** Create one, open the SQL editor and run [`db/schema.sql`](db/schema.sql).
- **Reuse the old project.** Run [`db/drop_legacy.sql`](db/drop_legacy.sql) first. This **permanently deletes** all v1 tables and data (users, quiz attempts, flashcards…). Then run [`db/schema.sql`](db/schema.sql).

`schema.sql` enables the `vector` extension, creates the tables and similarity-search functions, and enables RLS with no policies. That means the public anon key can't read anything. The app only talks to the database from the server, using the service-role key.

Later, to wipe your progress and start again at Day 1, use **Settings → Danger zone** in the app, or run [`db/reset.sql`](db/reset.sql).

### 2. Environment

```bash
cp .env.example .env.local
```

| Variable | What it is |
| --- | --- |
| `SUPABASE_URL` | Project URL (Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key. **Server only**, never prefix with `NEXT_PUBLIC_` |
| `OPENAI_API_KEY` | Your OpenAI key |
| `OPENAI_MODEL` | Writes questions and challenges (default `gpt-5`) |
| `OPENAI_FAST_MODEL` | Grades answers (default `gpt-5-mini`) |
| `OPENAI_EMBEDDING_MODEL` | Default `text-embedding-3-small` (1536 dims, must match the schema) |
| `APP_PASSWORD` | The single password that unlocks the app |
| `AUTH_SECRET` | ≥ 32 random chars for signing the session cookie: `openssl rand -base64 48` |
| `APP_TIMEZONE` | IANA zone where your day rolls over, e.g. `Asia/Kolkata` |

### 3. Run

```bash
npm install
npm run dev
```

The first visit each day generates the drill and the arena challenges. That takes about a minute and starts in the background as soon as you open the dashboard.

## How it works

```
Today ─┬─ scheduler (src/lib/engine/scheduler.ts)
       │    due reviews (most overdue first) + new concepts (capped working set) + 1 stretch
       │    → per slot: concept, format (never the same as last time), difficulty, known misconceptions
       │
       ├─ generator (src/lib/engine/questions.ts)
       │    one OpenAI call per track, in parallel, with a "previously asked" list per concept
       │    → shape checks → execute JS/Node output questions in a sandbox → embed
       │    → reject anything with cosine ≥ 0.92 to any past question (pgvector) → regenerate once
       │
       ├─ grader (src/lib/engine/grade.ts)
       │    MCQ + exact outputs checked locally; everything else graded by the fast model
       │    → verdict, feedback and the underlying misconception
       │
       └─ progress: Leitner boxes 0–6, reviews at 1 → 2 → 4 → 7 → 14 → 30 → 60 days, box ≥ 4 = mastered
```

The curriculum lives in [`src/data/curriculum.ts`](src/data/curriculum.ts): 158 granular concepts across 5 tracks and 5 tiers. Add, remove or edit concepts freely. The `focus` text is what the question writer targets.

Code execution uses `node:vm` inside a short-lived worker thread with a timeout and memory limit. It isolates crashes and infinite loops, but `vm` is **not a security sandbox**. That's acceptable here because the only code it runs is code the app generated for you, plus your own submissions, behind your password.

## Deploying

Works on Vercel. Set the environment variables above. Generation routes declare `maxDuration = 300`.
