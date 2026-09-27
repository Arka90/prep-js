import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** "edge" adds a light-catching top hairline; "glass" blurs whatever is behind it. */
  variant?: "edge" | "glass" | "flat";
  hover?: boolean;
}

export function Card({ className = "", variant = "edge", hover = false, ...props }: CardProps) {
  const base =
    variant === "glass"
      ? "glass"
      : variant === "flat"
        ? "border border-line bg-surface-solid"
        : "edge";
  return <div className={`rounded-2xl ${base} ${hover ? "lift" : ""} ${className}`} {...props} />;
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-faint">
        <span className="size-1 rounded-full bg-accent" />
        {children}
      </h2>
      {action}
    </div>
  );
}
