"use client";

import type { ReactNode } from "react";

export const GOLD = "#d4af37";

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d4af37]/60 focus:bg-white/[0.06]";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#0b0b0b] p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-black uppercase tracking-wide text-white">
          {title}
        </h2>

        {hint && <p className="mt-1 text-xs text-white/35">{hint}</p>}
      </div>

      {action}
    </div>
  );
}

type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "gold" | "ghost" | "danger";
  size?: "sm" | "md";
  title?: string;
  disabled?: boolean;
};

export function Btn({
  children,
  onClick,
  type = "button",
  variant = "ghost",
  size = "md",
  title,
  disabled = false,
}: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-black uppercase tracking-[0.1em] transition disabled:opacity-40";

  const sizes = {
    sm: "px-3.5 py-1.5 text-[10px]",
    md: "px-5 py-2.5 text-xs",
  };

  const variants = {
    gold: "bg-[#d4af37] text-black hover:bg-white",
    ghost: "border border-white/15 text-white/80 hover:border-white/40 hover:text-white",
    danger: "border border-red-500/35 text-red-300 hover:bg-red-500/10",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
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
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
        {label}
      </span>

      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} resize-y`}
      />
    </label>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 px-6 py-16 text-center text-sm text-white/30">
      {children}
    </div>
  );
}
