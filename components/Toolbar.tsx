"use client";

import {
  memo,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Lenis from "lenis";
import {
  ImageDrop,
  Pills,
  Reveal,
  Rule,
  Section,
  Select,
  Slider,
  Swatch,
  TextArea,
  TextInput,
  Tip,
  ToggleRow,
} from "./ui";
import { CropField } from "./CropField";
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconContent,
  IconDownload,
  IconFrame,
  IconGithub,
  IconInk,
  IconMaterial,
  IconMoon,
  IconReset,
  IconShape,
  IconShuffle,
  IconSun,
  IconTrash,
  IconView,
  IconX,
} from "./icons";
import { MaterialLayers, StampDefs } from "./stamp/defs";
import {
  ASPECTS,
  DISPLAY_FONTS,
  FINISHES,
  FONT_FILES,
  LABEL_FONTS,
  MATERIALS,
  TEXT_LAYOUTS,
  TEXT_LIMITS,
  CURRENCIES,
  duotoneFor,
  materialMeta,
} from "@/lib/presets";
import { computeLayout } from "@/lib/layout";
import { autoInk } from "@/lib/color";
import { materialInkGround } from "./stamp/defs";
import type { Align, StampConfig } from "@/lib/types";

export type TabId = "shape" | "material" | "frame" | "content" | "ink" | "view";

const TABS: { id: TabId; label: string; icon: () => React.ReactElement }[] = [
  { id: "shape", label: "Shape", icon: IconShape },
  { id: "material", label: "Material", icon: IconMaterial },
  { id: "frame", label: "Frame", icon: IconFrame },
  { id: "content", label: "Content", icon: IconContent },
  { id: "ink", label: "Ink", icon: IconInk },
  { id: "view", label: "View", icon: IconView },
];

type Patch = (p: Partial<StampConfig>) => void;

const pct = (n: number) => `${Math.round(n * 100)}%`;
const deg = (n: number) => `${Math.round(n)}°`;
const num = (n: number) => n.toFixed(2);
const count = (value: string, max: number) => `${value.length}/${max}`;

/** What the plate's ink resolves to, so an unset colour swatch shows the
    colour actually in use rather than a placeholder. */
const resolvedInk = (cfg: StampConfig) =>
  cfg.autoContrast
    ? autoInk(materialInkGround(cfg.material, cfg.materialColor))
    : cfg.inkColor;

export function Toolbar({
  cfg,
  set,
  tab,
  onTab,
  theme,
  onTheme,
  onExport,
  onReset,
  onShuffle,
  exporting,
}: {
  cfg: StampConfig;
  set: Patch;
  tab: TabId;
  onTab: (t: TabId) => void;
  theme: "light" | "dark";
  onTheme: () => void;
  onExport: () => void;
  onReset: () => void;
  onShuffle: () => void;
  exporting: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [chip, setChip] = useState({ x: 0, w: 0 });
  const [seen, setSeen] = useState<Set<TabId>>(() => new Set([tab]));

  useEffect(() => {
    setSeen((s) => (s.has(tab) ? s : new Set(s).add(tab)));
  }, [tab]);

  /* Lenis smooths the panel's own scroll; the page never scrolls. */
  useEffect(() => {
    const wrapper = scrollRef.current;
    const content = bodyRef.current;
    if (!wrapper || !content) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      wrapper,
      content,
      duration: 0.8,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      syncTouch: false,
    });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  /* Measure the active tab so a single chip can slide to it. Layout effect,
     so the chip is already in place on the frame the tab changes. */
  useLayoutEffect(() => {
    const measure = () => {
      const host = tabsRef.current;
      if (!host) return;
      const el = host.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!el) return;
      setChip({ x: el.offsetLeft, w: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (tabsRef.current) ro.observe(tabsRef.current);
    return () => ro.disconnect();
  }, [tab]);

  return (
    <div className="panel-slot">
      <aside className="panel">
        <div className="panel-head">
          <div className="panel-actions">
            <div className="panel-actions-left">
              <Tip label={theme === "dark" ? "Light mode" : "Dark mode"}>
                <button
                  type="button"
                  className="icon-btn"
                  data-theme-toggle={theme}
                  onClick={onTheme}
                  aria-label="Toggle theme"
                >
                  <span className="glyph">
                    {theme === "dark" ? <IconMoon /> : <IconSun />}
                  </span>
                </button>
              </Tip>
              <Tip label="Reset">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={onReset}
                  aria-label="Reset every property"
                >
                  <IconReset />
                </button>
              </Tip>
              <Tip label="Shuffle">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={onShuffle}
                  aria-label="Shuffle"
                >
                  <IconShuffle />
                </button>
              </Tip>
            </div>
            <div className="panel-actions-right">
              <div className="icon-group">
                <a
                  className="icon-btn"
                  href="https://x.com/pixelyokai"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X"
                >
                  <IconX />
                </a>
                <a
                  className="icon-btn"
                  href="https://github.com/pixelyokai/yokai-press"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <IconGithub />
                </a>
              </div>
              <button
                type="button"
                className="export-btn"
                onClick={onExport}
                disabled={exporting}
              >
                <IconDownload />
                {exporting ? "Rendering…" : "Download"}
              </button>
            </div>
          </div>

          <div className="tabs" role="tablist" ref={tabsRef}>
            <span
              className="tab-chip"
              style={{
                ["--chip-x" as string]: `${chip.x}px`,
                ["--chip-w" as string]: `${chip.w}px`,
              }}
            />
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                className="tab"
                aria-selected={tab === t.id}
                aria-label={t.label}
                onClick={() => onTab(t.id)}
              >
                <t.icon />
                {tab === t.id && <span className="tab-label">{t.label}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-body" ref={scrollRef}>
          <div ref={bodyRef}>
            {/* A pane is built on its first visit and then kept. Material costs
                about 120ms to mount — it builds a full filter set per swatch —
                and paying that on every visit is what the tab delay was. */}
            {PANES.map(({ id, Pane }) =>
              seen.has(id) ? (
                <div key={id} className="panel-pane" hidden={tab !== id}>
                  <Pane cfg={cfg} set={set} />
                </div>
              ) : null,
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ shape */

const ShapePane = memo(function ShapePane({
  cfg,
  set,
}: {
  cfg: StampConfig;
  set: Patch;
}) {
  return (
    <>
      <Section label="Aspect ratio">
        <Pills
          options={ASPECTS.map((a) => ({ id: a.id, label: a.name }))}
          value={cfg.aspect}
          onChange={(aspect) => set({ aspect })}
        />
      </Section>
      <Rule />
      <Section label="Style">
        <Pills
          options={[
            { id: "classic" as const, label: "Classic" },
            { id: "deep" as const, label: "Deep cut" },
            { id: "fine" as const, label: "Fine" },
            { id: "die" as const, label: "Clean die-cut" },
          ]}
          value={cfg.perfStyle}
          onChange={(perfStyle) => set({ perfStyle })}
        />
      </Section>
      <Rule />
      <Section label="Perforation">
        <Slider
          label="Perforation"
          value={cfg.perfSize}
          format={num}
          onChange={(perfSize) => set({ perfSize })}
        />
      </Section>
      <Section label="Perforation radius">
        <Slider
          label="Perforation radius"
          value={cfg.perfRadius}
          format={num}
          onChange={(perfRadius) => set({ perfRadius })}
        />
      </Section>
      <Rule />
      <Section label="Corner radius" tight>
        <Slider
          label="Corner radius"
          value={cfg.cornerRadius}
          format={num}
          onChange={(cornerRadius) => set({ cornerRadius })}
        />
      </Section>
    </>
  );
});

/* --------------------------------------------------------------- material */

/* Its props are constants from the material table, so this never needs to
   render twice — and each one builds a full filter set, which is expensive
   enough that re-rendering the eight of them was the panel's worst stall. */
const MaterialSwatch = memo(function MaterialSwatch({
  id,
  color,
}: {
  id: StampConfig["material"];
  color: string;
}) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 200 78" preserveAspectRatio="none" aria-hidden>
      <StampDefs
        uid={uid}
        color={color}
        duoShadow="#111111"
        duoHighlight={color}
        screenPitch={6}
      />
      <MaterialLayers
        uid={uid}
        material={id}
        color={color}
        grain={0.7}
        w={200}
        h={78}
      />
    </svg>
  );
});

const MaterialPane = memo(function MaterialPane({
  cfg,
  set,
}: {
  cfg: StampConfig;
  set: Patch;
}) {
  const meta = materialMeta(cfg.material);
  return (
    <>
      <Section label="Material">
        <div className="mat-grid">
          {MATERIALS.map((m) => (
            <button
              key={m.id}
              type="button"
              className="mat-tile"
              aria-pressed={cfg.material === m.id}
              onClick={() =>
                set({
                  material: m.id,
                  materialColor: m.base,
                  inkColor: m.ink,
                  frameColor: m.ink,
                  ...duotoneFor(m.base, m.ink),
                })
              }
            >
              <MaterialSwatch id={m.id} color={m.base} />
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      </Section>
      <Rule />
      <Section label="Effect">
        <Pills
          options={FINISHES.map((f) => ({ id: f.id, label: f.name }))}
          value={cfg.finish}
          onChange={(finish) => set({ finish })}
        />
      </Section>
      <Rule />
      <Section label="Base colour">
        <div className="field">
          <Swatch
            value={cfg.materialColor}
            onChange={(materialColor) => set({ materialColor })}
          />
        </div>
      </Section>
      <Rule />
      <Section tight>
        <Slider
          inline
          label="Grain intensity"
          value={cfg.grain}
          format={num}
          onChange={(grain) => set({ grain })}
        />
      </Section>
      <Section tight>
        <Slider
          inline
          label="Age"
          value={cfg.wear}
          format={num}
          onChange={(wear) => set({ wear })}
        />
      </Section>
      {meta.stitchable && (
        <>
          <Rule />
          <ToggleRow
            on={cfg.stitch}
            onChange={(stitch) => set({ stitch })}
            label="Stitched border"
            note="Hand-run, uneven length and drift."
          />
          <Reveal open={cfg.stitch}>
            <Section label="Thread" tight>
              <div className="field">
                <Swatch
                  value={cfg.stitchColor}
                  onChange={(stitchColor) => set({ stitchColor })}
                />
              </div>
            </Section>
          </Reveal>
        </>
      )}
    </>
  );
});

/* ------------------------------------------------------------------ frame */

const FramePane = memo(function FramePane({
  cfg,
  set,
}: {
  cfg: StampConfig;
  set: Patch;
}) {
  const art = computeLayout(cfg).art;
  return (
    <>
      <Section label="Frame">
        <Pills
          options={[
            { id: "none" as const, label: "None" },
            { id: "thin" as const, label: "Thin line" },
            { id: "double" as const, label: "Double" },
          ]}
          value={cfg.frame}
          onChange={(frame) => set({ frame })}
        />
      </Section>
      {cfg.frame !== "none" && (
        <>
          <Rule />
          <Section label="Rule colour">
            <div className="field">
              <Swatch
                value={cfg.frameColor}
                onChange={(frameColor) => set({ frameColor })}
              />
            </div>
          </Section>
        </>
      )}
      <Rule />
      <Section label="Inner padding (Bleed)">
        <Slider
          label="Inner padding"
          value={cfg.padding}
          format={pct}
          onChange={(padding) => set({ padding })}
        />
        <p className="section-note">
          Distance from the printed area to the perforated edge.
        </p>
      </Section>
      <Rule />
      <Section label="Artwork">
        <ImageDrop
          hasImage={Boolean(cfg.image)}
          onChange={(image) => set({ image, cropZoom: 1, cropX: 0, cropY: 0 })}
        />

      </Section>
      {cfg.image && (
        <>
          <Rule dashed />
          <Section label="Crop" tight>
            <CropField
              src={cfg.image}
              zoom={cfg.cropZoom}
              x={cfg.cropX}
              y={cfg.cropY}
              aspect={art.w / art.h}
              fit={cfg.fit}
              onChange={set}
            />
            <div
              className="field-tight"
              style={{ paddingTop: 12, paddingBottom: 12 }}
            >
              <span className="pair-label">Fit</span>
              <Pills
                options={[
                  { id: "cover" as const, label: "Cover" },
                  { id: "contain" as const, label: "Contain" },
                  { id: "fill" as const, label: "Fill" },
                ]}
                value={cfg.fit}
                onChange={(fit) => set({ fit })}
              />
            </div>
            <div style={{ paddingTop: 12, paddingBottom: 8 }}>
              <Slider
                inline
                label="Zoom"
                value={cfg.cropZoom}
                min={1}
                max={4}
                step={0.01}
                format={(v) => `${v.toFixed(2)}×`}
                onChange={(cropZoom) => set({ cropZoom })}
              />
            </div>
          </Section>
          <Rule dashed />
          <Section tight>
            <div className="mini-row">
              <button
                type="button"
                className="mini"
                onClick={() => set({ cropZoom: 1, cropX: 0, cropY: 0 })}
              >
                <IconReset />
                Reset crop
              </button>
              <button
                type="button"
                className="mini danger"
                onClick={() =>
                  set({ image: null, cropZoom: 1, cropX: 0, cropY: 0 })
                }
              >
                <IconTrash />
                Remove artwork
              </button>
            </div>
          </Section>
        </>
      )}
    </>
  );
});

/* ---------------------------------------------------------------- content */

function AlignGroup({
  value,
  onChange,
  label,
}: {
  value: Align;
  onChange: (v: Align) => void;
  label: string;
}) {
  const items: { id: Align; icon: () => React.ReactElement; name: string }[] = [
    { id: "left", icon: IconAlignLeft, name: "Left" },
    { id: "center", icon: IconAlignCenter, name: "Centre" },
    { id: "right", icon: IconAlignRight, name: "Right" },
  ];
  return (
    <div>
      <span className="pair-label">{label}</span>
      <div className="align-group">
        {items.map((i) => (
          <button
            key={i.id}
            type="button"
            className="align-btn"
            aria-pressed={value === i.id}
            aria-label={`${label}: ${i.name}`}
            onClick={() => onChange(i.id)}
          >
            <i.icon />
          </button>
        ))}
      </div>
    </div>
  );
}

const ContentPane = memo(function ContentPane({
  cfg,
  set,
}: {
  cfg: StampConfig;
  set: Patch;
}) {
  return (
    <>
      <ToggleRow
        on={cfg.showText}
        onChange={(showText) => set({ showText })}
        label="Lettering"
        note="Type, denomination, and layout."
      />
      <Rule />

      <Reveal open={cfg.showText}>
        <>
          <Section label="Content placement">
            <Pills
              options={TEXT_LAYOUTS.map((l) => ({ id: l.id, label: l.name }))}
              value={cfg.textLayout}
              onChange={(textLayout) => set({ textLayout })}
            />
          </Section>
          <Rule dashed />

          <Section label="Alignment">
            <div className="pair" style={{ paddingTop: 8 }}>
              <AlignGroup
                label="Heading & caption"
                value={cfg.headlineAlign}
                onChange={(headlineAlign) => set({ headlineAlign })}
              />
              <AlignGroup
                label="Country line"
                value={cfg.labelAlign}
                onChange={(labelAlign) => set({ labelAlign })}
              />
            </div>
          </Section>
          <Rule />

          <Section label="Font properties">
            <div className="pair" style={{ paddingTop: 8 }}>
              <div>
                <span className="pair-label">Display font</span>
                <Select
                  ariaLabel="Display font"
                  value={cfg.displayFont}
                  options={DISPLAY_FONTS.map((f) => ({
                    id: f.id,
                    label: f.name,
                  }))}
                  optionStyle={(id) => ({
                    fontFamily: `"${FONT_FILES[id].family}", serif`,
                  })}
                  onChange={(displayFont) => set({ displayFont })}
                />
              </div>
              <div>
                <span className="pair-label">Label font</span>
                <Select
                  ariaLabel="Label font"
                  value={cfg.labelFont}
                  options={LABEL_FONTS.map((f) => ({ id: f.id, label: f.name }))}
                  optionStyle={(id) => ({
                    fontFamily: `"${FONT_FILES[id].family}", monospace`,
                  })}
                  onChange={(labelFont) => set({ labelFont })}
                />
              </div>
            </div>
            <div className="pair" style={{ paddingTop: 16 }}>
              <div>
                <span className="pair-label">Display colour</span>
                <Swatch
                  value={cfg.displayColor || resolvedInk(cfg)}
                  onChange={(displayColor) => set({ displayColor })}
                />
              </div>
              <div>
                <span className="pair-label">Label colour</span>
                <Swatch
                  value={cfg.labelColor || resolvedInk(cfg)}
                  onChange={(labelColor) => set({ labelColor })}
                />
              </div>
            </div>
          </Section>
          <Rule />

          <Section
            label="Heading"
            counter={count(cfg.headline, TEXT_LIMITS.headline)}
            tight
          >
            <div className="field">
              <TextInput
                value={cfg.headline}
                maxLength={TEXT_LIMITS.headline}
                placeholder="Northern Light"
                onChange={(headline) => set({ headline })}
              />
            </div>
          </Section>
          <Section
            label="Caption"
            counter={count(cfg.subtext, TEXT_LIMITS.subtext)}
            tight
          >
            <div className="field">
              <TextArea
                value={cfg.subtext}
                maxLength={TEXT_LIMITS.subtext}
                placeholder="One line per row"
                onChange={(subtext) => set({ subtext })}
              />
            </div>
          </Section>
          <Section
            label="Country"
            counter={count(cfg.country, TEXT_LIMITS.country)}
            tight
          >
            <div className="field">
              <TextInput
                value={cfg.country}
                maxLength={TEXT_LIMITS.country}
                onChange={(country) => set({ country })}
              />
            </div>
          </Section>
          <Section
            label="Second script"
            counter={count(cfg.countryAlt, TEXT_LIMITS.countryAlt)}
            tight
          >
            <div className="field">
              <TextInput
                value={cfg.countryAlt}
                maxLength={TEXT_LIMITS.countryAlt}
                placeholder="スタンピー共和国"
                onChange={(countryAlt) => set({ countryAlt })}
              />
            </div>
          </Section>
          <Section label="Year" counter={count(cfg.year, TEXT_LIMITS.year)}>
            <div className="field">
              <TextInput
                value={cfg.year}
                maxLength={TEXT_LIMITS.year}
                inputMode="numeric"
                onChange={(year) => set({ year: year.replace(/[^0-9]/g, "") })}
              />
            </div>
          </Section>
          <Rule />

          <ToggleRow
            on={Boolean(cfg.denomValue)}
            onChange={(on) => set({ denomValue: on ? "45" : "" })}
            label="Denomination"
            note="Display currency in a circle badge."
          />
          <Reveal open={Boolean(cfg.denomValue)}>
            <Section tight>
              <div className="pair">
                <div>
                  <span className="pair-label">Amount</span>
                  <TextInput
                    value={cfg.denomValue}
                    maxLength={TEXT_LIMITS.denomValue}
                    inputMode="numeric"
                    onChange={(denomValue) =>
                      set({ denomValue: denomValue.replace(/[^0-9.]/g, "") })
                    }
                  />
                </div>
                <div>
                  <span className="pair-label">Currency</span>
                  <Select
                    ariaLabel="Currency"
                    value={cfg.denomSymbol}
                    options={CURRENCIES.map((c) => ({ id: c, label: c }))}
                    onChange={(denomSymbol) => set({ denomSymbol })}
                  />
                </div>
              </div>
              <Pills
                options={[
                  { id: "tl" as const, label: "Top left" },
                  { id: "tr" as const, label: "Top right" },
                  { id: "bl" as const, label: "Bottom left" },
                  { id: "br" as const, label: "Bottom right" },
                ]}
                value={cfg.denomCorner}
                onChange={(denomCorner) => set({ denomCorner })}
              />
            </Section>
          </Reveal>
          <Rule />
        </>
      </Reveal>

      <ToggleRow
        on={cfg.postmark}
        onChange={(postmark) => set({ postmark })}
        label="Postmark"
        note="Dated circle with bars."
      />
      <Reveal open={cfg.postmark}>
        <>
          <Section
            label="Office name"
            counter={count(cfg.postmarkText, TEXT_LIMITS.postmarkText)}
            tight
          >
            <div className="field">
              <TextInput
                value={cfg.postmarkText}
                maxLength={TEXT_LIMITS.postmarkText}
                onChange={(postmarkText) => set({ postmarkText })}
              />
            </div>
          </Section>
          <Section label="Opacity" tight>
            <Slider
              label="Postmark opacity"
              value={cfg.postmarkOpacity}
              format={pct}
              onChange={(postmarkOpacity) => set({ postmarkOpacity })}
            />
          </Section>
          <Section label="Rotation" style={{ paddingBottom: 28 }}>
            <Slider
              label="Postmark rotation"
              value={cfg.postmarkRotation}
              min={-90}
              max={90}
              step={1}
              format={deg}
              onChange={(postmarkRotation) => set({ postmarkRotation })}
            />
          </Section>
        </>
      </Reveal>
    </>
  );
});

/* -------------------------------------------------------------------- ink */

const InkPane = memo(function InkPane({
  cfg,
  set,
}: {
  cfg: StampConfig;
  set: Patch;
}) {
  return (
    <>
      <Section label="Color mode">
        <Pills
          options={[
            { id: "full" as const, label: "Full colour" },
            { id: "duotone" as const, label: "Duotone" },
            { id: "mono" as const, label: "Mono" },
          ]}
          value={cfg.colorMode}
          onChange={(colorMode) => set({ colorMode })}
        />
      </Section>
      {cfg.colorMode === "duotone" && (
        <Section tight style={{ paddingTop: 4, paddingBottom: 20 }}>
          <div className="pair">
            <div>
              <span className="pair-label">Color #1</span>
              <Swatch
                value={cfg.duotoneShadow}
                onChange={(duotoneShadow) => set({ duotoneShadow })}
              />
            </div>
            <div>
              <span className="pair-label">Color #2</span>
              <Swatch
                value={cfg.duotoneHighlight}
                onChange={(duotoneHighlight) => set({ duotoneHighlight })}
              />
            </div>
          </div>
        </Section>
      )}
      <Rule />
      <Section label="Ink texture">
        <Pills
          options={[
            { id: "engraved" as const, label: "Engraved" },
            { id: "halftone" as const, label: "Halftone" },
            { id: "flat" as const, label: "Flat" },
          ]}
          value={cfg.inkTexture}
          onChange={(inkTexture) => set({ inkTexture })}
        />
      </Section>
      {cfg.inkTexture !== "flat" && (
        <>
          <Rule />
          <Section label="Screen strength">
            <Slider
              label="Screen strength"
              value={cfg.inkStrength}
              format={pct}
              onChange={(inkStrength) => set({ inkStrength })}
            />
            <p className="section-note">
              Screened ink also picks up a second pass a hair off register.
            </p>
          </Section>
        </>
      )}
      <Rule />
      <ToggleRow
        on={cfg.autoContrast}
        onChange={(autoContrast) => set({ autoContrast })}
        label="Auto-contrast ink"
        note="Reads the stock and picks a legible ink."
      />
      <Reveal open={!cfg.autoContrast}>
        <Section label="Ink colour" tight>
          <div className="field">
            <Swatch
              value={cfg.inkColor}
              onChange={(inkColor) => set({ inkColor })}
            />
          </div>
        </Section>
      </Reveal>
    </>
  );
});

/* ------------------------------------------------------------------- view */

const ViewPane = memo(function ViewPane({
  cfg,
  set,
}: {
  cfg: StampConfig;
  set: Patch;
}) {
  return (
    <>
      <ToggleRow
        on={cfg.physics}
        onChange={(physics) => set({ physics })}
        label="Paper physics"
        note="Only for preview purposes."
      />
      <Rule />
      <Section label="Scale" tight>
        <Slider
          label="Scale"
          value={cfg.scale}
          format={pct}
          onChange={(scale) => set({ scale })}
        />
      </Section>
      <Section label="Rotation" tight>
        <Slider
          label="Rotation"
          value={cfg.rotation}
          min={-20}
          max={20}
          step={0.5}
          format={deg}
          onChange={(rotation) => set({ rotation })}
        />
      </Section>
      <Section label="Lift off the surface">
        <Slider
          label="Lift"
          value={cfg.lift}
          format={pct}
          onChange={(lift) => set({ lift })}
        />
      </Section>
      <Rule />
      <Section>
        <p className="section-note" style={{ paddingLeft: 0 }}>
          All of the above settings are only for preview purposes. Final export
          is a clean stamp image.
        </p>
      </Section>
    </>
  );
});

/* Declared after the panes so each is defined by the time this runs. */
const PANES: {
  id: TabId;
  Pane: React.ComponentType<{ cfg: StampConfig; set: Patch }>;
}[] = [
  { id: "shape", Pane: ShapePane },
  { id: "material", Pane: MaterialPane },
  { id: "frame", Pane: FramePane },
  { id: "content", Pane: ContentPane },
  { id: "ink", Pane: InkPane },
  { id: "view", Pane: ViewPane },
];
