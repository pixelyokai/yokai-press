"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { StampArt, stampDims } from "./stamp/StampArt";
import { perforationPath } from "@/lib/perforation";
import { usePaperDrift } from "@/hooks/usePaperDrift";
import type { StampConfig } from "@/lib/types";

export const Stage = forwardRef<
  SVGSVGElement,
  { cfg: StampConfig; uid: string; fontTick: number }
>(function Stage({ cfg, uid, fontTick }, forwardedRef) {
  const holder = useRef<HTMLDivElement>(null);

  /* Laid out from measured glyph widths, which the server cannot do — and it
     keeps a large SVG out of the server HTML and out of hydration. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const setSvg = useCallback(
    (node: SVGSVGElement | null) => {
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  usePaperDrift(cfg.physics, holder);

  const { w, h } = stampDims(cfg);

  /* the scale control runs 60%..140% of the natural preview size */
  const zoom = 0.6 + cfg.scale * 0.8;

  /* The shadow is cast by the outline, not the artwork, so it lives on its own
     static layer — a drop-shadow on the plate re-rasterises every frame. */
  const outline = useMemo(
    () => perforationPath(w, h, { style: cfg.perfStyle, size: cfg.perfSize, radius: cfg.perfRadius }),
    [w, h, cfg.perfStyle, cfg.perfSize, cfg.perfRadius],
  );

  return (
    <div className="orb">
      <div
        className="stamp-tilt"
        style={{ transform: `rotate(${cfg.rotation}deg) scale(${zoom})` }}
      >
        <div
          ref={holder}
          className="stamp-holder"
          style={{
            ["--lift-y" as string]: `${(2 + cfg.lift * 16).toFixed(1)}px`,
            ["--lift-blur" as string]: `${(8 + cfg.lift * 44).toFixed(1)}px`,
            ["--lift-alpha" as string]: (0.05 + cfg.lift * 0.09).toFixed(3),
          }}
        >
          {/* Three passes: one blur has a hard falloff edge and reads as a
              cutout. All static, so the stack costs one rasterisation. */}
          <svg
            className="stamp-shadow"
            viewBox={`0 0 ${w} ${h}`}
            width={w}
            height={h}
            aria-hidden
            focusable="false"
          >
            <path d={outline} fill="#181410" opacity={0.5} />
            <path
              d={outline}
              fill="#181410"
              opacity={0.32}
              style={{ filter: "blur(6px)" }}
            />
            <path
              d={outline}
              fill="#181410"
              opacity={0.26}
              style={{ filter: "blur(18px)" }}
            />
          </svg>

          {mounted && (
            <StampArt
              cfg={cfg}
              uid={uid}
              fontTick={fontTick}
              svgProps={{ ref: setSvg, width: w, height: h }}
            />
          )}
        </div>
      </div>
    </div>
  );
});
