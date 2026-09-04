"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconCheck } from "./icons";

export interface Toast {
  id: number;
  title: string;
  note?: string;
  leaving?: boolean;
}

const LIFETIME = 2600;
const EXIT = 200;

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const timers = useRef<number[]>([]);

  const push = useCallback((title: string, note?: string) => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, title, note }].slice(-3));

    /* Two timers: one to start the exit, one to unmount after it plays.
       Removing the node outright would cut the animation off mid-flight. */
    /* Each timer drops its own handle once it has fired, so the list holds
       what is still pending rather than everything the session ever
       scheduled — which only ever grew. */
    const track = (handle: number) => {
      timers.current.push(handle);
      return handle;
    };
    const done = (handle: number) => {
      const i = timers.current.indexOf(handle);
      if (i >= 0) timers.current.splice(i, 1);
    };

    const outer: number = track(
      window.setTimeout(() => {
        done(outer);
        setToasts((t) =>
          t.map((x) => (x.id === id ? { ...x, leaving: true } : x)),
        );
        const inner: number = track(
          window.setTimeout(() => {
            done(inner);
            setToasts((t) => t.filter((x) => x.id !== id));
          }, EXIT),
        );
      }, LIFETIME),
    );
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  return { toasts, push };
}

export function Toasts({ items }: { items: Toast[] }) {
  if (!items.length) return null;
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="toast" data-leaving={t.leaving}>
          <IconCheck />
          <span>
            {t.title}
            {t.note && <small>{t.note}</small>}
          </span>
        </div>
      ))}
    </div>
  );
}
