import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mugabe Fitness | Personal Coaching",
  description:
    "Personal coaching built to help you train with purpose, build strength, and transform your physique.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
