import { DashboardExperience } from "@/components/dashboard-experience";
import { PageHeader } from "@/components/page-header";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        description="A private place for a daily passage, an honest check-in, and the words you choose to keep."
        eyebrow="Today"
        title="Take a moment before the day takes over"
      />
      <DashboardExperience />
    </div>
  );
}
