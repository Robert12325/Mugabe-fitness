import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Mugabe Fitness",
  description: "Manage enquiries, programs, and site content.",
  robots: { index: false, follow: false },
};

// The script face for the admin's tagline comes from the root layout.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-ui">{children}</div>;
}
