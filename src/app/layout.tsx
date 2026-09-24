import type { Metadata, Viewport } from "next";
import { Montserrat, Noto_Sans_Devanagari, Yellowtail } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mugabe Fitness | Personal Coaching",
  description:
    "Personal coaching built to help you train with purpose, build strength, and transform your physique.",
  applicationName: "Mugabe Fitness",
  // Lets an iPhone open the site full screen once it is on the home screen.
  appleWebApp: {
    capable: true,
    title: "Mugabe Fitness",
    statusBarStyle: "black-translucent",
  },
  // Next emits only the standards-track name; older iOS still reads the
  // Apple-prefixed one, and without it the site opens in a browser bar.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  // Paints the phone status bar to match the site instead of white.
  themeColor: "#050505",
  colorScheme: "dark",
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

// Montserrat has no Devanagari, so Hindi needs a face of its own. It is not
// preloaded: English visitors should never pay to download it.
const hindi = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  preload: false,
  variable: "--font-hindi",
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
      className={`${display.variable} ${script.variable} ${hindi.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
