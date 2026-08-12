import { MoodResponseExperience } from "@/components/mood-response-experience";
import { PageHeader } from "@/components/page-header";

export default async function MoodResponsePage({
  searchParams,
}: {
  searchParams: Promise<{ checkin?: string | string[] }>;
}) {
  const params = await searchParams;
  const checkinId = typeof params.checkin === "string" ? params.checkin : null;

  return (
    <div className="space-y-8">
      <PageHeader
        description="A matched passage appears here after you share how the day feels."
        eyebrow="Your perspective"
        title="A moment of reflection"
      />
      <MoodResponseExperience checkinId={checkinId} key={checkinId} />
    </div>
  );
}
