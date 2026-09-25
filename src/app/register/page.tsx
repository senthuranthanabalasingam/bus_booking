import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/format";

export default async function RegisterPage(props: PageProps<"/register">) {
  const next = safeNext((await props.searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return <AuthForm mode="register" next={next} />;
}
