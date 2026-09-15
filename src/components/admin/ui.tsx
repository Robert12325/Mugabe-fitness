"use client";

import type { ReactNode } from "react";
import BrandMark from "@/components/brand-mark";
import { useDB } from "@/lib/use-store";
import Icon, { type IconName } from "@/components/icons";

export const GOLD = "#d4af37";

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-4 py-3 text-sm text-white outline-none transition [color-scheme:dark] placeholder:text-white/30 hover:border-white/20 focus:border-[#d4af37]/55 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.08)]";

/** The raised, faintly lit surface every panel sits on. */
const surface =
  "border border-white/10 bg-[linear-gradient(180deg,#121212,#0a0a0a)]";

/* ------------------------------------------------------------------ */
/* Brand                                                               */
/* ------------------------------------------------------------------ */

export function BrandLockup({ name, suffix }: { name: string; suffix: string }) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <BrandMark className="h-10 w-10 sm:h-12 sm:w-12" />

      <div className="leading-none">
        <div className="text-lg font-black tracking-[0.06em] text-white sm:text-[1.65rem]">
          {name}
        </div>

        <div className="mt-1.5 text-[9px] font-bold tracking-[0.62em] text-[#d4af37] sm:text-[11px]">
          {suffix}
        </div>
      </div>
    </div>
  );
}

/** The brand tagline in script, with a brushed underline. */
export function Flourish() {
  const { settings } = useDB();
  const tagline = settings.tagline.trim();

  if (!tagline) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none hidden shrink-0 select-none xl:mr-12 xl:block"
    >
      <p className="-rotate-[7deg] whitespace-nowrap font-[family-name:var(--font-script)] text-[2.6rem] leading-none text-[#e9c85a]">
        {tagline}
      </p>

      <svg viewBox="0 0 220 18" className="-mt-1 ml-10 h-4 w-56 text-[#d4af37]">
        <path
          d="M3 15C70 7 140 4 217 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

function CornerRibbon() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-0 top-0 h-28 w-28 origin-top-right scale-75 overflow-hidden rounded-tr-[1.75rem] sm:scale-100"
    >
      <div className="absolute -right-12 top-6 h-8 w-44 rotate-45 bg-gradient-to-r from-[#7a5c14] via-[#d4af37] to-[#f6da80] shadow-[0_0_28px_rgba(212,175,55,0.35)]" />
      <div className="absolute -right-10 top-[4.5rem] h-1 w-40 rotate-45 bg-[#d4af37]/35" />
    </div>
  );
}

export function Card({
  children,
  className = "",
  decorated = false,
}: {
  children: ReactNode;
  className?: string;
  /** The gold corner ribbon — for the main card of a tab. */
  decorated?: boolean;
}) {
  return (
    <div
      data-decorated={decorated || undefined}
      className={`group/card relative overflow-hidden rounded-[1.75rem] ${surface} shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] ${
        decorated ? "p-6 sm:p-10" : "p-6 sm:p-8"
      } ${className}`}
    >
      {decorated && <CornerRibbon />}

      <div className="relative">{children}</div>
    </div>
  );
}

export function IconTile({
  icon,
  size = "md",
  solid = false,
}: {
  icon: IconName;
  size?: "md" | "lg";
  solid?: boolean;
}) {
  return size === "lg" ? (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#d4af37]/25 bg-[linear-gradient(145deg,#2c2309,#0e0b05)] text-[#eac55a] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_30px_-12px_rgba(212,175,55,0.4)] sm:h-[4.5rem] sm:w-[4.5rem]">
      <Icon name={icon} solid={solid} className="h-7 w-7 sm:h-9 sm:w-9" />
    </span>
  ) : (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-[linear-gradient(145deg,#1a1a1a,#0d0d0d)] text-[#eac55a] sm:h-12 sm:w-12">
      <Icon name={icon} solid={solid} className="h-6 w-6" />
    </span>
  );
}

export function SectionTitle({
  title,
  hint,
  action,
  icon,
  flourish = false,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  icon?: IconName;
  /** Show the brand tagline in script on the right. */
  flourish?: boolean;
}) {
  // The last word takes the gold, as in the brand artwork: "Site DETAILS".
  const split = title.lastIndexOf(" ");
  const lead = split > 0 ? title.slice(0, split + 1) : "";
  const accent = split > 0 ? title.slice(split + 1) : title;

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-5">
      <div className="flex min-w-0 flex-1 basis-80 items-center gap-4 sm:gap-6">
        {icon && <IconTile icon={icon} size="lg" solid />}

        <div className="min-w-0">
          <h2 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            {lead}
            <span className="text-[#f0c93f]">{accent}</span>
          </h2>

          {hint && (
            <p className="mt-1.5 text-sm leading-6 text-white/60">{hint}</p>
          )}
        </div>
      </div>

      {flourish && <Flourish />}

      {/* Keeps buttons clear of the corner ribbon on a decorated card. */}
      {action && (
        <div className="sm:group-data-[decorated]/card:mr-12">{action}</div>
      )}
    </div>
  );
}

/** A callout with a gold edge — for warnings that matter. */
export function Notice({
  children,
  icon = "lock",
  tone = "gold",
}: {
  children: ReactNode;
  icon?: IconName;
  tone?: "gold" | "red";
}) {
  const tones = {
    gold: {
      box: "border-[#d4af37]/20 bg-[linear-gradient(90deg,rgba(212,175,55,0.15),rgba(212,175,55,0.04))] text-[#eccb5f]",
      bar: "bg-[#d4af37]",
      tile: "bg-[#d4af37]/15 text-[#f0c93f]",
    },
    red: {
      box: "border-red-500/25 bg-[linear-gradient(90deg,rgba(192,69,61,0.16),rgba(192,69,61,0.04))] text-red-200",
      bar: "bg-red-400",
      tile: "bg-red-500/15 text-red-300",
    },
  }[tone];

  return (
    <div
      className={`relative flex items-center gap-4 overflow-hidden rounded-2xl border py-4 pl-6 pr-5 sm:gap-6 ${tones.box}`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${tones.bar}`} />

      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tones.tile}`}
      >
        <Icon name={icon} solid className="h-6 w-6" />
      </span>

      <span aria-hidden className="hidden h-10 w-px shrink-0 bg-white/15 sm:block" />

      <div className="min-w-0 text-sm leading-6">{children}</div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.01] px-6 py-16 text-center text-sm text-white/40">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Controls                                                            */
/* ------------------------------------------------------------------ */

type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "gold" | "ghost" | "danger";
  size?: "sm" | "md";
  title?: string;
  disabled?: boolean;
  icon?: IconName;
};

export function Btn({
  children,
  onClick,
  type = "button",
  variant = "ghost",
  size = "md",
  title,
  disabled = false,
  icon,
}: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-bold uppercase tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-40";

  const sizes = {
    sm: "px-4 py-2 text-[11px]",
    md: "px-6 py-3 text-[13px]",
  };

  const variants = {
    gold: "bg-[linear-gradient(135deg,#f6da80,#d4af37_55%,#ad8522)] text-black shadow-[0_8px_24px_-10px_rgba(212,175,55,0.6)] hover:brightness-110",
    ghost:
      "border border-white/15 bg-black/30 text-white/85 hover:border-white/35 hover:text-white",
    danger:
      "border border-red-500/35 bg-red-500/[0.04] text-red-300 hover:bg-red-500/10",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]}`}
    >
      {icon && (
        <Icon name={icon} className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      )}
      {children}
    </button>
  );
}

const fieldBox =
  "rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012))] transition hover:border-white/20 focus-within:border-[#d4af37]/55 focus-within:shadow-[0_0_0_3px_rgba(212,175,55,0.08)]";

const fieldLabel =
  "block text-[11px] font-bold uppercase tracking-[0.14em] text-white/45";

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
  solidIcon = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon?: IconName;
  solidIcon?: boolean;
}) {
  return (
    <label
      className={`flex cursor-text items-center gap-4 py-3.5 ${icon ? "pl-3.5 pr-4" : "px-4"} ${fieldBox}`}
    >
      {icon && <IconTile icon={icon} solid={solidIcon} />}

      <span className="min-w-0 flex-1">
        <span className={fieldLabel}>{label}</span>

        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 w-full bg-transparent text-base text-white outline-none [color-scheme:dark] placeholder:text-white/25 sm:text-lg"
        />
      </span>
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className={`block cursor-text px-4 py-3 ${fieldBox}`}>
      <span className={fieldLabel}>{label}</span>

      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-y bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/25"
      />
    </label>
  );
}
