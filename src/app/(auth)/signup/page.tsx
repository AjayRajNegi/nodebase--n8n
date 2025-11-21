import { RegisterForm } from "@/app/features/auth/components/register-form";
import { requireUnauth } from "@/lib/auth-utils";

export default async function Page() {
  // Checks for user on the server
  await requireUnauth();
  return (
    <div>
      <RegisterForm />
    </div>
  );
}
