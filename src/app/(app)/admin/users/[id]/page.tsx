import { notFound, redirect } from "next/navigation";
import { AdminUserDetail } from "@/components/admin-user-detail";
import { UserRole } from "@/generated/prisma/enums";
import { AppError } from "@/lib/api";
import { getPageUser } from "@/lib/auth";
import { getAdminUser, listSubscriptionHistory } from "@/lib/user-service";

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await getPageUser();
  if (!actor) redirect("/login");
  if (actor.role !== UserRole.ADMIN) redirect("/dashboard");
  const { id } = await params;
  let result;
  try {
    result = await Promise.all([getAdminUser(id), listSubscriptionHistory(id, 1, 12)]);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
  const [user, initialHistory] = result;
  return <AdminUserDetail user={user} initialHistory={initialHistory} />;
}
