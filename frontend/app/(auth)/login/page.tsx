import { AuthPage } from "@/components/auth/auth-page";
import { getSafeReturnPath } from "@/lib/auth/return-path";
import { redirectAuthenticatedUser } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  await redirectAuthenticatedUser();
  const params = await searchParams;

  return (
    <AuthPage
      error={params.error}
      mode="login"
      nextPath={getSafeReturnPath(params.next)}
    />
  );
}
