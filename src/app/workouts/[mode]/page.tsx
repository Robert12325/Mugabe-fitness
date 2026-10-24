import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATALOGUE, MODE_IDS, getMode } from "@mugabe/fitness-content";
import ModeCategories from "@/components/workouts/mode-categories";
import { assertPublishedCatalogue } from "../published-catalogue";

// Built for each mode at build time; any other address is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  // Runs at build time: a published exercise that breaks a rule stops the build.
  assertPublishedCatalogue();

  return MODE_IDS.map((mode) => ({ mode }));
}

export async function generateMetadata({ params }: PageProps<"/workouts/[mode]">): Promise<Metadata> {
  const mode = getMode((await params).mode);

  return mode ? { title: `${mode.name} | Mugabe Fitness`, description: mode.summary } : {};
}

export default async function WorkoutModePage({ params }: PageProps<"/workouts/[mode]">) {
  const mode = getMode((await params).mode);

  if (!mode) notFound();

  const counts = Object.fromEntries(
    mode.categories.map((category) => [category.slug, CATALOGUE.published(mode.id, category.slug).length]),
  );

  return <ModeCategories modeId={mode.id} counts={counts} />;
}
