import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/format";

export default async function LoginPage(props: PageProps<"/login">) {
  const next = safeNext((await props.searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return <AuthForm mode="login" next={next} />;
}
