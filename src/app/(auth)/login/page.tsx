import { LoginForm } from "@/app/features/auth/components/login-form";
import { requireUnauth } from "@/lib/auth-utils";

export default async function Page() {
  // Checks for user on the server
  await requireUnauth();
  return <LoginForm />;
}
