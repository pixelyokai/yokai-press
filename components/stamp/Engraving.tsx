"use client";

import { memo } from "react";
import { mix } from "@/lib/color";

/**
 * The stock artwork, drawn to engraving convention rather than as flat vector
 * shapes: a ruled line-screen sky whose weight tapers to the horizon, hatched
 * relief on the ranges, and a broken dash screen on the water. Line weights
 * come from a fixed set so the whole plate reads as one engraver's hand.
 */

const W = 100; // the illustration is authored in a 100x100 square
const HORIZON = 63;

/* fixed weights — an engraver cuts with a few burins, not a continuum */
const HAIR = 0.22;
const FINE = 0.36;
const MID = 0.58;
const BOLD = 0.9;

function rand(seed: number, i: number) {
  const s = Math.sin(seed * 91.7 + i * 47.13) * 21837.19;
  return s - Math.floor(s);
}

export const Engraving = memo(function Engraving({
  x,
  y,
  w,
  h,
  ink,
  paper,
  uid,
  seed = 4.2,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  ink: string;
  paper: string;
  uid: string;
  seed?: number;
}) {
  const scale = Math.max(w / W, h / W);
  const tx = x + (w - W * scale) / 2;
  // bias the crop upward: when the plate is wide, the sky and its curtains
  // are the subject, so give away the foreground water rather than the sky
  const ty = y + (h - W * scale) * 0.3;
  const clipId = `${uid}-engclip`;

  const skyLines: React.ReactNode[] = [];
  // Ruled sky: spacing constant, weight tapering toward the horizon so the
  // tone reads as a gradient built from line, not a gradient fill.
  const rows = 46;
  for (let i = 0; i < rows; i++) {
    const t = i / (rows - 1);
    const yy = -6 + t * (HORIZON + 6);
    const wgt = BOLD * 1.05 * Math.pow(1 - t, 2.05) + HAIR * 0.26;
    if (wgt < 0.06) continue;
    const wob = (rand(seed, i) - 0.5) * 0.5;
    skyLines.push(
      <line
        key={`s${i}`}
        x1={-8}
        y1={yy + wob}
        x2={W + 8}
        y2={yy - wob}
        stroke={ink}
        strokeWidth={wgt}
        strokeLinecap="round"
      />,
    );
  }

  /* Aurora curtains: a reserved top edge with striations hanging off it, the
     way an engraver cuts light out of a ruled sky rather than painting it on. */
  const aurora: React.ReactNode[] = [];
  const curtain = (b: number) => {
    const base = 11 + b * 8.5;
    const amp = 5.5 - b * 1.1;
    const freq = 1.35 + b * 0.55;
    const phase = 0.7 + b * 2.1 + seed;
    const drop = 17 - b * 4;
    const edgeY = (px: number) =>
      base + Math.sin((px / W) * Math.PI * freq + phase) * amp;

    const edge: string[] = [];
    for (let px = -8; px <= W + 8; px += 2) {
      edge.push(`${px === -8 ? "M" : "L"} ${px} ${edgeY(px)}`);
    }
    aurora.push(
      <path
        key={`ae${b}`}
        d={edge.join(" ")}
        fill="none"
        stroke={paper}
        strokeWidth={MID * (1.15 - b * 0.2)}
        strokeLinecap="round"
      />,
    );

    for (let px = -8, i = 0; px <= W + 8; px += 1.15, i++) {
      const r = rand(seed + b * 3.3, i);
      const r2 = rand(seed + b * 3.3 + 0.6, i);
      // the curtain thins out at both ends of its run
      const u = (px + 8) / (W + 16);
      const falloff = Math.sin(Math.PI * Math.min(1, Math.max(0, u)));
      const len = drop * (0.28 + r * 0.85) * falloff;
      if (len < 1.2) continue;
      const y0 = edgeY(px);
      aurora.push(
        <line
          key={`ac${b}-${i}`}
          x1={px}
          y1={y0}
          x2={px + (r2 - 0.5) * 1.6}
          y2={y0 + len}
          stroke={paper}
          strokeWidth={FINE * (0.75 + r2 * 0.7)}
          strokeLinecap="round"
          opacity={0.92}
        />,
      );
    }
  };
  curtain(0);
  curtain(1);
  curtain(2);

  // Ranges. Back range is hatched, front range is solid with cut snow lines —
  // the standard way an engraver separates two planes at the same value.
  const backRidge = ridge(seed + 1, 13, 46, 21);
  const frontRidge = ridge(seed + 2, 11, 57, 31);

  const backHatch: React.ReactNode[] = [];
  for (let i = -30; i < 140; i += 1.5) {
    backHatch.push(
      <line
        key={`bh${i}`}
        x1={i}
        y1={-10}
        x2={i - 60}
        y2={110}
        stroke={ink}
        strokeWidth={FINE}
      />,
    );
  }

  const snow: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const px = 4 + i * 3.7 + (rand(seed + 3, i) - 0.5) * 1.6;
    const len = 2.4 + rand(seed + 4, i) * 5.4;
    snow.push(
      <line
        key={`sn${i}`}
        x1={px}
        y1={ridgeY(frontRidge, px) + 1.4}
        x2={px + 1.6}
        y2={ridgeY(frontRidge, px) + 1.4 + len}
        stroke={paper}
        strokeWidth={FINE}
        strokeLinecap="round"
      />,
    );
  }

  // Water: a broken dash screen, denser and heavier close to the eye.
  const water: React.ReactNode[] = [];
  const wr = 30;
  for (let i = 0; i < wr; i++) {
    const t = i / (wr - 1);
    const yy = HORIZON + 1.5 + Math.pow(t, 1.35) * (W - HORIZON);
    const wgt = HAIR + t * MID;
    const dashes = 5 + Math.round(rand(seed + 5, i) * 4);
    let cx = -6;
    for (let d = 0; d < dashes; d++) {
      const gap = 1.5 + rand(seed + 6, i * 10 + d) * 7;
      const len = 6 + rand(seed + 7, i * 10 + d) * 22;
      water.push(
        <line
          key={`w${i}-${d}`}
          x1={cx}
          y1={yy}
          x2={cx + len}
          y2={yy}
          stroke={ink}
          strokeWidth={wgt}
          strokeLinecap="round"
        />,
      );
      cx += len + gap;
      if (cx > W + 6) break;
    }
  }

  const moonX = 49;
  const moonY = 13.5;

  return (
    <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
      <defs>
        <clipPath id={clipId}>
          <rect
            x={(x - tx) / scale}
            y={(y - ty) / scale}
            width={w / scale}
            height={h / scale}
          />
        </clipPath>
        <clipPath id={`${clipId}-back`}>
          <path d={ridgePath(backRidge)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x={-10} y={-10} width={W + 20} height={W + 20} fill={paper} />

        {skyLines}

        {/* moon: a reserved disc, the sky screen cleared out behind it */}
        <circle cx={moonX} cy={moonY} r={6.4} fill={paper} />
        <circle
          cx={moonX}
          cy={moonY}
          r={6.4}
          fill="none"
          stroke={ink}
          strokeWidth={FINE}
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`ml${i}`}
            x1={moonX + 1.2 + i * 1.5}
            y1={moonY - 6.6 + i * 0.5}
            x2={moonX + 6.4}
            y2={moonY + 1 + i * 1.4}
            stroke={ink}
            strokeWidth={HAIR}
            strokeLinecap="round"
            opacity={0.75}
          />
        ))}

        {aurora}

        {/* back range */}
        <g clipPath={`url(#${clipId}-back)`}>
          <path d={ridgePath(backRidge)} fill={paper} />
          {backHatch}
        </g>
        <path
          d={ridgePath(backRidge)}
          fill="none"
          stroke={ink}
          strokeWidth={MID}
          strokeLinejoin="round"
        />

        {/* front range */}
        <path d={ridgePath(frontRidge)} fill={ink} />
        {snow}

        {/* shoreline */}
        <line
          x1={-6}
          y1={HORIZON + 0.6}
          x2={W + 6}
          y2={HORIZON + 0.6}
          stroke={ink}
          strokeWidth={BOLD}
        />
        {water}

        {/* the moon laid back into the water as a broken reflection */}
        {Array.from({ length: 9 }).map((_, i) => {
          const yy = HORIZON + 3 + i * 3.4;
          const half = 1.6 + i * 0.85;
          return (
            <line
              key={`r${i}`}
              x1={moonX - half}
              y1={yy}
              x2={moonX + half}
              y2={yy}
              stroke={mix(paper, ink, 0.08)}
              strokeWidth={FINE + i * 0.05}
              strokeLinecap="round"
              opacity={0.9 - i * 0.07}
            />
          );
        })}
      </g>
    </g>
  );
});

/** Hatch bands, densest at the horizon. */
function ridge(seed: number, peaks: number, baseY: number, amp: number) {
  const pts: [number, number][] = [];
  const n = peaks * 4;
  const step = (W + 24) / n;
  let prev = baseY - amp * 0.4;
  for (let i = 0; i <= n; i++) {
    const px = -12 + i * step;
    const u = i / n;
    const major =
      Math.sin(u * Math.PI * (1.1 + peaks * 0.14) + seed) * 0.5 + 0.5;
    const detail = (rand(seed, i) - 0.5) * amp * 0.78;
    const target = baseY - amp * (0.18 + major * 0.82) + detail;
    // ease toward the target so ridges climb and fall instead of zig-zagging
    const y = prev + (target - prev) * 0.84;
    pts.push([px, y]);
    prev = y;
  }
  return pts;
}

function ridgePath(pts: [number, number][]) {
  const d = [`M ${pts[0][0]} ${HORIZON + 1}`, `L ${pts[0][0]} ${pts[0][1]}`];
  for (let i = 1; i < pts.length; i++) d.push(`L ${pts[i][0]} ${pts[i][1]}`);
  d.push(`L ${pts[pts.length - 1][0]} ${HORIZON + 1}`, "Z");
  return d.join(" ");
}

function ridgeY(pts: [number, number][], px: number) {
  let best = pts[0];
  for (const p of pts) if (Math.abs(p[0] - px) < Math.abs(best[0] - px)) best = p;
  return best[1];
}
