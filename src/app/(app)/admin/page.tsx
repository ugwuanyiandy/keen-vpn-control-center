import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/enums";
import { AdminClient } from "@/components/admin-client";
import { getPageUser } from "@/lib/auth";
import { getAdminOverview } from "@/lib/server-service";

export default async function AdminPage() {
  const user = await getPageUser();
  if (!user) redirect("/login");
  if (user.role !== UserRole.ADMIN) redirect("/dashboard");

  return <AdminClient overview={await getAdminOverview()} />;
}
