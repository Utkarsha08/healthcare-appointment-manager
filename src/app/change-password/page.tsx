import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default async function ChangePasswordPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <ChangePasswordForm
      user={{
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
        role: session.user.role as "ADMIN" | "DOCTOR" | "PATIENT",
      }}
    />
  );
}