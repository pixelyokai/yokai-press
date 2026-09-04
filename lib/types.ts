export type AspectId = "square" | "portrait" | "landscape";
export type PerfStyle = "classic" | "deep" | "fine" | "die";
export type Finish = "none" | "matte" | "gloss";
export type MaterialId =
  | "paper"
  | "retro"
  | "holo"
  | "iridescent"
  | "dither"
  | "denim"
  | "leather"
  | "kraft";
export type FrameStyle = "none" | "thin" | "double";
export type FitMode = "cover" | "contain" | "fill";
export type ColorMode = "full" | "duotone" | "mono";
export type InkTexture = "flat" | "halftone" | "engraved";
export type Align = "left" | "center" | "right";
export type Corner = "tl" | "tr" | "bl" | "br";
/** Where the lettering sits, and therefore where the artwork can go. */
export type TextLayout = "top" | "bottom" | "left" | "right" | "overlay";
export type DisplayFontId =
  | "oswald"
  | "bebas"
  | "bodoni"
  | "playfair"
  | "archivo"
  | "instrumentserif"
  | "katibeh"
  | "martianmono"
  | "specialelite"
  | "chelseamarket"
  | "rubikdirt"
  | "rubikdistressed";
export type LabelFontId =
  | "spacemono"
  | "jetbrains"
  | "oswald"
  | "inter"
  | "specialelite"
  | "chelseamarket"
  | "rubikdirt"
  | "rubikdistressed";

export interface StampConfig {
  /* 1. shape & perforation */
  aspect: AspectId;
  perfStyle: PerfStyle;
  perfSize: number;
  /** hole size within the gauge: 0 small .. 1 large */
  perfRadius: number; // 0 tight .. 1 loose
  cornerRadius: number; // 0..1 of the inner content area

  /* 2. material */
  material: MaterialId;
  materialColor: string;
  grain: number;
  /** how hard a life the sheet has had: 0 mint, 1 heavily aged */
  wear: number; // 0..1 texture intensity
  stitch: boolean;
  stitchColor: string;
  /** how the surface takes light, independent of what it is made of */
  finish: Finish;

  /* 3. frame, bleed and artwork */
  frame: FrameStyle;
  frameColor: string;
  padding: number; // 0..1 bleed between content and perf edge
  image: string | null; // data URL
  fit: FitMode;
  cropZoom: number; // 1..3
  cropX: number; // -1..1, fraction of the plate width
  cropY: number; // -1..1

  /* 4. content — every text element hangs off `showText` */
  showText: boolean;
  textLayout: TextLayout;
  headline: string;
  subtext: string;
  denomValue: string;
  denomSymbol: string;
  denomCorner: Corner;
  country: string;
  countryAlt: string; // non-latin pairing
  year: string;
  postmark: boolean;
  postmarkText: string;
  postmarkOpacity: number; // 0..1
  postmarkRotation: number; // deg

  /* 5. typography */
  displayFont: DisplayFontId;
  labelFont: LabelFontId;
  autoContrast: boolean;
  inkColor: string;
  /** per-role ink overrides; empty means follow the resolved ink */
  displayColor: string;
  labelColor: string;
  headlineAlign: Align;
  labelAlign: Align;

  /* 6. colour & print */
  colorMode: ColorMode;
  duotoneShadow: string;
  duotoneHighlight: string;
  inkTexture: InkTexture;
  inkStrength: number; // 0..1

  /* 7. presentation (preview only) */
  scale: number; // 0..1 preview size
  rotation: number; // deg
  lift: number; // 0..1 how far off the surface the sheet sits

  /* 8. paper physics */
  physics: boolean;

  /* 9. export */
}

