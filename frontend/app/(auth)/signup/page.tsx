import { AuthPage } from "@/components/auth/auth-page";
import { getSafeReturnPath } from "@/lib/auth/return-path";
import { redirectAuthenticatedUser } from "@/lib/auth/session";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  await redirectAuthenticatedUser();
  const params = await searchParams;

  return <AuthPage mode="signup" nextPath={getSafeReturnPath(params.next)} />;
}
