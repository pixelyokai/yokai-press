"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { IconChevrons, IconTick, IconUpload } from "./icons";

/* ------------------------------------------------------------- structure */

export function Section({
  label,
  counter,
  note,
  tight,
  style,
  children,
}: {
  label?: string;
  counter?: string;
  note?: string;
  tight?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <section className={tight ? "section tight" : "section"} style={style}>
      {label && (
        <div className="section-label">
          <span>{label}</span>
          {counter && <span className="counter">{counter}</span>}
        </div>
      )}
      {note && <p className="section-note">{note}</p>}
      {children}
    </section>
  );
}

export const Rule = ({ dashed }: { dashed?: boolean }) => (
  <div className={dashed ? "rule dashed" : "rule"} />
);

/* ----------------------------------------------------------------- pills */

/**
 * One chip travels to the selected option instead of each pill drawing its own
 * background. The pills wrap onto several rows, so the chip tracks both axes.
 */
export function Pills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [chip, setChip] = useState({ x: 0, y: 0, w: 0, ready: false });

  useLayoutEffect(() => {
    const measure = () => {
      const el = host.current?.querySelector<HTMLElement>(
        '[aria-pressed="true"]',
      );
      /* A hidden pane reports every offset as zero. Measuring then is what
         made the chip fly in from the top-left the first time a tab was
         opened — so wait until the group is actually laid out. */
      if (!el || el.offsetParent === null) return;

      setChip((prev) => {
        const next = {
          x: el.offsetLeft,
          y: el.offsetTop,
          w: el.offsetWidth,
          ready: true,
        };
        if (
          prev.ready &&
          prev.x === next.x &&
          prev.y === next.y &&
          prev.w === next.w
        ) {
          return prev;
        }
        return next;
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (host.current) ro.observe(host.current);
    /* a webfont landing changes label widths, so re-measure when one does */
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [value, options]);

  /* Only animate once a real placement has been painted; the very first one
     is applied cold so arriving at a tab shows the chip already in position. */
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!chip.ready || armed) return;
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, [chip.ready, armed]);

  return (
    <div
      className="pills"
      ref={host}
      data-ready={chip.ready}
      data-armed={armed}
    >
      <span
        className="pill-chip"
        style={{
          ["--chip-x" as string]: `${chip.x}px`,
          ["--chip-y" as string]: `${chip.y}px`,
          ["--chip-w" as string]: `${chip.w}px`,
        }}
      />
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className="pill"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Wraps content that a toggle shows and hides.
 *
 * The row stays mounted so it can animate out; a plain conditional would rip
 * it from the DOM before the exit could play. Height rides a grid track, which
 * is the only way to transition to an intrinsic height without measuring it.
 */
export function Reveal({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="reveal" data-open={open} aria-hidden={!open}>
      <div>{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- slider */

/**
 * Driven by pointer events rather than an <input type="range">.
 *
 * A range input normalises whatever value it is given to its own step and
 * bounds, so the DOM and the state can quietly end up disagreeing — and it
 * cannot be styled into the track-and-thumb this design calls for. Owning the
 * geometry makes both problems go away.
 */
export function Slider({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  format,
  onChange,
  inline,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  inline?: boolean;
  label?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const clamp = useCallback(
    (n: number) => {
      const c = Math.min(max, Math.max(min, n));
      const snapped = min + Math.round((c - min) / step) * step;
      return Math.min(max, Math.max(min, Number(snapped.toFixed(6))));
    },
    [min, max, step],
  );

  const safe = Number.isFinite(value) ? clamp(value) : min;
  const pct = ((safe - min) / (max - min)) * 100;

  const fromPointer = useCallback(
    (clientX: number) => {
      const r = track.current?.getBoundingClientRect();
      if (!r || r.width === 0) return;
      const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      const next = clamp(min + t * (max - min));
      if (!Object.is(next, safe)) onChange(next);
    },
    [clamp, min, max, onChange, safe],
  );

  useEffect(() => {
    if (!dragging) return;
    let raf = 0;
    /* null, not 0 — a press with no movement must not be read as clientX 0
       and snap the handle to the minimum. */
    let pending: number | null = null;
    const flush = () => {
      raf = 0;
      if (pending !== null) fromPointer(pending);
    };
    const move = (e: PointerEvent) => {
      pending = e.clientX;
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const up = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      flush();
      setDragging(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragging, fromPointer]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const big = (max - min) / 10;
    const map: Record<string, number> = {
      ArrowLeft: -step,
      ArrowDown: -step,
      ArrowRight: step,
      ArrowUp: step,
      PageDown: -big,
      PageUp: big,
    };
    if (e.key in map) {
      e.preventDefault();
      onChange(clamp(safe + map[e.key]));
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(min);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(max);
    }
  };

  const control = (
    <>
      <div
        className="slider"
        data-dragging={dragging}
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={safe}
        aria-label={label}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          e.preventDefault();
          setDragging(true);
          fromPointer(e.clientX);
        }}
      >
        <div
          className="slider-track"
          ref={track}
          style={{ ["--fill" as string]: `${pct}%` }}
        >
          <div className="slider-fill" />
          <div className="slider-thumb" />
        </div>
      </div>
      <div className="slider-value">
        {format ? format(safe) : safe.toFixed(2)}
      </div>
    </>
  );

  if (inline) {
    return (
      <div className="slider-inline">
        <div className="section-label">{label}</div>
        {control}
      </div>
    );
  }
  return <div className="slider-row">{control}</div>;
}

/* ---------------------------------------------------------------- toggle */

export function ToggleRow({
  on,
  onChange,
  label,
  note,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  note?: string;
}) {
  return (
    <div className="toggle-row">
      <span className="copy">
        <b>{label}</b>
        {note && <span>{note}</span>}
      </span>
      <button
        type="button"
        className="toggle"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- inputs */

export function TextInput({
  value,
  onChange,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 2,
  maxLength,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      className="textarea"
      rows={rows}
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      spellCheck={false}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * A listbox rather than a native <select>.
 *
 * The design calls for a translucent blurred menu with a trailing tick lane,
 * none of which a native control will render. Keyboard behaviour is kept:
 * arrows move, Enter and Space commit, Escape closes, Home and End jump.
 */
export function Select<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  /** rendered per option, so a font picker can show each face in itself */
  optionStyle,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  ariaLabel?: string;
  optionStyle?: (id: T) => React.CSSProperties | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState({ top: 0, left: 0, width: 0, flip: false });
  const host = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value);

  /* Position the portalled menu against the trigger, flipping above it when
     the space below runs out. Re-run on scroll and resize, since a fixed
     element does not follow the panel the trigger lives in. */
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const t = host.current?.getBoundingClientRect();
      if (!t) return;
      const wanted = Math.min(264, options.length * 32 + 8);
      const below = window.innerHeight - t.bottom - 12;
      const flip = below < wanted && t.top > below;
      setRect({
        top: flip ? Math.max(8, t.top - wanted - 6) : t.bottom + 6,
        left: t.left,
        width: t.width,
        flip,
      });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, options.findIndex((o) => o.id === value)));
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      /* the menu is portalled to the body, so it is not inside the trigger —
         miss it here and the menu unmounts before an item's click can fire */
      if (host.current?.contains(t) || menu.current?.contains(t)) return;
      setOpen(false);
    };
    /* pointerdown, not click — closing on click would fire after the press
       has already landed on whatever is underneath */
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open, options, value]);

  useEffect(() => {
    if (!open) return;
    menu.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const [hlArmed, setHlArmed] = useState(false);
  useEffect(() => {
    if (!open) {
      setHlArmed(false);
      return;
    }
    const id = requestAnimationFrame(() => setHlArmed(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  const commit = (id: T) => {
    onChange(id);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = options[active];
      if (opt) commit(opt.id);
    }
  };

  return (
    <div className="dd" ref={host}>
      <button
        type="button"
        className="dd-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
      >
        <span className="dd-value" style={optionStyle?.(value)}>
          {current?.label ?? ""}
        </span>
        <span className="dd-caret">
          <IconChevrons />
        </span>
      </button>

      {/* Portalled to the body: the panel scrolls, so a menu rendered in place
          would be clipped by that scroll container as soon as the trigger sat
          near an edge. Fixed coordinates come from the trigger's own rect. */}
      {open &&
        createPortal(
          <div
            className="dd-menu"
            role="listbox"
            ref={menu}
            tabIndex={-1}
            style={{
              position: "fixed",
              top: rect.top,
              left: rect.left,
              width: rect.width,
            }}
            data-flip={rect.flip}
            data-hl={active >= 0}
            data-hl-armed={hlArmed}
          >
            {/* one fill slides between the rows rather than each row lighting
                up on its own — same idea as the tab and pill chips */}
            <span
              className="dd-highlight"
              style={{ ["--hl-y" as string]: `${4 + active * 32}px` }}
            />
            {options.map((o, i) => (
              <button
                key={o.id}
                type="button"
                role="option"
                className="dd-item"
                aria-selected={o.id === value}
                data-active={i === active}
                onPointerEnter={() => setActive(i)}
                onClick={() => commit(o.id)}
              >
                <span className="dd-row">
                  <span className="dd-label" style={optionStyle?.(o.id)}>
                    {o.label}
                  </span>
                  <span className="dd-tick">
                    {o.id === value && <IconTick />}
                  </span>
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

export function Swatch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();

  /* A colour input streams events well above the refresh rate and each one
     re-renders the plate (~24ms). The swatch keeps its own copy so the dot
     and hex stay instant; the plate is told once per frame. */
  const [shown, setShown] = useState(value);
  const raf = useRef(0);
  const pending = useRef<string | null>(null);

  useEffect(() => setShown(value), [value]);
  useEffect(
    () => () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    },
    [],
  );

  const push = (v: string) => {
    setShown(v);
    pending.current = v;
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      if (pending.current !== null) onChange(pending.current);
    });
  };

  return (
    <label className="swatch-row" htmlFor={id}>
      <i className="swatch-dot" style={{ background: shown }} />
      <code>{shown}</code>
      <input
        id={id}
        type="color"
        value={shown}
        onChange={(e) => push(e.target.value)}
      />
    </label>
  );
}

/* --------------------------------------------------------------- tooltip */

/* Raster only. SVG can carry script and is inlined into the plate. */
export function Tip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="tip"
      data-show={show}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setShow(true);
      }}
      onPointerLeave={() => setShow(false)}
      onPointerDown={() => setShow(false)}
    >
      {children}
      <span className="tip-bubble" role="tooltip">
        {label}
      </span>
    </span>
  );
}

/* ---------------------------------------------------------- artwork drop */

const MAX_UPLOAD = 2 * 1024 * 1024;
/* Raster types only. SVG is excluded on purpose: it can carry script and is
   inlined straight into the plate, so it is an XSS vector rather than a
   picture. */
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function ImageDrop({
  hasImage,
  onChange,
}: {
  hasImage: boolean;
  onChange: (v: string | null) => void;
}) {
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const read = (file?: File | null) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("That file type is not supported — use a PNG, JPG or WebP.");
      return;
    }
    if (file.size > MAX_UPLOAD) {
      setError(
        `That image is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is 2MB.`,
      );
      return;
    }
    setError(null);
    const fr = new FileReader();
    fr.onerror = () => setError("That file could not be read.");
    fr.onload = () => onChange(String(fr.result));
    fr.readAsDataURL(file);
  };

  return (
    <label
      className="drop"
      data-over={over}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        read(e.dataTransfer.files?.[0]);
      }}
    >
      <input
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={(e) => {
          read(e.target.files?.[0]);
          /* clearing the value is what lets the same file be chosen twice —
             without it the input sees no change and never fires again */
          e.target.value = "";
        }}
      />
      <IconUpload />
      <b>
        {hasImage
          ? "Drop a replacement, or click to browse"
          : "Drop your files here, or click to browse"}
      </b>
      <span className={error ? "drop-error" : undefined}>
        {error ?? "2MB max, JPG or PNG"}
      </span>
    </label>
  );
}
