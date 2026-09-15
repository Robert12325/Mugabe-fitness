import type { Metadata } from "next";
import { Montserrat, Yellowtail } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mugabe Fitness | Personal Coaching",
  description:
    "Personal coaching built to help you train with purpose, build strength, and transform your physique.",
};

// The heavy, italic display face of the header, hero and contact section.
// Exposed as CSS variables so each component opts in rather than restyling
// the whole site.
const display = Montserrat({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

// Brush script for taglines ("Stronger Together", the admin's motto).
const script = Yellowtail({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-script",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${script.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
