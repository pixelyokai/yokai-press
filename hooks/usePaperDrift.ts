"use client";

import { useEffect } from "react";

/**
 * The sheet reacts to the cursor and nothing else: every term is scaled by
 * `near`, so at rest the transform is static and the filters stay rasterised.
 *
 * The rotation is 3D on purpose — Chrome composites the filtered plate as a
 * texture, where a 2D transform re-runs every filter each frame (25fps vs 60).
 */
export function usePaperDrift(
  enabled: boolean,
  el: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const node = el.current;
    if (!node) return;

    const clear = () => {
      node.style.transform = "";
      node.style.removeProperty("--shade-x");
      node.style.removeProperty("--shade-y");
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!enabled || reduced) {
      clear();
      return;
    }

    let raf = 0;
    const start = performance.now();
    let want = 0;
    let near = 0;
    let px = 0;
    let py = 0;
    let settled = false;

    const onMove = (e: PointerEvent) => {
      const r = node.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      px = dx;
      py = dy;
      // 1 over the plate, tapering to 0 about a stamp width away
      want = Math.max(0, 1 - Math.hypot(dx, dy) / 2.4);
    };
    const onLeave = () => {
      want = 0;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      near += (want - near) * 0.08;

      if (near < 0.002) {
        /* written once, then left alone so the plate stays rasterised */
        if (!settled) {
          settled = true;
          node.style.transform = "perspective(1200px)";
          node.style.setProperty("--shade-x", "0px");
          node.style.setProperty("--shade-y", "0px");
        }
        return;
      }
      settled = false;

      const t = (now - start) / 1000;
      /* a slow breath under the pointer term, so a held cursor stays alive */
      const rx = (Math.sin(t * 0.6) * 2.2 - py * 5) * near;
      const ry = (Math.cos(t * 0.4) * 3 + px * 6) * near;
      const rz = Math.sin(t * 0.23) * 0.6 * near;

      node.style.transform =
        `perspective(1200px) rotateX(${rx.toFixed(3)}deg) ` +
        `rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg)`;
      /* translation only: a drift-driven drop-shadow re-blurs every frame */
      node.style.setProperty("--shade-x", `${(-ry * 1.1).toFixed(2)}px`);
      node.style.setProperty("--shade-y", `${(rx * 1.1).toFixed(2)}px`);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      clear();
    };
  }, [enabled, el]);
}
