import { AuthenticatedShell } from "@/components/authenticated-shell";
import { requireCompletedProfile } from "@/lib/auth/session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireCompletedProfile();

  return <AuthenticatedShell profile={profile}>{children}</AuthenticatedShell>;
}
