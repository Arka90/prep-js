"use client";

import { useSyncExternalStore } from "react";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Late session";
}

const noop = () => () => {};

/** Time-of-day greeting; rendered only on the client so the server can't disagree. */
export function Greeting() {
  const text = useSyncExternalStore(noop, greeting, () => "Welcome back");
  return <>{text}</>;
}
