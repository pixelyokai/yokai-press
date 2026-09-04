import { FONT_FILES } from "./presets";
import type { StampConfig } from "./types";

/** Long edge of the exported PNG, in pixels. */
const OUTPUT_LONG_EDGE = 1600;

const fontCache = new Map<string, string>();

/**
 * Fonts have to travel with the file: an SVG rasterised through an <img> tag
 * cannot reach the page's font faces or /fonts, so each face is inlined.
 */
async function fontFaceCss(ids: string[]) {
  const faces = await Promise.all(
    Array.from(new Set(ids)).map(async (id) => {
      const f = FONT_FILES[id];
      if (!f) return "";
      let b64 = fontCache.get(id);
      if (!b64) {
        const buf = await (await fetch(f.file)).arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = "";
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
        }
        b64 = btoa(bin);
        fontCache.set(id, b64);
      }
      return `@font-face{font-family:"${f.family}";src:url(data:font/woff2;base64,${b64}) format("woff2");font-weight:100 900;font-style:normal;}`;
    }),
  );
  return faces.join("");
}

export interface ExportDims {
  w: number;
  h: number;
}

/** The plate as a standalone SVG string. An intermediate step, never shipped. */
async function serializeStamp(
  svg: SVGSVGElement,
  cfg: StampConfig,
  dims: ExportDims,
  outW: number,
) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const scale = outW / dims.w;
  clone.setAttribute("width", String(Math.round(dims.w * scale)));
  clone.setAttribute("height", String(Math.round(dims.h * scale)));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  clone.removeAttribute("style");
  clone.removeAttribute("class");

  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = await fontFaceCss([cfg.displayFont, cfg.labelFont]);
  clone.insertBefore(style, clone.firstChild);

  return new XMLSerializer().serializeToString(clone);
}

function svgToImage(svgText: string): Promise<HTMLImageElement> {
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not rasterise the stamp"));
    };
    img.src = url;
  });
}

export async function exportStamp(
  svg: SVGSVGElement,
  cfg: StampConfig,
  dims: ExportDims,
) {
  const longSide = Math.max(dims.w, dims.h);
  const outW = Math.round((OUTPUT_LONG_EDGE * dims.w) / longSide);
  const outH = Math.round((OUTPUT_LONG_EDGE * dims.h) / longSide);

  const img = await svgToImage(await serializeStamp(svg, cfg, dims, outW));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  canvas.getContext("2d")!.drawImage(img, 0, 0, outW, outH);

  const blob: Blob | null = await new Promise((res) =>
    canvas.toBlob(res, "image/png"),
  );
  if (blob) download(blob, filename(cfg));
}

function filename(cfg: StampConfig) {
  const slug =
    (cfg.headline || "stamp")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "stamp";
  return `yokai-press-${slug}.png`;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
