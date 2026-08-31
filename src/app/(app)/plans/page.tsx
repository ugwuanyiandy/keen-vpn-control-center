import { redirect } from "next/navigation";
import { PlansClient } from "@/components/plans-client";
import { UserRole } from "@/generated/prisma/enums";
import { getPageUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_CATALOG } from "@/lib/plans";
import { serializeSubscription } from "@/lib/serializers";

export default async function PlansPage() {
  const user = await getPageUser();
  if (!user) redirect("/login");
  if (user.role !== UserRole.CUSTOMER) redirect("/dashboard");

  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
  return <PlansClient plans={PLAN_CATALOG} initialSubscription={serializeSubscription(subscription)} />;
}
