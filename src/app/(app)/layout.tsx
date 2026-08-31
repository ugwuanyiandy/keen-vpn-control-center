import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getPageUser } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getPageUser();
  if (!user) redirect("/login");

  return <AppShell user={{ fullName: user.fullName, email: user.email, role: user.role }}>{children}</AppShell>;
}
