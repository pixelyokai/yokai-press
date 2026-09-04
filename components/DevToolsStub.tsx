"use client";

/**
 * Stands in for the agentation overlay in production builds — it is a
 * devDependency, so a `npm ci --omit=dev` install has no such package, and a
 * bare import still has to resolve at build time. Aliased in next.config.mjs.
 */
export function Agentation() {
  return null;
}
