import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATALOGUE, MODES, getCategory, getMode } from "@mugabe/fitness-content";
import CategoryExercises from "@/components/workouts/category-exercises";

// Every mode's own categories, built at build time; a category from the
// other mode, or any other address, is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return MODES.flatMap((mode) => mode.categories.map((category) => ({ mode: mode.id, category: category.slug })));
}

export async function generateMetadata({ params }: PageProps<"/workouts/[mode]/[category]">): Promise<Metadata> {
  const { mode, category } = await params;
  const found = getCategory(mode, category);

  return found ? { title: `${found.name} · ${getMode(mode)?.name} | Mugabe Fitness` } : {};
}

export default async function WorkoutCategoryPage({ params }: PageProps<"/workouts/[mode]/[category]">) {
  const { mode: modeId, category: slug } = await params;
  const mode = getMode(modeId);
  const category = getCategory(modeId, slug);

  if (!mode || !category) notFound();

  return (
    <CategoryExercises
      modeId={mode.id}
      categorySlug={category.slug}
      exercises={CATALOGUE.published(mode.id, category.slug)}
    />
  );
}
