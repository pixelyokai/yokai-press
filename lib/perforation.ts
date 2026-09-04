import type { PerfStyle } from "./types";

/**
 * The stamp outline: round holes, square corners.
 *
 * Traversed clockwise in a y-down space, so every arc uses sweep-flag 0 and
 * bites into the sheet. A punch is a cylinder, so the hole is a circle and the
 * same on all four edges; a comb runs an edge and stops, so the corner is the
 * one place with no hole in it.
 */

export interface PerfOpts {
  style: PerfStyle;
  /** gauge: 0 tight .. 1 loose */
  size: number;
  /** hole size within the gauge: 0 small .. 1 large */
  radius?: number;
  seed?: number;
}

interface Tuning {
  pitchMin: number;
  pitchMax: number;
  /** share of each period taken by the hole, at radius 0 and 1 */
  covMin: number;
  covMax: number;
}

const TUNING: Record<PerfStyle, Tuning> = {
  classic: { pitchMin: 0.055, pitchMax: 0.092, covMin: 0.52, covMax: 0.9 },
  // deep cut is the chunky one: a longer period, so bigger holes and a real
  // tooth left between them
  deep: { pitchMin: 0.085, pitchMax: 0.13, covMin: 0.5, covMax: 0.88 },
  fine: { pitchMin: 0.03, pitchMax: 0.052, covMin: 0.5, covMax: 0.86 },
  die: { pitchMin: 0.05, pitchMax: 0.05, covMin: 0, covMax: 0 },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Deterministic per-hole wobble — punched card stock is never exact. */
function jitter(seed: number, i: number, amp: number) {
  const s = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return (s - Math.floor(s) - 0.5) * 2 * amp;
}

export function perfPitch(w: number, h: number, opts: PerfOpts) {
  const t = TUNING[opts.style];
  return Math.min(w, h) * lerp(t.pitchMin, t.pitchMax, clamp01(opts.size));
}

function coverage(opts: PerfOpts) {
  const t = TUNING[opts.style];
  return lerp(t.covMin, t.covMax, clamp01(opts.radius ?? 0.5));
}

/** Radius of a punched hole. Round, so this is the bite depth as well. */
function perfHoleRadius(w: number, h: number, opts: PerfOpts) {
  return (perfPitch(w, h, opts) * coverage(opts)) / 2;
}

/** How far the deepest bite reaches into the sheet. */
export function perfDepth(w: number, h: number, opts: PerfOpts) {
  if (opts.style === "die") return 0;
  return perfHoleRadius(w, h, opts);
}

export function perforationPath(w: number, h: number, opts: PerfOpts): string {
  if (opts.style === "die") {
    return roundedRect(0, 0, w, h, Math.min(w, h) * 0.035);
  }

  const seed = opts.seed ?? 7.31;
  const r = perfHoleRadius(w, h, opts);
  /* wider than a hole, so the corner reads as a block not a stray tooth */
  const land = r * 1.25;

  const d: string[] = [`M ${f(land)} 0`];

  //            from            to              direction   seed bucket
  punch(d, land, 0, w - land, 0, 1, 0, r, seed, 0);
  d.push(`L ${f(w)} 0`, `L ${f(w)} ${f(land)}`);

  punch(d, w, land, w, h - land, 0, 1, r, seed, 1000);
  d.push(`L ${f(w)} ${f(h)}`, `L ${f(w - land)} ${f(h)}`);

  punch(d, w - land, h, land, h, -1, 0, r, seed, 2000);
  d.push(`L 0 ${f(h)}`, `L 0 ${f(h - land)}`);

  punch(d, 0, h - land, 0, land, 0, -1, r, seed, 3000);
  d.push("L 0 0", "Z");

  return d.join(" ");
}

/** One run of holes, fitted to a whole number of periods so no short tooth
 *  is left over at the end of an edge. */
function punch(
  out: string[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  tx: number,
  ty: number,
  r: number,
  seed: number,
  seedOffset: number,
) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  if (len <= 0 || r <= 0) return;

  const n = Math.max(1, Math.round(len / (r * 2.35)));
  const step = len / n;
  /* holes never touch: cap the radius so a tooth always survives between them */
  const rr = Math.min(r, step * 0.46);

  for (let i = 0; i < n; i++) {
    const centre = step * (i + 0.5) + jitter(seed, i + seedOffset, step * 0.02);
    const hr = rr * (1 + jitter(seed, i + seedOffset + 0.5, 0.03));
    const a = centre - hr;
    const b = centre + hr;

    out.push(`L ${f(x0 + tx * a)} ${f(y0 + ty * a)}`);
    out.push(`A ${f(hr)} ${f(hr)} 0 0 0 ${f(x0 + tx * b)} ${f(y0 + ty * b)}`);
  }
  out.push(`L ${f(x1)} ${f(y1)}`);
}

const f = (n: number) => Math.round(n * 100) / 100;

export function roundedRect(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  return [
    `M ${f(x + rr)} ${f(y)}`,
    `H ${f(x + w - rr)}`,
    `A ${f(rr)} ${f(rr)} 0 0 1 ${f(x + w)} ${f(y + rr)}`,
    `V ${f(y + h - rr)}`,
    `A ${f(rr)} ${f(rr)} 0 0 1 ${f(x + w - rr)} ${f(y + h)}`,
    `H ${f(x + rr)}`,
    `A ${f(rr)} ${f(rr)} 0 0 1 ${f(x)} ${f(y + h - rr)}`,
    `V ${f(y + rr)}`,
    `A ${f(rr)} ${f(rr)} 0 0 1 ${f(x + rr)} ${f(y)}`,
    "Z",
  ].join(" ");
}

/**
 * A stitch run that follows a rounded rect. Each stitch gets its own length
 * and lateral drift, because a sewn edge never lands on a grid.
 */
/** Stitches along a rounded rectangle. The perimeter is one path — four runs
 *  plus four arcs — so the corners are stitched and the pitch stays even. */
export function stitchSegments(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  pitch: number,
  seed = 3.77,
): { d: string; angle: number; lean: number }[] {
  /* Clamp: a radius larger than half the shorter side has no straight run
     left to sit between the arcs. */
  const rad = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  const sideW = Math.max(0, w - rad * 2);
  const sideH = Math.max(0, h - rad * 2);
  const arc = (Math.PI / 2) * rad;

  /* Clockwise from the top-left tangent point. */
  type Leg =
    | { kind: "line"; len: number; ax: number; ay: number; ux: number; uy: number }
    | { kind: "arc"; len: number; cx: number; cy: number; from: number };
  const line = (ax: number, ay: number, bx: number, by: number): Leg => {
    const len = Math.hypot(bx - ax, by - ay);
    return { kind: "line", len, ax, ay, ux: len ? (bx - ax) / len : 0, uy: len ? (by - ay) / len : 0 };
  };
  const bend = (cx: number, cy: number, from: number): Leg => ({
    kind: "arc",
    len: arc,
    cx,
    cy,
    from,
  });

  const legs: Leg[] = [
    line(x + rad, y, x + rad + sideW, y),
    bend(x + w - rad, y + rad, -Math.PI / 2),
    line(x + w, y + rad, x + w, y + rad + sideH),
    bend(x + w - rad, y + h - rad, 0),
    line(x + w - rad, y + h, x + rad, y + h),
    bend(x + rad, y + h - rad, Math.PI / 2),
    line(x, y + h - rad, x, y + rad),
    bend(x + rad, y + rad, Math.PI),
  ];

  const total = legs.reduce((a, l) => a + l.len, 0);
  if (total < pitch) return [];

  /* A whole number of stitches around the loop, so the seam closes cleanly
     instead of leaving a short stitch where it meets itself. */
  const n = Math.max(4, Math.round(total / pitch));
  const step = total / n;

  /** Point and unit tangent at a distance along the perimeter. */
  const at = (d: number) => {
    let rest = ((d % total) + total) % total;
    for (const l of legs) {
      if (rest > l.len) {
        rest -= l.len;
        continue;
      }
      if (l.kind === "line") {
        return { x: l.ax + l.ux * rest, y: l.ay + l.uy * rest, tx: l.ux, ty: l.uy };
      }
      const a = l.from + rest / rad;
      return {
        x: l.cx + Math.cos(a) * rad,
        y: l.cy + Math.sin(a) * rad,
        tx: -Math.sin(a),
        ty: Math.cos(a),
      };
    }
    const l = legs[legs.length - 1];
    return l.kind === "line"
      ? { x: l.ax + l.ux * l.len, y: l.ay + l.uy * l.len, tx: l.ux, ty: l.uy }
      : { x: l.cx, y: l.cy, tx: 1, ty: 0 };
  };

  const segs: { d: string; angle: number; lean: number }[] = [];
  for (let i = 0; i < n; i++) {
    const k = i + 1;
    const grow = 1 + jitter(seed, k, 0.14);
    const slide = jitter(seed, k + 0.31, step * 0.08);
    const drift = jitter(seed, k + 0.77, pitch * 0.07);
    const drift2 = drift + jitter(seed, k + 1.3, pitch * 0.05);

    const s0 = i * step + step * 0.19 + slide;
    const s1 = s0 + step * 0.6 * grow;
    const a = at(s0);
    const bpt = at(s1);
    /* offset each end along its own normal, so the thread wanders across the
       seam the way a hand-run stitch does */
    const sx = a.x - a.ty * drift;
    const sy = a.y + a.tx * drift;
    const ex = bpt.x - bpt.ty * drift2;
    const ey = bpt.y + bpt.tx * drift2;

    segs.push({
      d: `M ${f(sx)} ${f(sy)} L ${f(ex)} ${f(ey)}`,
      angle: Math.atan2(ey - sy, ex - sx),
      /* a lockstitch alternates which way the thread crosses the seam */
      lean: i % 2 === 0 ? 1 : -1,
    });
  }
  return segs;
}
