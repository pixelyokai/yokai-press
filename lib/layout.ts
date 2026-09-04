import { perfDepth } from "./perforation";
import { dimsFor, DISPLAY_FONTS, FONT_FILES } from "./presets";
import { fitSize } from "./measure";
import type { StampConfig, TextLayout } from "./types";

/**
 * Where everything on the plate goes. Shared, because the SVG draws from it
 * and the crop control frames the picture against the same rectangle — two
 * implementations of this arithmetic would drift apart.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextPlacement {
  headlineText: string;
  colX: number;
  colW: number;
  countryX: number;
  countryW: number;
  countryY: number;
  headlineY: number;
  subY: number;
  metaRuleY: number;
  metaBaseline: number;
  metaSecondBaseline: number;
  stacked: boolean;
  scrim: boolean;
}

export interface StampLayout {
  w: number;
  h: number;
  /** the content area inside the perforation */
  cx: number;
  cy: number;
  cw: number;
  ch: number;
  radius: number;
  /** the area inside the frame rules */
  ax: number;
  ay: number;
  aw: number;
  ah: number;
  artRadius: number;
  /** where the picture sits */
  art: Rect;
  subLines: string[];
  countrySize: number;
  subSize: number;
  metaSize: number;
  gap: number;
  headlineSize: number;
  text: TextPlacement | null;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function computeLayout(cfg: StampConfig): StampLayout {
  const { w, h } = dimsFor(cfg.aspect);

  /* content area: clear of the deepest bite, plus the chosen bleed */
  const tooth = perfDepth(w, h, {
    style: cfg.perfStyle,
    size: cfg.perfSize,
    radius: cfg.perfRadius,
  });
  const pad = tooth + Math.min(w, h) * lerp(0.018, 0.1, cfg.padding);
  const cx = pad;
  const cy = pad;
  const cw = w - pad * 2;
  const ch = h - pad * 2;
  const radius = Math.min(cw, ch) * 0.22 * cfg.cornerRadius;

  /* frame inset — art sits inside whatever rules the frame draws */
  const frameGap =
    cfg.frame === "none" ? 0 : cfg.frame === "thin" ? cw * 0.022 : cw * 0.05;
  const ax = cx + frameGap;
  const ay = cy + frameGap;
  const aw = cw - frameGap * 2;
  const ah = ch - frameGap * 2;
  const artRadius = Math.max(0, radius - frameGap * 0.6);

  const subLines = cfg.subtext
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  const base = {
    w,
    h,
    cx,
    cy,
    cw,
    ch,
    radius,
    ax,
    ay,
    aw,
    ah,
    artRadius,
    subLines,
  };

  const gap = ah * 0.028;
  const layout: TextLayout = cfg.textLayout;
  const full: Rect = { x: ax, y: ay, w: aw, h: ah };

  if (!cfg.showText) {
    return {
      ...base,
      art: full,
      countrySize: ah * 0.042,
      subSize: ah * 0.038,
      metaSize: ah * 0.034,
      gap,
      headlineSize: 0,
      text: null,
    };
  }

  const display = DISPLAY_FONTS.find((f) => f.id === cfg.displayFont)!;
  const displayFamily = FONT_FILES[cfg.displayFont].family;
  const labelFamily = FONT_FILES[cfg.labelFont].family;

  const sideCol = layout === "left" || layout === "right";
  const textOnRight = layout === "right";
  const inset = layout === "overlay" ? aw * 0.05 : 0;
  const colW = (sideCol ? aw * 0.42 : aw) - inset * 2;
  /* in the right-hand arrangement the lettering column moves across and the
     artwork takes the space it left behind */
  const colX = sideCol && textOnRight ? ax + aw - colW : ax + inset;

  /* The denomination tablet is anchored to a corner of the artwork, so in the
     overlay arrangement the country line has to give way to it. */
  const denomBand = Math.min(full.w, full.h) * 0.33;
  const dodge =
    layout === "overlay" &&
    (cfg.denomCorner === "tl" || cfg.denomCorner === "tr")
      ? denomBand
      : 0;
  const countryX = cfg.denomCorner === "tl" ? colX + dodge : colX;
  const countryW = colW - dodge;

  /* Every line is fitted to the column it lives in — a long country name or a
     narrow side column would otherwise run straight off the plate. */
  const countryText = cfg.country.toUpperCase();
  const countrySize = cfg.country
    ? fitSize(countryText, labelFamily, 600, 0.18, countryW * 0.98, ah * 0.042)
    : ah * 0.042;
  const subSize = subLines.length
    ? Math.min(
        ah * 0.038,
        ...subLines.map((l) =>
          fitSize(l, labelFamily, 400, 0.04, colW * 0.98, ah * 0.038),
        ),
      )
    : ah * 0.038;
  const metaW = sideCol ? colW * 0.94 : colW * 0.46;
  const metaSize = Math.min(
    ah * 0.034,
    cfg.year
      ? fitSize(cfg.year, labelFamily, 400, 0.12, metaW, ah * 0.034)
      : ah * 0.034,
    cfg.countryAlt
      ? fitSize(cfg.countryAlt, labelFamily, 400, 0.06, metaW, ah * 0.034)
      : ah * 0.034,
  );

  const headlineText = display.caps ? cfg.headline.toUpperCase() : cfg.headline;
  const headlineSize = cfg.headline
    ? fitSize(
        headlineText,
        displayFamily,
        display.weight,
        display.tracking,
        colW * 0.96,
        ah * (sideCol ? 0.095 : 0.115) * display.scale,
      )
    : 0;

  const topH = cfg.country ? countrySize + gap : 0;

  /* Clears the headline's own descenders, so a caps face needs barely more
     than its cap height. */
  const headBody = display.caps ? 0.86 : 1.0;
  /* The fixed component is small on purpose: headBody already reserves the
     headline's own descender space, so this is only the air between the two
     blocks. Tuned to 6px of visible gap at the default preview size. */
  const headH = cfg.headline ? headlineSize * headBody + gap * 0.5 : 0;
  const subH = subLines.length ? subLines.length * subSize * 1.2 + gap * 0.4 : 0;
  const hasMeta = Boolean(cfg.year || cfg.countryAlt);
  const metaH = hasMeta ? metaSize + gap * 0.7 : 0;

  let art: Rect;
  let countryY = ay + countrySize * 0.82;
  let headlineY = 0;
  let subY = 0;

  switch (layout) {
    case "top": {
      headlineY = ay + topH + headlineSize * 0.82;
      subY = ay + topH + headH;
      const top = ay + topH + headH + subH + gap * 0.5;
      art = {
        x: ax,
        y: top,
        w: aw,
        h: Math.max(ah * 0.25, ay + ah - metaH - gap * 0.4 - top),
      };
      break;
    }
    case "overlay": {
      art = full;
      countryY = ay + countrySize * 1.6;
      const stackBottom = ay + ah - metaH - gap * 0.8;
      subY = stackBottom - subH;
      headlineY = subY - gap * 0.5;
      break;
    }
    case "left":
    case "right": {
      art = {
        x: textOnRight ? ax : ax + colW + gap,
        y: ay,
        w: aw - colW - gap,
        h: ah,
      };
      headlineY = ay + topH + headlineSize * 0.82;
      subY = ay + topH + headH;
      break;
    }
    default: {
      /* Lettering below the artwork, country line included — otherwise one
         block of type is split with the picture wedged inside it. */
      const artTop = ay;
      const artH = Math.max(
        ah * 0.25,
        ah - topH - headH - subH - metaH - gap * 0.6,
      );
      art = { x: ax, y: artTop, w: aw, h: artH };
      const blockTop = artTop + artH + gap * 0.6;
      countryY = blockTop + countrySize * 0.82;
      headlineY = blockTop + topH + headlineSize * 0.82;
      subY = blockTop + topH + headH;
      break;
    }
  }

  return {
    ...base,
    art,
    countrySize,
    subSize,
    metaSize,
    gap,
    headlineSize,
    text: {
      headlineText,
      colX,
      colW,
      countryX,
      countryW,
      countryY,
      headlineY,
      subY,
      metaRuleY: sideCol ? ay + ah - metaSize * 3.1 : ay + ah - metaSize * 1.7,
      metaBaseline: sideCol
        ? ay + ah - metaSize * 1.9
        : ay + ah - metaSize * 0.35,
      metaSecondBaseline: ay + ah - metaSize * 0.35,
      stacked: sideCol,
      scrim: layout === "overlay",
    },
  };
}
