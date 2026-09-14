import type { Metadata } from "next";
import { Yellowtail } from "next/font/google";

export const metadata: Metadata = {
  title: "Admin | Mugabe Fitness",
  description: "Manage enquiries, programs, and site content.",
  robots: { index: false, follow: false },
};

// Only the admin uses the script face (for the tagline), so only the admin
// loads it.
const script = Yellowtail({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-script",
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`admin-ui ${script.variable}`}>{children}</div>;
}
