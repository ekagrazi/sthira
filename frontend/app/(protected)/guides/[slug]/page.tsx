import { notFound } from "next/navigation";

import { GuideDetailExperience } from "@/components/guide-detail-experience";
import { findGuide, guideIdentities } from "@/lib/guides";

export function generateStaticParams() {
  return guideIdentities.map(({ slug }) => ({ slug }));
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();

  return <GuideDetailExperience slug={guide.slug} />;
}
