# Yokai Press

*(working directory: `Stampy`)*

A postage stamp design tool. Pick a format and perforation, choose the stock,
set the content and typography, then export a PNG or SVG.

```bash
npm install
npm run dev      # http://localhost:3000
```

## How it renders

The stamp is **one inline SVG** — not a stack of DOM elements. That single
source drives the preview, the SVG export, and the PNG (which is that same SVG
rasterised onto a canvas), so what you see is what comes out of the file.

### Materials

Every stock is a stack of layers over a base colour, never a single gradient:

| Layer | How it is made |
| --- | --- |
| Base | `background-color` equivalent — a flat fill under everything |
| Texture | `feTurbulence` run through `feDiffuseLighting`, so the grain has actual relief rather than being a printed picture of grain |
| Blend | each layer composited with `multiply` / `overlay` / `soft-light` |
| Sheen | a directional gradient in `soft-light` on top |

- **Leather** uses two lit turbulence passes — coarse pores over fine grain.
- **Denim** crosses a warp and a weft relief pass, then adds vertical slub and
  a twill pattern.
- **Holographic** tiles the spectrum 2.5× across the sheet (foil diffracts more
  than once), darkens the troughs, and rides a specular band. Its angle comes
  from the same tilt value the physics toggle produces — one source, not two.
- **Denim and leather** get a stitched border built from individually jittered
  SVG segments; a uniform `border-style: dashed` does not read as sewing.

### Artwork

With no upload, the plate falls back to a generated engraving: a ruled sky whose
line weight tapers to the horizon (tone built from line, not from a gradient
fill), aurora curtains cut as reserved striations, a hatched back range against a
solid front range, and a broken dash screen on the water. Line weights come from
a fixed set of four, the way an engraver works from a few burins.

### Print texture

Ink is screened through a halftone dot or an engraver's ruling drawn in the
stock's own colour, so it works on dark stock as well as light. Type gets a
turbulence displacement and a second pass offset a hair off register — the
misprint that says a press was involved.

### Perforation

`lib/perforation.ts` walks the outline clockwise and cuts each scallop with an
arc, so every bite lands inside the sheet. The comb punches the corners too — a
real comb does not stop short and round the corner off — so each corner carries
a hole of its own — sized to the bite depth, so a deep cut leaves no spike
standing on the corner — and the edge runs start one of those in from each end.
An arc gives its radii on the x and y axes rather than along the direction of
travel, so which radius carries the depth flips between the horizontal and
vertical edges; getting that wrong stretches the bite sideways on the left and
right and the four sides stop matching. Tooth size and placement carry a small
seeded jitter; a perforating comb is not a grid.

### Layout

One rule decides where the artwork sits and where every line lands, so changing
the arrangement — caption below, caption above, full-bleed overlay, or a side
column — moves the picture with the type. Turning lettering off hands the whole
printed area to the artwork. Every line is fitted to the column it lives in, so
a long country name or a narrow side column cannot run off the plate.

### Paper physics

A `requestAnimationFrame` loop on a sine drift (a few degrees of `rotateX` /
`rotateY`), a matching shadow offset, and a cursor-proximity skew. No physics
library, no canvas simulation, and it respects `prefers-reduced-motion`.

Chrome re-rasterises a filtered SVG on every frame of a 3D transform, which held
the drift at ten frames a second. Nothing in the artwork moves while it drifts,
so the plate is baked to a bitmap once — through the same pipeline as the
export — and the transform runs on that. The drift waits for the bake rather
than stuttering against the live SVG. Measured 60fps.

## Project layout

```
app/                page shell, global styles
components/
  stamp/            the SVG renderer: defs (materials, filters), engraving,
                    postmark, and the assembly in StampArt.tsx
  Toolbar.tsx       tab rail + property panel (Lenis-scrolled)
  Stage.tsx         the desk, drift wrapper, presentation transforms
  ui.tsx            control primitives
hooks/              usePaperDrift
lib/                geometry, colour, measurement, presets, export
public/fonts/       self-hosted woff2 (they get inlined into exports)
```

## Notes on the brief

- **Lenis** scrolls the property panel.
- The UI is built to the Paper file `Stampy`: light and dark themes, the
  floating panel, the six-tab bar, and the mobile bottom sheet. The CSS token
  layer at the top of `app/globals.css` mirrors that file's tokens, so a value
  can be traced from the design to the app without a translation step.
- Motion is hand-rolled CSS; no animation runtime is installed. Two curves do
  all the work — one that settles, one that overshoots slightly.

## Shortcuts

- `P` — toggle paper physics
- `Cmd/Ctrl + E` — export

## Performance notes

- The plate is drawn on the client only. It is laid out from measured glyph
  widths, which the server cannot do, and keeping a large SVG out of the server
  HTML removes it from hydration as well.
- Only the two faces the current stamp uses are loaded and measured; waiting on
  `document.fonts.ready` would block on all eight.
- Nothing in the artwork reads the pointer, so a frame of drift costs no React
  work — the tilt is written straight to the node's style.
- `StampArt` and the generated engraving are memoised; a control change repaints
  in about 50ms.
