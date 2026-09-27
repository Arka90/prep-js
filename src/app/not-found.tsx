import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <div className="font-display text-8xl leading-none">
          4<span className="italic text-gradient">0</span>4
        </div>
        <p className="mt-3 text-muted">
          <code className="font-mono text-sm">undefined</code> is not a page.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm text-accent underline underline-offset-4">
          Back to today
        </Link>
      </div>
    </div>
  );
}
