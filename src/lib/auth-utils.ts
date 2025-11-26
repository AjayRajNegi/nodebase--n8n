import { headers } from "next/headers";
import { auth } from "./auth";
import { redirect } from "next/navigation";

// If user doesn't have session then redirect to /login
export const requireAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return session;
};

// If the user has session then redirect to /
export const requireUnauth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/");
  }
};
