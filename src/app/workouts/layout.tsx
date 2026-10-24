import type { Metadata } from "next";
import WorkoutsHeader from "@/components/workouts/workouts-header";

export const metadata: Metadata = {
  title: "Workouts | Mugabe Fitness",
  description:
    "Free workouts in two modes: gym training with equipment, and bodyweight training for home, outdoors and travel.",
};

export default function WorkoutsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative isolate min-h-screen overflow-x-clip bg-[#050505] font-[family-name:var(--font-display)] text-white">
      <WorkoutsHeader />
      {children}
    </main>
  );
}
