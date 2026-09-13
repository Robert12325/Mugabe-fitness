"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees on each axis. */
  max?: number;
};

/**
 * Tilts its child in 3D toward the cursor and moves a soft gold highlight
 * with it.
 *
 * Enabled only for a fine pointer (a real mouse) and only when the visitor
 * has not asked for reduced motion — on a phone this renders as a plain
 * card with no listeners attached at all.
 */
export default function Tilt({ children, className = "", max = 6 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => setEnabled(fine.matches && !still.matches);

    sync();

    fine.addEventListener("change", sync);
    still.addEventListener("change", sync);

    return () => {
      fine.removeEventListener("change", sync);
      still.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const handleMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!enabled) return;

      const node = ref.current;
      if (!node) return;

      const { clientX, clientY } = event;

      cancelAnimationFrame(frame.current);

      frame.current = requestAnimationFrame(() => {
        // Read geometry inside the frame so a burst of pointer events cannot
        // force a layout on every one of them.
        const rect = node.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;

        node.style.setProperty("--ry", `${(x - 0.5) * 2 * max}deg`);
        node.style.setProperty("--rx", `${(0.5 - y) * 2 * max}deg`);
        node.style.setProperty("--mx", `${x * 100}%`);
        node.style.setProperty("--my", `${y * 100}%`);
      });
    },
    [enabled, max],
  );

  const handleLeave = useCallback(() => {
    cancelAnimationFrame(frame.current);

    const node = ref.current;
    if (!node) return;

    node.style.setProperty("--rx", "0deg");
    node.style.setProperty("--ry", "0deg");
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={enabled ? handleMove : undefined}
      onPointerLeave={enabled ? handleLeave : undefined}
      className={`tilt-host ${enabled ? "tilt" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
