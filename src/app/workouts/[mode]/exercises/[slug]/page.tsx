import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATALOGUE, MODES } from "@mugabe/fitness-content";
import ExerciseDetail from "@/components/workouts/exercise-detail";

// Only published exercises are built, each under its own mode; a draft, an
// exercise of the other mode or an unknown slug is a 404.
export const dynamicParams = false;

// Returns both segments: /workouts/[mode] is a page, not a layout, so it
// passes no params down to this route.
export function generateStaticParams() {
  return MODES.flatMap((mode) =>
    CATALOGUE.published(mode.id).map((exercise) => ({ mode: mode.id, slug: exercise.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/workouts/[mode]/exercises/[slug]">): Promise<Metadata> {
  const { mode, slug } = await params;
  const exercise = CATALOGUE.find(mode, slug);

  return exercise ? { title: `${exercise.name} | Mugabe Fitness` } : {};
}

export default async function ExercisePage({ params }: PageProps<"/workouts/[mode]/exercises/[slug]">) {
  const { mode, slug } = await params;
  const exercise = CATALOGUE.find(mode, slug);

  if (!exercise) notFound();

  return (
    <ExerciseDetail
      exercise={exercise}
      alternatives={CATALOGUE.alternativesOf(exercise).map(({ slug, name }) => ({ slug, name }))}
    />
  );
}
