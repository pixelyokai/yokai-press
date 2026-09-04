"use client";

import dynamic from "next/dynamic";

/**
 * The agentation overlay, development only. A static import is not removed by
 * a NODE_ENV guard — the guard only makes the JSX dead while the import keeps
 * the module in the graph, which shipped 413KB to production.
 */
const Agentation = dynamic(
  () => import("agentation").then((m) => m.Agentation),
  { ssr: false },
);

export function DevTools() {
  if (process.env.NODE_ENV !== "development") return null;
  return <Agentation />;
}
