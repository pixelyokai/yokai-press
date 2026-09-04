let ctx: CanvasRenderingContext2D | null = null;

function context() {
  if (typeof document === "undefined") return null;
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  return ctx;
}

const cache = new Map<string, number>();

/* Callers are text fields, so every keystroke mints a key never looked up
   again. Capped with oldest-out eviction; the live strings are the newest. */
const CACHE_MAX = 600;

/** Width of `text` at 100px in the given face, in px. Cached per key. */
export function measure(text: string, family: string, weight: number) {
  const key = `${weight}|${family}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) {
    /* re-inserting moves it to the end, so eviction always takes the coldest */
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const c = context();
  if (!c) return text.length * 50;
  c.font = `${weight} 100px "${family}", serif`;
  const w = c.measureText(text).width;
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, w);
  return w;
}

export function clearMeasureCache() {
  cache.clear();
}

/**
 * Largest size at or below `max` that keeps `text` inside `maxWidth`,
 * accounting for tracking (which canvas measurement ignores).
 */
export function fitSize(
  text: string,
  family: string,
  weight: number,
  tracking: number,
  maxWidth: number,
  max: number,
  min = 6,
) {
  if (!text) return max;
  const unit = measure(text, family, weight) / 100 + tracking * text.length;
  if (unit <= 0) return max;
  return Math.max(min, Math.min(max, maxWidth / unit));
}

export function textWidth(
  text: string,
  family: string,
  weight: number,
  tracking: number,
  size: number,
) {
  return (measure(text, family, weight) / 100 + tracking * text.length) * size;
}
