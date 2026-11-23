import type { Metadata } from "next";
import { findConcept } from "@/data/fixtures";
import { ConceptDetail } from "@/features/instructor/analytics/concept-detail";

type Props = { params: Promise<{ conceptId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { conceptId } = await params;
  const concept = findConcept(conceptId);
  return { title: `${concept?.title ?? "Concept"} · Concept detail · Instructor` };
}

/** IN9 Concept detail. */
export default async function Page({ params }: Props) {
  const { conceptId } = await params;
  return <ConceptDetail conceptId={conceptId} />;
}
