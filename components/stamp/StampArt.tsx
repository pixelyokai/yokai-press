"use client";

import { memo, useMemo } from "react";
import { perforationPath, roundedRect, stitchSegments } from "@/lib/perforation";
import { dimsFor, FONT_FILES, DISPLAY_FONTS, materialMeta } from "@/lib/presets";
import { autoInk, darken, lighten, mix, isDark, rgbaOf } from "@/lib/color";
import { textWidth } from "@/lib/measure";
import { computeLayout } from "@/lib/layout";
import type { StampConfig } from "@/lib/types";
import { MaterialLayers, StampDefs, materialInkGround } from "./defs";
import { Engraving } from "./Engraving";
import { Postmark } from "./Postmark";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function stampDims(cfg: StampConfig) {
  return dimsFor(cfg.aspect);
}

export const StampArt = memo(function StampArt({
  cfg,
  uid,
  fontTick,
  svgProps,
}: {
  cfg: StampConfig;
  uid: string;
  /** Bumped when a webfont finishes loading, so measured text re-fits. */
  fontTick?: number;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  const { w, h } = stampDims(cfg);
  const meta = materialMeta(cfg.material);
  const paper = cfg.materialColor;
  const ground = materialInkGround(cfg.material, paper);
  const ink = cfg.autoContrast ? autoInk(ground) : cfg.inkColor;
  const display = DISPLAY_FONTS.find((f) => f.id === cfg.displayFont)!;
  const displayFamily = FONT_FILES[cfg.displayFont].family;
  const labelFamily = FONT_FILES[cfg.labelFont].family;

  const outline = useMemo(
    () => perforationPath(w, h, { style: cfg.perfStyle, size: cfg.perfSize, radius: cfg.perfRadius }),
    [w, h, cfg.perfStyle, cfg.perfSize, cfg.perfRadius],
  );

  /* Where the artwork and every line of type sit. Shared with the crop
     control so the two can never disagree about the printed area. */
  /* fontTick is not read here — it busts the memo once a webfont lands and
     the measured glyph widths change. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const L = useMemo(() => computeLayout(cfg), [cfg, fontTick]);
  const { cx, cy, cw, ch, radius, aw, artRadius, subLines } = L;

  const art = L.art;
  const T = L.text;

  const align = (a: string, x: number, wd: number) =>
    a === "left" ? x : a === "right" ? x + wd : x + wd / 2;
  const anchor = (a: string) =>
    a === "left" ? "start" : a === "right" ? "end" : "middle";

  /* over artwork the lettering goes light and gets a scrim under it */
  const textInk = T?.scrim ? mix("#ffffff", ink, 0.1) : ink;
  /* per-role overrides; empty means follow whatever the ink resolved to */
  const displayInk = cfg.displayColor || textInk;
  const labelInk = cfg.labelColor || textInk;

  const screenBlend = isDark(ground) ? "darken" : "lighten";
  const screenId =
    cfg.inkTexture === "halftone"
      ? `${uid}-halftone`
      : cfg.inkTexture === "engraved"
        ? `${uid}-lines`
        : null;

  const colorFilter =
    cfg.colorMode === "duotone"
      ? `url(#${uid}-duotone)`
      : cfg.colorMode === "mono"
        ? `url(#${uid}-mono)`
        : undefined;

  const clipId = `${uid}-art-clip`;
  const outerClipId = `${uid}-outer-clip`;

  /* ---- denomination plaque, anchored to a corner of the artwork ---- */
  const denomR = Math.min(art.w, art.h) * 0.115;
  const denomPad = Math.min(art.w, art.h) * 0.05;
  const denomCx =
    cfg.denomCorner === "tl" || cfg.denomCorner === "bl"
      ? art.x + denomPad + denomR
      : art.x + art.w - denomPad - denomR;
  const denomCy =
    cfg.denomCorner === "tl" || cfg.denomCorner === "tr"
      ? art.y + denomPad + denomR
      : art.y + art.h - denomPad - denomR;

  /* Centred on the numerals; the symbol is a superscript that hangs off them.
     textAnchor="middle" centres the combined advance instead, which pushes the
     digits left by half the symbol's width. Width scales linearly with size,
     so one trial measurement solves for the largest size that still fits. */
  const denomTrial = denomR * 0.78;
  const denomValW = textWidth(cfg.denomValue, labelFamily, 700, 0, denomTrial);
  const denomSymW = cfg.denomSymbol
    ? textWidth(cfg.denomSymbol, labelFamily, 700, 0, denomTrial * 0.52)
    : 0;
  /* half-width available inside the inner rule */
  const denomReach = denomR * 0.72;
  /* the far side is the binding constraint: half the figures, plus the symbol */
  const denomNeed = denomValW / 2 + denomSymW;
  const denomSize =
    denomNeed > denomReach ? denomTrial * (denomReach / denomNeed) : denomTrial;
  const denomStartX = denomCx - (denomValW * (denomSize / denomTrial)) / 2;

  const stitches = useMemo(() => {
    if (!cfg.stitch || !meta.stitchable) return [];
    return stitchSegments(
      cx + cw * 0.012,
      cy + ch * 0.012,
      cw * 0.976,
      ch * 0.976,
      radius,
      Math.min(cw, ch) * 0.045,
    );
  }, [cfg.stitch, meta.stitchable, cx, cy, cw, ch, radius]);

  const typographyFilter =
    cfg.inkTexture === "flat" ? undefined : `url(#${uid}-roughType)`;

  /* A duotone is a colour matrix — it remaps any input colour onto the two-ink
     ramp — so an explicit choice only survives outside that filter. With
     neither override set the lettering stays in, sharing the artwork's ink. */
  const typeColorFilter =
    cfg.displayColor || cfg.labelColor ? undefined : colorFilter;

  /* crop: zoom about the centre of the plate, then slide */
  const cropTransform =
    cfg.image && (cfg.cropZoom !== 1 || cfg.cropX !== 0 || cfg.cropY !== 0)
      ? [
          `translate(${(cfg.cropX * art.w).toFixed(2)} ${(cfg.cropY * art.h).toFixed(2)})`,
          `translate(${(art.x + art.w / 2).toFixed(2)} ${(art.y + art.h / 2).toFixed(2)})`,
          `scale(${cfg.cropZoom})`,
          `translate(${(-art.x - art.w / 2).toFixed(2)} ${(-art.y - art.h / 2).toFixed(2)})`,
        ].join(" ")
      : undefined;

  const Typography = T ? (
    <g>
      {cfg.country && (
        <text
          x={align(cfg.labelAlign, T.countryX, T.countryW)}
          y={T.countryY}
          fontFamily={labelFamily}
          fontSize={L.countrySize}
          fontWeight={600}
          letterSpacing={L.countrySize * 0.18}
          textAnchor={anchor(cfg.labelAlign)}
          fill={labelInk}
        >
          {cfg.country.toUpperCase()}
        </text>
      )}

      {cfg.headline && (
        <text
          x={align(cfg.headlineAlign, T.colX, T.colW)}
          y={T.headlineY}
          fontFamily={displayFamily}
          fontSize={L.headlineSize}
          fontWeight={display.weight}
          letterSpacing={L.headlineSize * display.tracking}
          textAnchor={anchor(cfg.headlineAlign)}
          fill={displayInk}
        >
          {T.headlineText}
        </text>
      )}

      {subLines.map((line, i) => (
        <text
          key={i}
          x={align(cfg.headlineAlign, T.colX, T.colW)}
          /* first line one cap height below subY, the rest step by leading */
          y={T.subY + L.subSize * 0.82 + i * L.subSize * 1.2}
          fontFamily={labelFamily}
          fontSize={L.subSize}
          letterSpacing={L.subSize * 0.04}
          textAnchor={anchor(cfg.headlineAlign)}
          fill={cfg.labelColor || (T.scrim ? textInk : mix(ink, ground, 0.18))}
        >
          {line}
        </text>
      ))}

      {(cfg.year || cfg.countryAlt) && (
        <g>
          <line
            x1={T.colX}
            y1={T.metaRuleY}
            x2={T.colX + T.colW}
            y2={T.metaRuleY}
            stroke={labelInk}
            strokeWidth={Math.max(0.6, aw * 0.0016)}
            opacity={0.45}
          />
          {cfg.year && (
            <text
              x={T.colX}
              y={T.metaBaseline}
              fontFamily={labelFamily}
              fontSize={L.metaSize}
              letterSpacing={L.metaSize * 0.12}
              fill={cfg.labelColor || (T.scrim ? textInk : mix(ink, ground, 0.1))}
            >
              {cfg.year}
            </text>
          )}
          {cfg.countryAlt && (
            <text
              x={T.stacked ? T.colX : T.colX + T.colW}
              y={T.metaSecondBaseline}
              fontFamily={labelFamily}
              fontSize={L.metaSize}
              letterSpacing={L.metaSize * 0.06}
              textAnchor={T.stacked ? "start" : "end"}
              fill={cfg.labelColor || (T.scrim ? textInk : mix(ink, ground, 0.1))}
            >
              {cfg.countryAlt}
            </text>
          )}
        </g>
      )}

    </g>
  ) : null;


  /* Drawn once, outside Typography: the misregistration pass renders that a
     second time at an offset, and the plaque's opaque fill would double. */
  const Denomination = cfg.denomValue ? (
    <g>
        <circle cx={denomCx} cy={denomCy} r={denomR} fill={ground} />
        <circle
          cx={denomCx}
          cy={denomCy}
          r={denomR}
          fill="none"
          stroke={ink}
          strokeWidth={denomR * 0.075}
        />
        <circle
          cx={denomCx}
          cy={denomCy}
          r={denomR * 0.84}
          fill="none"
          stroke={ink}
          strokeWidth={denomR * 0.028}
        />
        {/* Baseline comes off the resolved font size, not the radius, so a
            longer value that fitSize shrinks stays centred. */}
        <text
          x={denomStartX}
          y={denomCy + denomSize * 0.36}
          fontFamily={labelFamily}
          fontSize={denomSize}
          fontWeight={700}
          textAnchor="start"
          fill={ink}
        >
          {cfg.denomValue}
          {cfg.denomSymbol && (
            <tspan fontSize={denomSize * 0.52} dy={-denomSize * 0.3}>
              {cfg.denomSymbol}
            </tspan>
          )}
        </text>
    </g>
  ) : null;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...svgProps}
    >
      <StampDefs
        uid={uid}
        color={paper}
        duoShadow={cfg.duotoneShadow}
        duoHighlight={cfg.duotoneHighlight}
        screenPitch={Math.max(
          4,
          Math.min(w, h) * lerp(0.016, 0.007, cfg.inkStrength),
        )}
      />
      <defs>
        <clipPath id={outerClipId}>
          <path d={outline} />
        </clipPath>
        <clipPath id={clipId}>
          <path d={roundedRect(art.x, art.y, art.w, art.h, artRadius)} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${outerClipId})`}>
        <MaterialLayers
          uid={uid}
          material={cfg.material}
          color={paper}
          grain={cfg.grain}
          w={w}
          h={h}
        />

        {/* ---- printed content ---- */}
        <g filter={colorFilter}>
          <g clipPath={`url(#${clipId})`}>
            {cfg.image ? (
              <g transform={cropTransform}>
                <image
                  href={cfg.image}
                  x={art.x}
                  y={art.y}
                  width={art.w}
                  height={art.h}
                  preserveAspectRatio={
                    cfg.fit === "cover"
                      ? "xMidYMid slice"
                      : cfg.fit === "contain"
                        ? "xMidYMid meet"
                        : "none"
                  }
                />
              </g>
            ) : (
              <Engraving
                x={art.x}
                y={art.y}
                w={art.w}
                h={art.h}
                ink={ink}
                paper={ground}
                uid={uid}
              />
            )}

            {/* scrims keep overlaid lettering legible on any artwork */}
            {T?.scrim && (
              <>
                <rect
                  x={art.x}
                  y={art.y}
                  width={art.w}
                  height={art.h * 0.26}
                  fill={`url(#${uid}-scrimTop)`}
                />
                <rect
                  x={art.x}
                  y={art.y + art.h * 0.46}
                  width={art.w}
                  height={art.h * 0.54}
                  fill={`url(#${uid}-scrimBottom)`}
                />
              </>
            )}
          </g>
        </g>

        {/* ---- print screen ----
             Over the picture, under the rules and lettering: a press screens
             the image plate, not the text plate. */}
        {screenId && (
          <g clipPath={`url(#${clipId})`}>
            {/* a second screen at another angle; the interference is the rosette */}
            {cfg.inkTexture === "halftone" && (
              <rect
                x={art.x}
                y={art.y}
                width={art.w}
                height={art.h}
                fill={`url(#${uid}-halftone2)`}
                opacity={(0.25 + cfg.inkStrength * 0.5) * 0.6}
                style={{ mixBlendMode: screenBlend as never }}
              />
            )}
            <rect
              x={art.x}
              y={art.y}
              width={art.w}
              height={art.h}
              fill={`url(#${screenId})`}
              opacity={0.25 + cfg.inkStrength * 0.5}
              style={{ mixBlendMode: screenBlend as never }}
            />
          </g>
        )}

        {/* ---- rules and lettering, above the screen ---- */}
        <g filter={colorFilter}>
          {!T?.scrim && (
            <path
              d={roundedRect(art.x, art.y, art.w, art.h, artRadius)}
              fill="none"
              stroke={ink}
              strokeWidth={Math.max(0.8, aw * 0.0035)}
              opacity={0.85}
            />
          )}

          {/* frame rules */}
          {cfg.frame !== "none" && (
            <g fill="none" stroke={cfg.frameColor}>
              <path
                d={roundedRect(cx, cy, cw, ch, radius)}
                strokeWidth={Math.max(1, cw * 0.006)}
              />
              {cfg.frame === "double" && (
                <path
                  d={roundedRect(
                    cx + cw * 0.026,
                    cy + ch * 0.026,
                    cw * 0.948,
                    ch * 0.948,
                    Math.max(0, radius - cw * 0.02),
                  )}
                  strokeWidth={Math.max(0.6, cw * 0.0022)}
                />
              )}
            </g>
          )}

        </g>

        {/* The lettering is its own pass, so its colour filter can differ from
            the artwork's — see typeColorFilter. */}
        <g filter={typeColorFilter}>
          {/* misregistration: the second pass never lands on the first */}
          {Typography && cfg.inkTexture !== "flat" && (
            <g
              transform={`translate(${(w * 0.0018).toFixed(2)} ${(-h * 0.0014).toFixed(2)})`}
              opacity={0.09 + cfg.inkStrength * 0.07}
              style={{ mixBlendMode: "multiply" }}
              filter={typographyFilter}
            >
              {Typography}
            </g>
          )}
          {Typography && <g filter={typographyFilter}>{Typography}</g>}

          {/* Once only — see the note on Denomination. */}
          {Denomination && <g filter={typographyFilter}>{Denomination}</g>}
        </g>

        {/* ---- stitching ----
             Four passes: pressed seam, contact shadow, thread body, highlight.
             A thread is a round cord on a surface, not a painted line. */}
        {stitches.length > 0 && (
          <g strokeLinecap="round" fill="none">
            {/* the seam line the needle has pulled tight */}
            {stitches.map((s, i) => (
              <path
                key={`sm${i}`}
                d={s.d}
                stroke="#000000"
                strokeOpacity={0.22}
                strokeWidth={Math.min(cw, ch) * 0.015}
              />
            ))}
            {/* contact shadow, offset down-right under the cord */}
            {stitches.map((s, i) => (
              <path
                key={`sh${i}`}
                d={s.d}
                stroke="#000000"
                strokeOpacity={0.4}
                strokeWidth={Math.min(cw, ch) * 0.0105}
                transform={`translate(${(cw * 0.0022).toFixed(2)} ${(ch * 0.0022).toFixed(2)})`}
              />
            ))}
            {/* the thread itself */}
            {stitches.map((s, i) => (
              <path
                key={`st${i}`}
                d={s.d}
                stroke={cfg.stitchColor}
                strokeWidth={Math.min(cw, ch) * 0.0092}
                opacity={0.95}
              />
            ))}
            {/* and the light running along the top of the cord */}
            {stitches.map((s, i) => (
              <path
                key={`sl${i}`}
                d={s.d}
                stroke={lighten(cfg.stitchColor, 0.45)}
                strokeOpacity={0.5}
                strokeWidth={Math.min(cw, ch) * 0.0032}
                transform={`translate(${(-cw * 0.0011).toFixed(2)} ${(-ch * 0.0011).toFixed(2)})`}
              />
            ))}
          </g>
        )}

        {/* ---- cancellation, struck after printing ---- */}
        {cfg.postmark && (
          <Postmark
            cx={art.x + art.w * 0.29}
            cy={art.y + art.h * 0.3}
            r={Math.min(art.w, art.h) * 0.215}
            town={cfg.postmarkText}
            date={cfg.year || "  "}
            color={darken(ink, 0.62)}
            opacity={cfg.postmarkOpacity}
            rotation={cfg.postmarkRotation}
            family={labelFamily}
            uid={uid}
          />
        )}

        {/* ---- age ----
             Over the printing, not under it — a stamp ages after it is printed.
             Four signals, because "old" is not "faded". */}
        {cfg.wear > 0.001 && (
          <g>
            {/* the sheet yellows all over */}
            <rect
              x={0}
              y={0}
              width={w}
              height={h}
              fill="#c9a86a"
              opacity={cfg.wear * 0.22}
              style={{ mixBlendMode: "multiply" }}
            />
            {/* foxing: the brown blooms damp paper develops with age */}
            <rect
              x={0}
              y={0}
              width={w}
              height={h}
              fill="#ffffff"
              opacity={cfg.wear * 0.72}
              filter={`url(#${uid}-foxing)`}
              style={{ mixBlendMode: "multiply" }}
            />
            {/* handling grime, worked in from the edges */}
            <rect
              x={0}
              y={0}
              width={w}
              height={h}
              fill={`url(#${uid}-grime)`}
              opacity={cfg.wear * 0.52}
              style={{ mixBlendMode: "multiply" }}
            />
            {/* and ink lifted off in flecks, painted back in stock colour */}
            <rect
              x={0}
              y={0}
              width={w}
              height={h}
              fill={lighten(paper, 0.22)}
              opacity={cfg.wear * 0.38}
              filter={`url(#${uid}-rub)`}
            />
          </g>
        )}

        {/* ---- finish: what the surface does with light. Matte lifts the
             blacks, gloss deepens them and returns a specular. ---- */}
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          fill={`url(#${uid}-sheen)`}
          opacity={
            cfg.finish === "matte" || cfg.finish === "gloss"
              ? 0.06
              : cfg.material === "holo"
                ? 0.35
                : 0.45
          }
          style={{ mixBlendMode: "soft-light" }}
        />

        {cfg.finish === "matte" && (
          <>
            {/* the veil that lifts the blacks — the actual signature of matte */}
            <rect
              x={0}
              y={0}
              width={w}
              height={h}
              fill={`url(#${uid}-matte)`}
              style={{ mixBlendMode: "screen" }}
            />
            {/* and the micro-diffusion that scatters what little light returns */}
            <rect
              x={0}
              y={0}
              width={w}
              height={h}
              fill="#ffffff"
              opacity={0.16}
              filter={`url(#${uid}-grain)`}
              style={{ mixBlendMode: "overlay" }}
            />
          </>
        )}

        {/* Gloss: varnish over the printed area only. The boundary between wet
            picture and dry sheet is what sells it. */}
        {cfg.finish === "gloss" && (
          <>
            <rect
              x={0}
              y={0}
              width={w}
              height={h}
              fill={`url(#${uid}-matte)`}
              opacity={0.85}
              style={{ mixBlendMode: "screen" }}
            />
            <g clipPath={`url(#${clipId})`}>
              <rect
                x={art.x}
                y={art.y}
                width={art.w}
                height={art.h}
                fill={`url(#${uid}-glossDeep)`}
                opacity={0.55}
                style={{ mixBlendMode: "multiply" }}
              />
              <rect
                x={art.x}
                y={art.y}
                width={art.w}
                height={art.h}
                fill={`url(#${uid}-gloss)`}
                opacity={0.5}
                style={{ mixBlendMode: "screen" }}
              />
              {/* the raised lip where the varnish stops */}
              <path
                d={roundedRect(art.x, art.y, art.w, art.h, artRadius)}
                fill="none"
                stroke="#ffffff"
                strokeOpacity={0.28}
                strokeWidth={Math.max(0.8, aw * 0.004)}
                style={{ mixBlendMode: "screen" }}
              />
            </g>
          </>
        )}

        {/* ---- the cut edge: light catches the tooth, dark sits under it ---- */}
        <path
          d={outline}
          fill="none"
          stroke={rgbaOf(lighten(paper, 0.7), 0.5)}
          strokeWidth={Math.min(w, h) * 0.0035}
        />
        <path
          d={outline}
          fill="none"
          stroke={rgbaOf(darken(paper, 0.7), 0.32)}
          strokeWidth={Math.min(w, h) * 0.0014}
          transform={`translate(0 ${(Math.min(w, h) * 0.002).toFixed(2)})`}
        />
      </g>
    </svg>
  );
});
