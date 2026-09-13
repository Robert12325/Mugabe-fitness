"use client";

import { useEffect, useRef } from "react";

/**
 * The decorative 3D object behind the hero copy.
 *
 * Three rings share one `preserve-3d` space and are tilted onto different
 * planes, so the whole group genuinely rotates in depth rather than faking
 * it with a 2D spin. Pointer movement shifts the layers by different amounts
 * for parallax.
 *
 * It is inert: aria-hidden, pointer-events-none, and driven purely by
 * transform/opacity so it never costs a layout.
 */
export default function HeroScene() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = host.current;
    if (!node) return;

    const fine = window.matchMedia("(pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!fine.matches || still.matches) return;

    let frame = 0;

    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        // -1..1 from the centre of the viewport.
        const x = (event.clientX / window.innerWidth - 0.5) * 2;
        const y = (event.clientY / window.innerHeight - 0.5) * 2;

        node.style.setProperty("--px", x.toFixed(3));
        node.style.setProperty("--py", y.toFixed(3));
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div
      ref={host}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Ambient wash so the rings sit in light rather than on flat black. */}
      <div className="absolute right-[-10%] top-[10%] h-[70vmin] w-[70vmin] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.13),transparent_65%)] pulse-glow" />

      <div
        className="scene parallax absolute right-[-18%] top-1/2 h-[86vmin] w-[86vmin] -translate-y-1/2 sm:right-[-10%] lg:right-[2%] lg:h-[64vmin] lg:w-[64vmin]"
        style={{ ["--depth" as string]: "26px" }}
      >
        <div className="orbit">
          <Ring size={100} tilt={68} spin={0} />
          <Ring size={74} tilt={-52} spin={38} />
          <Ring size={48} tilt={22} spin={-20} />
        </div>

        {/* Core */}
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d4af37] shadow-[0_0_40px_12px_rgba(212,175,55,0.35)]" />
      </div>

      {/* A nearer, faster layer reads as foreground depth. */}
      <div
        className="parallax float-slow absolute left-[6%] top-[26%] hidden h-2 w-2 rounded-full bg-[#d4af37]/70 shadow-[0_0_24px_6px_rgba(212,175,55,0.25)] lg:block"
        style={{ ["--depth" as string]: "48px" }}
      />

      <div
        className="parallax absolute bottom-[18%] left-[16%] hidden h-1.5 w-1.5 rounded-full bg-white/40 lg:block"
        style={{ ["--depth" as string]: "64px" }}
      />
    </div>
  );
}

function Ring({
  size,
  tilt,
  spin,
}: {
  /** Diameter as a percentage of the scene box. */
  size: number;
  tilt: number;
  spin: number;
}) {
  return (
    <div
      className="orbit-ring"
      style={{
        height: `${size}%`,
        width: `${size}%`,
        marginTop: `-${size / 2}%`,
        marginLeft: `-${size / 2}%`,
        transform: `rotateX(${tilt}deg) rotateZ(${spin}deg)`,
      }}
    />
  );
}
