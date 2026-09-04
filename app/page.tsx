"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Stage } from "@/components/Stage";
import { Toolbar, type TabId } from "@/components/Toolbar";
import { Toasts, useToasts } from "@/components/Toasts";
import {
  DEFAULT_CONFIG,
  DISPLAY_FONTS,
  FONT_FILES,
  MATERIALS,
  duotoneFor,
} from "@/lib/presets";
import { exportStamp } from "@/lib/export";
import { stampDims } from "@/components/stamp/StampArt";
import { clearMeasureCache } from "@/lib/measure";
import type { StampConfig } from "@/lib/types";

type Theme = "light" | "dark";

export default function Page() {
  const [cfg, setCfg] = useState<StampConfig>(DEFAULT_CONFIG);
  const [tab, setTab] = useState<TabId>("shape");
  const [theme, setTheme] = useState<Theme>("light");
  const [exporting, setExporting] = useState(false);
  const [fontTick, setFontTick] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const { toasts, push } = useToasts();

  /* A patch that changes nothing returns the same object, so React bails out.
     Controls echo their own value back constantly during a drag. */
  const set = useCallback((p: Partial<StampConfig>) => {
    setCfg((c) => {
      let changed = false;
      for (const k of Object.keys(p) as (keyof StampConfig)[]) {
        if (!Object.is(c[k], p[k])) {
          changed = true;
          break;
        }
      }
      return changed ? { ...c, ...p } : c;
    });
  }, []);

  /* The blocking script in <head> has already settled this; adopt its answer
     rather than resolving it a second time. Reading the DOM is what keeps the
     two in step — deriving it again here is how they drift apart. */
  useEffect(() => {
    const settled = document.documentElement.dataset.theme;
    if (settled === "light" || settled === "dark") setTheme(settled);
  }, []);

  /* Only a deliberate switch is written down. Persisting on every render
     would record the SSR default as if it were a choice. */
  const switchTheme = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("stampy-theme", next);
      } catch {
        /* private mode — the theme just will not persist */
      }
      return next;
    });
  }, []);

  /* Text is laid out from measured glyph widths, so the two faces in play have
     to be resident before the measurement is trusted. Only those two are
     loaded — waiting on document.fonts.ready would block on all eight. */
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) return;
    let alive = true;
    const faces = [
      `700 100px "${FONT_FILES[cfg.displayFont].family}"`,
      `400 100px "${FONT_FILES[cfg.labelFont].family}"`,
    ];
    Promise.all(faces.map((f) => document.fonts.load(f).catch(() => null))).then(
      () => {
        if (!alive) return;
        clearMeasureCache();
        setFontTick((t) => t + 1);
      },
    );
    return () => {
      alive = false;
    };
  }, [cfg.displayFont, cfg.labelFont]);

  const onExport = useCallback(async () => {
    if (!svgRef.current) return;
    setExporting(true);
    try {
      await exportStamp(svgRef.current, cfg, stampDims(cfg));
    } catch (err) {
      console.error(err);
      push("Export failed", "See the console for details.");
    } finally {
      setExporting(false);
    }
  }, [cfg, push]);

  const shuffle = useCallback(() => {
    const m = MATERIALS[Math.floor(Math.random() * MATERIALS.length)];
    const f = DISPLAY_FONTS[Math.floor(Math.random() * DISPLAY_FONTS.length)];
    set({
      material: m.id,
      materialColor: m.base,
      inkColor: m.ink,
      frameColor: m.ink,
      ...duotoneFor(m.base, m.ink),
      displayFont: f.id,
      perfStyle: (["classic", "deep", "fine", "die"] as const)[
        Math.floor(Math.random() * 4)
      ],
      perfSize: 0.2 + Math.random() * 0.6,
    });
    /* Shuffle redesigns the stamp, not how it is staged. Rotation, lift and
       scale are how the user has chosen to present it — rolling those too
       means every shuffle undoes their framing. */
  }, [set]);

  const reset = useCallback(() => {
    setCfg(DEFAULT_CONFIG);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /input|textarea|select/i.test(t.tagName)) return;
      if (e.key === "p") set({ physics: !cfg.physics });
      if (e.key === "e" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void onExport();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cfg.physics, set, onExport]);

  return (
    <main className="app">
      {/* The page is only a ground. Canvas and panel both sit inside one
          inset container, which is what separates the two surfaces in dark
          theme — page, container, panel — rather than one flat black field. */}
      <div className="frame">
        <div className="canvas">
          <header className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="logo-light" src="/brand/logo-light.png" alt="Yokai Press" width={520} height={96} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="logo-dark" src="/brand/logo-dark.png" alt="" aria-hidden width={520} height={96} />
          </header>
          <Stage cfg={cfg} uid="stamp" fontTick={fontTick} ref={svgRef} />
        </div>

        <Toolbar
          cfg={cfg}
          set={set}
          tab={tab}
          onTab={setTab}
          theme={theme}
          onTheme={switchTheme}
          onExport={onExport}
          onReset={reset}
          onShuffle={shuffle}
          exporting={exporting}
        />
      </div>

      <Toasts items={toasts} />
    </main>
  );
}
