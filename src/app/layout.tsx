import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mugabe Fitness | Personal Coaching",
  description:
    "Personal coaching built to help you train with purpose, build strength, and transform your physique.",
};

// The heavy, italic display face of the header and hero. Exposed as a CSS
// variable so each component opts in rather than restyling the whole site.
const display = Montserrat({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
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
      className={display.variable}
    >
      <body>{children}</body>
    </html>
  );
}
