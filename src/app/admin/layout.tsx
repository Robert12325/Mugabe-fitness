import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Mugabe Fitness",
  description: "Manage enquiries, programs, and site content.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
