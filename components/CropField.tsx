"use client";

import { useEffect, useRef, useState } from "react";
import type { FitMode } from "@/lib/types";

/**
 * Drag to reframe, scroll to push in. Framed against the printed area's real
 * aspect and reproducing the plate's fit rule, so preview and plate agree.
 */
export function CropField({
  src,
  zoom,
  x,
  y,
  aspect,
  fit,
  onChange,
}: {
  src: string;
  zoom: number;
  x: number;
  y: number;
  /** width / height of the printed area the artwork lands in */
  aspect: number;
  fit: FitMode;
  onChange: (v: { cropZoom?: number; cropX?: number; cropY?: number }) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const from = useRef({ px: 0, py: 0, x: 0, y: 0 });

  const limit = (n: number) => Math.max(-1, Math.min(1, n));

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    from.current = { px: e.clientX, py: e.clientY, x, y };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    onChange({
      cropX: limit(from.current.x + (e.clientX - from.current.px) / r.width),
      cropY: limit(from.current.y + (e.clientY - from.current.py) / r.height),
    });
  };

  const stop = () => setDragging(false);

  /* A wheel listener has to be non-passive to stop the panel scrolling under
     it, and React attaches passive wheel handlers — so bind it directly. */
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const next = zoom + (e.deltaY < 0 ? 0.1 : -0.1);
      onChange({ cropZoom: Math.max(1, Math.min(4, Number(next.toFixed(3)))) });
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [zoom, onChange]);

  return (
    <>
      <div
        className="crop"
        ref={box}
        data-drag={dragging}
        style={{
          aspectRatio: String(aspect),
          maxWidth: `${Math.round(Math.min(260, 190 * aspect))}px`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stop}
        onPointerCancel={stop}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Artwork placement"
          draggable={false}
          style={{
            objectFit:
              fit === "cover" ? "cover" : fit === "contain" ? "contain" : "fill",
            transform: `translate(${(x * 100).toFixed(3)}%, ${(y * 100).toFixed(3)}%) scale(${zoom})`,
          }}
        />
        <span className="crop-frame" />
      </div>
      <p className="section-note">Drag to reframe, scroll to push in.</p>
    </>
  );
}
