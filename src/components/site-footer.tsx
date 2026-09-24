"use client";

import Link from "next/link";
import BrandMark from "@/components/brand-mark";
import Icon, { type IconName } from "@/components/icons";
import Reveal from "@/components/motion/reveal";
import { useDB } from "@/lib/use-store";

const EXPLORE = [
  { label: "Home", href: "#home" },
  { label: "Programs", href: "#programs" },
  { label: "The Method", href: "#method" },
  { label: "Your Coach", href: "#coach" },
];

const START = [
  { label: "How to start", href: "#start" },
  { label: "Book a program", href: "#contact" },
  { label: "My account", href: "/account" },
];

export default function SiteFooter() {
  const { settings } = useDB();

  // WhatsApp and tel: both want digits only, no spaces or plus sign.
  const digits = settings.coachPhone.replace(/\D/g, "");

  const reach: { icon: IconName; label: string; href: string }[] = [
    ...(settings.coachEmail
      ? [
          {
            icon: "mail" as const,
            label: settings.coachEmail,
            href: `mailto:${settings.coachEmail}`,
          },
        ]
      : []),
    ...(digits
      ? [
          {
            icon: "phone" as const,
            label: settings.coachPhone,
            href: `tel:+${digits}`,
          },
          {
            icon: "chat" as const,
            label: "Message on WhatsApp",
            href: `https://wa.me/${digits}`,
          },
        ]
      : []),
  ];

  return (
    <footer className="relative isolate overflow-hidden border-t border-[#e0b54a]/20 bg-black px-5 pb-8 pt-20 font-[family-name:var(--font-display)] sm:px-6 sm:pt-24 lg:px-8">
      {/* Gold haze, matching the top of every other section. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(48rem_26rem_at_12%_0%,rgba(245,197,24,0.08),transparent_70%)]"
      />

      {/* The name, huge and barely lit, behind everything. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-4 left-1/2 -z-10 w-full -translate-x-1/2 select-none text-center text-[23vw] font-black leading-none tracking-[-0.05em] text-white/[0.035] lg:text-[15rem]"
      >
        {settings.brandName}
      </span>

      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr] lg:gap-10">
            {/* Brand */}
            <div>
              <a
                href="#home"
                aria-label={`${settings.brandName} ${settings.brandSuffix} home`}
                className="flex items-center gap-3"
              >
                <BrandMark tone="yellow" className="h-11 w-11" />

                <span className="leading-none">
                  <span className="block text-xl font-extrabold tracking-[0.08em] text-white">
                    {settings.brandName}
                  </span>

                  <span className="mt-1.5 block text-[10px] font-bold tracking-[0.6em] text-[#f5c518]">
                    {settings.brandSuffix}
                  </span>
                </span>
              </a>

              {settings.tagline && (
                <p className="mt-6 bg-[linear-gradient(100deg,#c98f28,#f3c969_55%,#fbe3a0)] bg-clip-text font-[family-name:var(--font-script)] text-3xl leading-none text-transparent">
                  {settings.tagline}
                </p>
              )}

              <p className="mt-5 max-w-xs text-sm leading-7 text-white/60">
                Personal coaching built to help you train with purpose and
                become the strongest version of yourself.
              </p>

              <a
                href="#contact"
                className="group mt-7 inline-flex items-center gap-2.5 rounded-full bg-[#f5c518] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#ffd84a]"
              >
                Start Training
                <Icon
                  name="arrowRight"
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                />
              </a>
            </div>

            {/* Links */}
            <FooterColumn title="Explore">
              {EXPLORE.map((link) => (
                <FooterLink key={link.label} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </FooterColumn>

            <FooterColumn title="Get started">
              {START.map((link) => (
                <FooterLink key={link.label} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </FooterColumn>

            {/* Contact */}
            <div>
              <ColumnTitle>Reach me</ColumnTitle>

              <ul className="mt-5 space-y-4">
                {reach.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      {...(item.href.startsWith("https://")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="group flex items-start gap-3 text-sm text-white/65 transition hover:text-white"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e0b54a]/40 text-[#f5c518] transition group-hover:border-[#f3c969] group-hover:bg-[#f5c518] group-hover:text-black">
                        <Icon name={item.icon} className="h-4 w-4" />
                      </span>

                      <span className="min-w-0 break-words pt-1.5">
                        {item.label}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        {/* Hairline, brightest in the middle. */}
        <div
          aria-hidden
          className="mt-14 h-px w-full bg-[linear-gradient(90deg,transparent,rgba(224,181,74,0.45),transparent)]"
        />

        <div className="flex flex-col-reverse items-center gap-4 pt-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs text-white/55">
            © {new Date().getFullYear()} {settings.brandName}{" "}
            {settings.brandSuffix}. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-white/55">
              Rise · Grind · Shine
            </span>

            <Link
              href="/admin"
              className="text-xs font-semibold text-white/55 transition hover:text-[#f5c518]"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-[#f5c518]">
      <span aria-hidden className="h-0.5 w-6 shrink-0 bg-[#f5c518]" />
      {children}
    </p>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <nav aria-label={title}>
      <ColumnTitle>{title}</ColumnTitle>

      <ul className="mt-5 space-y-3.5">{children}</ul>
    </nav>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const className =
    "group inline-flex items-center gap-2 text-sm text-white/65 transition hover:text-[#f5c518]";

  const inner = (
    <>
      <span
        aria-hidden
        className="h-px w-0 bg-[#f5c518] transition-all duration-300 group-hover:w-4"
      />
      {children}
    </>
  );

  return (
    <li>
      {href.startsWith("/") ? (
        <Link href={href} className={className}>
          {inner}
        </Link>
      ) : (
        <a href={href} className={className}>
          {inner}
        </a>
      )}
    </li>
  );
}
