/**
 * Fallback types for the agentation dev overlay.
 *
 * agentation is a devDependency and is aliased away in production builds (see
 * next.config.mjs), so on a `npm ci --omit=dev` install the package — and its
 * types — are simply not there. Without this the type check fails on a module
 * that production never loads. When the package IS installed its own types win.
 */
declare module "agentation" {
  export const Agentation: React.ComponentType<Record<string, never>>;
}
