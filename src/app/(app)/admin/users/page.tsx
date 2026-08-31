import { redirect } from "next/navigation";
import { AdminUsersClient } from "@/components/admin-users-client";
import { UserRole } from "@/generated/prisma/enums";
import { getPageUser } from "@/lib/auth";
import { listAdminUsers } from "@/lib/user-service";

export default async function AdminUsersPage() {
  const user = await getPageUser();
  if (!user) redirect("/login");
  if (user.role !== UserRole.ADMIN) redirect("/dashboard");
  const initialData = await listAdminUsers({ q: "", status: "all", role: "all", page: 1, pageSize: 12, sort: "createdAt", order: "desc" });
  return <AdminUsersClient initialData={initialData} />;
}
