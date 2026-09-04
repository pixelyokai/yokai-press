import { mix } from "./color";
import type {
  DisplayFontId,
  LabelFontId,
  MaterialId,
  StampConfig,
} from "./types";

export const FONT_FILES: Record<string, { family: string; file: string }> = {
  oswald: { family: "Oswald", file: "/fonts/oswald.woff2" },
  bebas: { family: "Bebas Neue", file: "/fonts/bebas.woff2" },
  bodoni: { family: "Bodoni Moda", file: "/fonts/bodoni.woff2" },
  playfair: { family: "Playfair Display", file: "/fonts/playfair.woff2" },
  archivo: { family: "Archivo Narrow", file: "/fonts/archivo.woff2" },
  spacemono: { family: "Space Mono", file: "/fonts/spacemono.woff2" },
  jetbrains: { family: "JetBrains Mono", file: "/fonts/jetbrains.woff2" },
  inter: { family: "Inter", file: "/fonts/inter.woff2" },
  instrumentserif: { family: "Instrument Serif", file: "/fonts/instrumentserif.woff2" },
  katibeh: { family: "Katibeh", file: "/fonts/katibeh.woff2" },
  martianmono: { family: "Martian Mono", file: "/fonts/martianmono.woff2" },
  specialelite: { family: "Special Elite", file: "/fonts/specialelite.woff2" },
  chelseamarket: { family: "Chelsea Market", file: "/fonts/chelseamarket.woff2" },
  rubikdirt: { family: "Rubik Dirt", file: "/fonts/rubikdirt.woff2" },
  rubikdistressed: { family: "Rubik Distressed", file: "/fonts/rubikdistressed.woff2" },
};

/* Display faces: condensed / engraved, never a default system serif. */
export const DISPLAY_FONTS: {
  id: DisplayFontId;
  name: string;
  note: string;
  tracking: number; // em
  weight: number;
  caps: boolean;
  scale: number; // size multiplier — normalises cap height across faces
}[] = [
  { id: "oswald", name: "Oswald", note: "Condensed grotesque", tracking: 0.01, weight: 600, caps: true, scale: 1 },
  { id: "bebas", name: "Bebas Neue", note: "Poster condensed", tracking: 0.03, weight: 400, caps: true, scale: 1.12 },
  { id: "bodoni", name: "Bodoni Moda", note: "Engraved didone", tracking: 0.015, weight: 700, caps: true, scale: 0.94 },
  { id: "playfair", name: "Playfair", note: "High-contrast serif", tracking: 0.005, weight: 700, caps: false, scale: 0.94 },
  { id: "archivo", name: "Archivo Narrow", note: "Narrow gothic", tracking: 0.02, weight: 700, caps: true, scale: 0.98 },
  { id: "instrumentserif", name: "Instrument Serif", note: "Editorial serif", tracking: 0, weight: 400, caps: false, scale: 1.06 },
  { id: "katibeh", name: "Katibeh", note: "Calligraphic display", tracking: 0.01, weight: 400, caps: false, scale: 1.2 },
  { id: "martianmono", name: "Martian Mono", note: "Wide technical mono", tracking: 0.01, weight: 600, caps: true, scale: 0.74 },
  { id: "specialelite", name: "Special Elite", note: "Struck typewriter", tracking: 0.01, weight: 400, caps: true, scale: 0.92 },
  { id: "chelseamarket", name: "Chelsea Market", note: "Hand-lettered sign", tracking: 0.005, weight: 400, caps: false, scale: 0.98 },
  { id: "rubikdirt", name: "Rubik Dirt", note: "Distressed grotesque", tracking: 0.01, weight: 400, caps: true, scale: 0.9 },
  { id: "rubikdistressed", name: "Rubik Distressed", note: "Worn stencil", tracking: 0.01, weight: 400, caps: true, scale: 0.9 },
];

export const LABEL_FONTS: { id: LabelFontId; name: string; note: string }[] = [
  { id: "spacemono", name: "Space Mono", note: "Ledger mono" },
  { id: "jetbrains", name: "JetBrains Mono", note: "Technical mono" },
  { id: "oswald", name: "Oswald", note: "Condensed caps" },
  { id: "inter", name: "Inter", note: "Neutral grotesque" },
  { id: "specialelite", name: "Special Elite", note: "Struck typewriter" },
  { id: "chelseamarket", name: "Chelsea Market", note: "Hand-lettered sign" },
  { id: "rubikdirt", name: "Rubik Dirt", note: "Distressed grotesque" },
  { id: "rubikdistressed", name: "Rubik Distressed", note: "Worn stencil" },
];

export const MATERIALS: {
  id: MaterialId;
  name: string;
  note: string;
  base: string;
  ink: string;
  stitchable: boolean;
}[] = [
  { id: "paper", name: "Paper", note: "Matte, fine fibre tooth", base: "#f4f1e8", ink: "#1d2733", stitchable: false },
  { id: "retro", name: "Retro paper", note: "Aged cream, foxed", base: "#e9d9b6", ink: "#3a2a18", stitchable: false },
  { id: "holo", name: "Holographic", note: "Pearl foil, fine glitter", base: "#eef0f3", ink: "#14181f", stitchable: false },
  { id: "iridescent", name: "Iridescent", note: "Soft pearlescent shift", base: "#ecebf1", ink: "#231f2e", stitchable: false },
  { id: "dither", name: "Dither", note: "Retro screened dot print", base: "#efe9dd", ink: "#161a24", stitchable: false },
  { id: "denim", name: "Denim", note: "Diagonal twill weave", base: "#3f5f86", ink: "#f2efe6", stitchable: true },
  { id: "leather", name: "Leather", note: "Full-grain, pored", base: "#7a4326", ink: "#f6ecdc", stitchable: true },
  { id: "kraft", name: "Kraft board", note: "Recycled, flecked fibre", base: "#b18a5c", ink: "#2f2318", stitchable: false },
];

export const CURRENCIES = [
  "¢", "$", "€", "£", "¥", "₹", "₩", "₽", "₺", "₪", "₫", "₦", "฿", "kr", "zł", "R$",
] as const;

export const FINISHES: { id: import("./types").Finish; name: string }[] = [
  { id: "none", name: "None" },
  { id: "matte", name: "Matte" },
  { id: "gloss", name: "Gloss" },
];

export const materialMeta = (id: MaterialId) =>
  MATERIALS.find((m) => m.id === id) ?? MATERIALS[0];

export const ASPECTS: { id: StampConfig["aspect"]; name: string; w: number; h: number }[] = [
  { id: "portrait", name: "Portrait", w: 1000, h: 1200 },
  { id: "square", name: "Square", w: 1000, h: 1000 },
  { id: "landscape", name: "Landscape", w: 1200, h: 1000 },
];

export const dimsFor = (aspect: StampConfig["aspect"]) => {
  const a = ASPECTS.find((x) => x.id === aspect) ?? ASPECTS[0];
  return { w: a.w, h: a.h };
};

export const TEXT_LAYOUTS: {
  id: StampConfig["textLayout"];
  name: string;
  note: string;
}[] = [
  { id: "top", name: "Top", note: "Lettering leads, artwork fills the rest" },
  { id: "bottom", name: "Bottom", note: "Artwork on top, lettering under it" },
  { id: "left", name: "Left", note: "Lettering in a column left of the artwork" },
  { id: "right", name: "Right", note: "Lettering in a column right of the artwork" },
  { id: "overlay", name: "Overlay", note: "Artwork full bleed, lettering on top" },
];

/**
 * Ordered by value, not by which colour came from the stock — otherwise light
 * ink on dark stock maps to the wrong end and the lettering disappears.
 */
export function duotoneFor(base: string, ink: string) {
  let dark = lum(base) <= lum(ink) ? base : ink;
  let light = dark === base ? ink : base;

  /* A ramp whose ends sit at a similar value has nowhere to put contrast: the
     artwork and the lettering both land mid-ramp and the plate goes flat. Mid
     tone stock — kraft, denim — hits this, so pull the ends apart until there
     is a usable range between them. */
  const spread = lum(light) - lum(dark);
  const floor = 0.45;
  if (spread < floor) {
    const push = Math.min(0.62, ((floor - spread) / 2) * 1.7);
    dark = mix(dark, "#000000", push);
    light = mix(light, "#ffffff", push);
  }
  return { duotoneShadow: dark, duotoneHighlight: light };
}

function lum(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export const DEFAULT_CONFIG: StampConfig = {
  aspect: "portrait",
  perfStyle: "classic",
  perfSize: 0.42,
  perfRadius: 0.5,
  cornerRadius: 0.12,

  material: "retro",
  materialColor: "#e9d9b6",
  grain: 0.62,
  wear: 0.35,
  stitch: true,
  stitchColor: "#f0e5cc",
  finish: "none",

  frame: "double",
  frameColor: "#3a2a18",
  padding: 0.34,
  image: null,
  fit: "cover",
  cropZoom: 1,
  cropX: 0,
  cropY: 0,

  showText: true,
  textLayout: "top",
  headline: "Northern Light",
  subtext: "Aurora over the Sørfjord\nSurveyed winter 1931",
  denomValue: "",
  denomSymbol: "¢",
  denomCorner: "tr",
  country: "Republic of Yokai",
  countryAlt: "",
  year: "",
  postmark: false,
  postmarkText: "YOKAI PRESS G.P.O.",
  postmarkOpacity: 0.72,
  postmarkRotation: -14,

  displayFont: "bebas",
  labelFont: "specialelite",
  autoContrast: true,
  inkColor: "#3a2a18",
  displayColor: "",
  labelColor: "",
  headlineAlign: "center",
  labelAlign: "center",

  colorMode: "duotone",
  duotoneShadow: "#3a2a18",
  duotoneHighlight: "#e9d9b6",
  inkTexture: "engraved",
  inkStrength: 0.7,

  scale: 1,
  rotation: 0,
  lift: 0.5,

  physics: true,

};

/**
 * Roughly what still reads as a stamp at printed size. The renderer shrinks
 * type to fit, so without a cap a long entry shrinks to nothing instead of
 * overflowing — worse than being told to stop typing.
 */
export const TEXT_LIMITS = {
  headline: 40,
  subtext: 120,
  country: 34,
  countryAlt: 24,
  year: 4,
  denomValue: 5,
  denomSymbol: 3,
  postmarkText: 24,
} as const;

