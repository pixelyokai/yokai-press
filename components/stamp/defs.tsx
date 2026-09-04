"use client";

import { darken, lighten, hexToRgb, luminance, mix } from "@/lib/color";
import type { MaterialId } from "@/lib/types";

/**
 * Materials are built from real texture data — turbulence through lighting
 * filters, so the grain has relief — never a single flat gradient.
 */

const FOIL_ANGLE = 28;
const SHEEN_ANGLE = 34;

/** The classic 4x4 ordered-dither threshold matrix. */
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function StampDefs({
  uid,
  color,
  duoShadow,
  duoHighlight,
  screenPitch,
}: {
  uid: string;
  color: string;
  duoShadow: string;
  duoHighlight: string;
  screenPitch: number;
}) {
  const p = (n: string) => `${uid}-${n}`;
  const dot = screenPitch;

  return (
    <defs>
      {/* ---- paper surface: tooth, fibre and undulation, lit once ----
              Three separate lit passes cost three rects and three lightings,
              and light hits one height field, not three. The undulation term
              sits at 0.02: lower and the lit blobs read as map contours. */}
      <filter id={p("tooth")} x="0" y="0" width="100%" height="100%">
        {/* the fine tooth of the stock */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.82 0.88"
          numOctaves={3}
          seed={4}
          result="fine"
        />
        {/* fibres, pulled long in one direction the way pulp settles */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.012 0.7"
          numOctaves={2}
          seed={13}
          result="fibre"
        />
        {/* and the slow unevenness of a sheet that has been handled */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.02"
          numOctaves={2}
          seed={37}
          result="slow"
        />
        <feComposite
          in="fine"
          in2="fibre"
          operator="arithmetic"
          k1={0}
          k2={0.66}
          k3={0.34}
          k4={0}
          result="mix"
        />
        <feComposite
          in="mix"
          in2="slow"
          operator="arithmetic"
          k1={0}
          k2={0.82}
          k3={0.18}
          k4={0}
          result="height"
        />
        <feDiffuseLighting
          in="height"
          surfaceScale={1.5}
          diffuseConstant={1.02}
          lightingColor="#ffffff"
        >
          <feDistantLight azimuth={235} elevation={60} />
        </feDiffuseLighting>
      </filter>

      {/* ---- foxing: the brown blooms aged paper develops ---- */}
      <filter id={p("foxing")} x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.006"
          /* The feGaussianBlur below throws away everything finer than its
             radius, so octaves past the third were computed and discarded. */
          numOctaves={2}
          seed={21}
          result="n"
        />
        <feComponentTransfer in="n" result="blobs">
          <feFuncA type="discrete" tableValues="0 0 0 0 0 0 0.35 0.7 1" />
        </feComponentTransfer>
        <feGaussianBlur in="blobs" stdDeviation={2.5} result="soft" />
        <feColorMatrix
          in="soft"
          type="matrix"
          values="0 0 0 0 0.42  0 0 0 0 0.28  0 0 0 0 0.12  0 0 0 0.55 0"
        />
      </filter>

      {/* ---- leather: coarse pores over fine grain, both lit ---- */}
      <filter id={p("leather")} x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.013 0.015"
          numOctaves={3}
          seed={11}
          result="coarse"
        />
        <feDiffuseLighting
          in="coarse"
          surfaceScale={5.5}
          diffuseConstant={1}
          lightingColor="#ffffff"
          result="L1"
        >
          <feDistantLight azimuth={225} elevation={42} />
        </feDiffuseLighting>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.24"
          numOctaves={2}
          seed={3}
          result="fine"
        />
        <feDiffuseLighting
          in="fine"
          surfaceScale={2}
          diffuseConstant={1}
          lightingColor="#ffffff"
          result="L2"
        >
          <feDistantLight azimuth={225} elevation={62} />
        </feDiffuseLighting>
        <feBlend in="L1" in2="L2" mode="multiply" result="hide" />
        {/* the shoulder the highlight pass used to add, done in one place */}
        <feComponentTransfer in="hide">
          <feFuncR type="linear" slope={1.34} intercept={-0.17} />
          <feFuncG type="linear" slope={1.34} intercept={-0.17} />
          <feFuncB type="linear" slope={1.34} intercept={-0.17} />
        </feComponentTransfer>
      </filter>

      {/* ---- denim: crossed thread relief, then vertical slub ---- */}
      <filter id={p("weave")} x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.55 0.06"
          numOctaves={2}
          seed={5}
          result="warp"
        />
        <feDiffuseLighting
          in="warp"
          surfaceScale={2.4}
          diffuseConstant={1}
          lightingColor="#ffffff"
          result="W"
        >
          <feDistantLight azimuth={135} elevation={55} />
        </feDiffuseLighting>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.06 0.55"
          numOctaves={2}
          seed={8}
          result="weft"
        />
        <feDiffuseLighting
          in="weft"
          surfaceScale={2.4}
          diffuseConstant={1}
          lightingColor="#ffffff"
          result="F"
        >
          <feDistantLight azimuth={315} elevation={55} />
        </feDiffuseLighting>
        <feBlend in="W" in2="F" mode="multiply" />
      </filter>

      <filter id={p("slub")} x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.09 0.002"
          numOctaves={3}
          seed={17}
          result="n"
        />
        <feColorMatrix
          in="n"
          type="matrix"
          values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 -0.12"
        />
      </filter>

      {/* ---- kraft: chopped fibre flecks pressed into recycled board ---- */}
      <filter id={p("fleck")} x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.35 0.1"
          numOctaves={2}
          seed={23}
          result="n"
        />
        <feColorMatrix
          in="n"
          type="matrix"
          values="0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 5 -3.4"
        />
      </filter>

      {/* ---- plain film grain, keeps every material off-flat ---- */}
      <filter id={p("grain")} x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={2}
          result="noise"
        />
        <feColorMatrix
          in="noise"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.45 0"
        />
      </filter>

      {/* ---- the same tooth, in light. Screening the black-noise `grain`
              onto a dark sheet is a no-op — screen leaves black untouched —
              so dark stock needs its speckle carried in white. */}
      <filter id={p("grainLight")} x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={2}
          result="noise"
        />
        <feColorMatrix
          in="noise"
          type="matrix"
          values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.9 -0.72"
        />
      </filter>

      {/* ---- glitter: only the brightest peaks of the noise survive, so the
              foil carries scattered specks rather than an even fog ---- */}
      <filter id={p("sparkle")} x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.22"
          numOctaves={1}
          seed={29}
          result="n"
        />
        <feColorMatrix
          in="n"
          type="matrix"
          values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 8 -5.6"
        />
      </filter>

      <filter id={p("roughType")} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.42"
          numOctaves={1}
          seed={6}
          result="n"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="n"
          scale={0.55}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>

      {/* ---- age: grime gathers at the edges of a sheet that has been
              handled, never in the middle. A vignette is the honest shape for
              it — fingers, album corners and album mounts all work inward from
              the border. */}
      <radialGradient id={p("grime")} cx="50%" cy="50%" r="72%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="58%" stopColor="#e8ddc8" />
        <stop offset="84%" stopColor="#a58f68" />
        <stop offset="100%" stopColor="#6d5533" />
      </radialGradient>

      {/* ---- rub: where the ink has lifted. Coarse, sparse and high contrast,
              so it takes the printing off in flecks rather than fogging it
              evenly — an even fog reads as opacity, not as wear. ---- */}
      <filter id={p("rub")} x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.08 0.11"
          /* thresholded hard by the matrix below — the fine octaves were
             almost entirely clipped away before they reached the sheet */
          numOctaves={2}
          seed={41}
          result="n"
        />
        <feColorMatrix
          in="n"
          type="matrix"
          values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 7 -4.3"
        />
      </filter>

      {/* ---- twill: the 2/1 diagonal of woven denim ---- */}
      <pattern
        id={p("twill")}
        width={7}
        height={7}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(58)"
      >
        <rect width={7} height={7} fill={darken(color, 0.22)} />
        <rect width={7} height={2.4} fill={lighten(color, 0.24)} />
        <rect y={3.6} width={7} height={1.1} fill={darken(color, 0.42)} />
      </pattern>

      {/* ---- ordered dither ---- */}
      <pattern id={p("dither")} width={8} height={8} patternUnits="userSpaceOnUse">
        {BAYER_4X4.map((row, ry) =>
          row.map((threshold, rx) => (
            <rect
              key={`${rx}-${ry}`}
              x={rx * 2}
              y={ry * 2}
              width={2}
              height={2}
              fill={darken(color, 0.55)}
              /* the later a cell's turn, the lighter it sits */
              opacity={1 - threshold / 16}
            />
          )),
        )}
      </pattern>

      {/* ---- the fine rulings that split light inside foil ---- */}
      <pattern
        id={p("rulings")}
        width={4}
        height={4}
        patternUnits="userSpaceOnUse"
        patternTransform={`rotate(${FOIL_ANGLE + 62})`}
      >
        <rect width={1.4} height={4} fill="#ffffff" opacity={0.6} />
        <rect x={2.4} width={0.7} height={4} fill="#7a8290" opacity={0.35} />
      </pattern>

      {/* ---- print screens: dots and engraver rulings ----
           The screen is the stock showing between the ink, so it is painted in
           the stock's own colour — white would do nothing on dark stock. */}
      {/* Two screens at different angles, not one. A single grid of dots
          moirés against the artwork and reads as a texture overlay; offset
          screens interfere into the rosette that says "this was printed". */}
      <pattern
        id={p("halftone")}
        width={dot}
        height={dot}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <circle cx={dot / 2} cy={dot / 2} r={dot * 0.3} fill={color} />
      </pattern>
      <pattern
        id={p("halftone2")}
        width={dot * 1.06}
        height={dot * 1.06}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(75)"
      >
        <circle
          cx={dot * 0.53}
          cy={dot * 0.53}
          r={dot * 0.2}
          fill={color}
          opacity={0.7}
        />
      </pattern>
      <pattern
        id={p("lines")}
        width={dot * 0.78}
        height={dot * 0.78}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-24)"
      >
        <rect width={dot * 0.78} height={dot * 0.3} fill={color} />
      </pattern>

      {/* ---- pearl foil ----
           Holographic vinyl is silver first and coloured second: pale bands of
           the spectrum washed most of the way to white, with a broad silver
           sheen laid through the middle. */}
      <linearGradient
        id={p("pearl")}
        x1="0"
        y1="0"
        x2="1"
        y2="0"
        gradientTransform={`rotate(${FOIL_ANGLE} 0.5 0.5)`}
      >
        {PEARL_STOPS.map((s, i) => (
          <stop key={i} offset={s[0]} stopColor={s[1]} />
        ))}
      </linearGradient>
      <linearGradient
        id={p("pearlCross")}
        x1="0"
        y1="0"
        x2="1"
        y2="0"
        gradientTransform={`rotate(${FOIL_ANGLE + 74} 0.5 0.5)`}
      >
        {PEARL_STOPS.map((s, i) => (
          <stop key={i} offset={s[0]} stopColor={s[1]} stopOpacity={0.7} />
        ))}
      </linearGradient>
      <linearGradient
        id={p("silver")}
        x1="0"
        y1="0"
        x2="1"
        y2="0"
        gradientTransform={`rotate(${FOIL_ANGLE + 90} 0.5 0.5)`}
      >
        <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="0.34" stopColor="#ffffff" stopOpacity="0.7" />
        <stop offset="0.52" stopColor="#ffffff" stopOpacity="0.88" />
        <stop offset="0.7" stopColor="#ffffff" stopOpacity="0.58" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>

      <radialGradient id={p("pearlA")} cx="0.3" cy="0.25" r="0.85">
        <stop offset="0" stopColor="#ffd9ec" />
        <stop offset="0.45" stopColor="#cfe6ff" />
        <stop offset="1" stopColor="#e6ffe9" />
      </radialGradient>
      <radialGradient id={p("pearlB")} cx="0.78" cy="0.8" r="0.8">
        <stop offset="0" stopColor="#fff3c4" />
        <stop offset="0.5" stopColor="#e2d4ff" />
        <stop offset="1" stopColor="#c8f2ff" stopOpacity="0" />
      </radialGradient>

      <linearGradient
        id={p("sheen")}
        x1="0"
        y1="0"
        x2="1"
        y2="1"
        gradientTransform={`rotate(${SHEEN_ANGLE} 0.5 0.5)`}
      >
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
        <stop offset="0.42" stopColor="#ffffff" stopOpacity="0.05" />
        <stop offset="0.62" stopColor="#000000" stopOpacity="0.04" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.2" />
      </linearGradient>

      {/* ---- matte lamination ----
              A matte coat scatters light instead of returning it, which lifts
              the blacks slightly and veils the whole sheet. Removing the sheen
              alone only makes a plate duller; the lift is the tell. */}
      <linearGradient id={p("matte")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f4f4f2" stopOpacity="0.13" />
        <stop offset="0.5" stopColor="#eceae6" stopOpacity="0.09" />
        <stop offset="1" stopColor="#e6e4e0" stopOpacity="0.13" />
      </linearGradient>

      {/* ---- gloss: a varnish coat returns one hard, narrow highlight ---- */}
      <linearGradient
        id={p("gloss")}
        x1="0"
        y1="0"
        x2="1"
        y2="0"
        gradientTransform={`rotate(${SHEEN_ANGLE + 62} 0.5 0.5)`}
      >
        <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="0.26" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.28" />
        <stop offset="0.425" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="0.45" stopColor="#ffffff" stopOpacity="1" />
        <stop offset="0.49" stopColor="#ffffff" stopOpacity="0.3" />
        <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.08" />
        <stop offset="0.72" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>

      {/* varnish deepens the shadows as much as it brightens the highlight */}
      <radialGradient id={p("glossDeep")} cx="0.42" cy="0.34" r="0.82">
        <stop offset="0.4" stopColor="#000000" stopOpacity="0" />
        <stop offset="1" stopColor="#0b1016" stopOpacity="0.34" />
      </radialGradient>

      <radialGradient id={p("vignette")} cx="0.5" cy="0.48" r="0.72">
        <stop offset="0.55" stopColor="#000000" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.3" />
      </radialGradient>

      <radialGradient id={p("wear")} cx="0.5" cy="0.5" r="0.62">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>

      {/* a soft scrim so overlaid lettering keeps its footing on artwork */}
      <linearGradient id={p("scrimBottom")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000000" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.55" />
      </linearGradient>
      <linearGradient id={p("scrimTop")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000000" stopOpacity="0.45" />
        <stop offset="1" stopColor="#000000" stopOpacity="0" />
      </linearGradient>

      {/* ---- print colour modes ---- */}
      <filter id={p("mono")} colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="linear" slope={1.08} intercept={-0.03} />
          <feFuncG type="linear" slope={1.08} intercept={-0.03} />
          <feFuncB type="linear" slope={1.08} intercept={-0.03} />
        </feComponentTransfer>
      </filter>

      <DuotoneFilter
        id={p("duotone")}
        shadow={duoShadow}
        highlight={duoHighlight}
      />
    </defs>
  );
}

/* Spectrum washed most of the way to white — foil reads as silver carrying a
   tint, not as a paint chart. Tiled just under twice across the sheet. */
const PEARL_BAND = [
  "#ffc7dd",
  "#ffe2bd",
  "#f8f2b8",
  "#c4f2d4",
  "#bfe8f7",
  "#d2d2fa",
  "#eec6f4",
];

const PEARL_STOPS: [string, string][] = (() => {
  const total = Math.round(PEARL_BAND.length * 1.8);
  const out: [string, string][] = [];
  for (let i = 0; i <= total; i++) {
    out.push([(i / total).toFixed(4), PEARL_BAND[i % PEARL_BAND.length]]);
  }
  return out;
})();

/** Luminance collapsed onto a two-colour ramp, the way a duotone plate works. */
export function DuotoneFilter({
  id,
  shadow,
  highlight,
}: {
  id: string;
  shadow: string;
  highlight: string;
}) {
  const s = hexToRgb(shadow);
  const h = hexToRgb(highlight);
  const ramp = (a: number, b: number) => `${a / 255} ${b / 255}`;
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feColorMatrix
        type="matrix"
        values="0.2126 0.7152 0.0722 0 0
                0.2126 0.7152 0.0722 0 0
                0.2126 0.7152 0.0722 0 0
                0 0 0 1 0"
      />
      <feComponentTransfer>
        <feFuncR type="table" tableValues={ramp(s.r, h.r)} />
        <feFuncG type="table" tableValues={ramp(s.g, h.g)} />
        <feFuncB type="table" tableValues={ramp(s.b, h.b)} />
      </feComponentTransfer>
    </filter>
  );
}

/** The stacked texture, sheen and wear layers that make each material read. */
export function MaterialLayers({
  uid,
  material,
  color,
  grain,
  w,
  h,
}: {
  uid: string;
  material: MaterialId;
  color: string;
  grain: number;
  w: number;
  h: number;
}) {
  const p = (n: string) => `url(#${uid}-${n})`;
  const full = { x: 0, y: 0, width: w, height: h };
  const g = Math.max(0, Math.min(1, grain));

  /* Relief layers are multiplied in, which only darkens — invisible on black
     stock. Below ~0.2 luminance the same field is screened instead, on a ramp
     so nothing pops as the colour is dragged darker. */
  const lift = Math.max(0, Math.min(1, (0.2 - luminance(color)) / 0.2));

  /** A lit height field, blended so it reads on light and dark stock alike. */
  const relief = (key: string, opacity: number, filter: string) => {
    if (lift < 0.98) {
      add(key, "#ffffff", opacity * (1 - lift), "multiply", filter);
    }
    if (lift > 0.02) {
      /* Only a fraction: a lit height field is mostly mid grey, and screening
         that at full strength raises the whole sheet rather than picking out
         the tooth. Black stock has to stay black. */
      add(`${key}-lit`, "#ffffff", opacity * lift * 0.13, "screen", filter);
    }
  };

  /** Fine speckle, dark on pale stock and light on dark. */
  const speckle = (key: string, opacity: number) => {
    if (lift < 0.98) {
      add(key, "#000000", opacity * (1 - lift), "overlay", p("grain"));
    }
    if (lift > 0.02) {
      add(`${key}-lit`, "#ffffff", opacity * lift * 1.7, "screen", p("grainLight"));
    }
  };

  const layers: React.ReactNode[] = [<rect key="base" {...full} fill={color} />];

  const add = (
    key: string,
    fill: string,
    opacity: number,
    blend: string,
    filter?: string,
  ) =>
    layers.push(
      <rect
        key={key}
        {...full}
        fill={fill}
        opacity={opacity}
        filter={filter}
        style={{ mixBlendMode: blend as never }}
      />,
    );

  switch (material) {
    case "paper":
      relief("tooth", 0.42 + g * 0.4, p("tooth"));
      speckle("fine", 0.05 + g * 0.14);
      break;
    case "retro":
      relief("tooth", 0.46 + g * 0.46, p("tooth"));
      speckle("fine", 0.06 + g * 0.16);
      layers.push(
        <rect
          key="age"
          {...full}
          fill={p("vignette")}
          opacity={0.34 + g * 0.2}
          style={{ mixBlendMode: "multiply" }}
        />,
      );
      break;
    case "holo":
      // pale spectrum, then the silver band through it, then the glitter
      layers.push(<rect key="pearl" {...full} fill={p("pearl")} />);
      add("cross", p("pearlCross"), 0.55, "multiply");
      add("silver", p("silver"), 0.68, "screen");
      add("rule", p("rulings"), 0.1 + g * 0.14, "soft-light");
      add("spark", "#fff", 0.5 + g * 0.5, "screen", p("sparkle"));
      speckle("grain", 0.06 + g * 0.12);
      break;
    case "iridescent":
      add("pearlA", p("pearlA"), 0.7, "soft-light");
      add("pearlB", p("pearlB"), 0.55, "screen");
      speckle("grain", 0.14 + g * 0.22);
      break;
    case "dither":
      add("dith", p("dither"), 0.35 + g * 0.45, "multiply");
      speckle("grain", 0.16 + g * 0.3);
      relief("tooth", 0.2 + g * 0.2, p("tooth"));
      break;
    case "denim":
      add("twill", p("twill"), 0.72, "normal");
      add("weave", "#fff", 0.4 + g * 0.45, "multiply", p("weave"));
      add("slub", "#fff", 0.14 + g * 0.26, "screen", p("slub"));
      layers.push(
        <rect key="wear" {...full} fill={p("wear")} opacity={0.4 + g * 0.2} />,
      );
      add("edge", p("vignette"), 0.5, "multiply");
      break;
    case "leather":
      // one lit pass — the highlight is built into the filter, see above
      relief("pore", 0.46 + g * 0.4, p("leather"));
      speckle("fine", 0.1 + g * 0.16);
      layers.push(
        <rect key="wear" {...full} fill={p("wear")} opacity={0.22 + g * 0.16} />,
      );
      add("edge", p("vignette"), 0.55, "multiply");
      break;
    case "kraft":
      // recycled board: the sheet surface, then chopped fibre pressed into it
      relief("tooth", 0.5 + g * 0.44, p("tooth"));
      add("fleck", "#fff", 0.45 + g * 0.5, "multiply", p("fleck"));
      add("edge", p("vignette"), 0.28, "multiply");
      break;
  }

  return <g style={{ isolation: "isolate" }}>{layers}</g>;
}

/** Foil has no single flat value; this is what its ink actually sits against. */
export const materialInkGround = (id: MaterialId, color: string) =>
  id === "holo" ? mix(color, "#ffffff", 0.4) : color;
