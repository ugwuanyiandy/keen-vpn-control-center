import { CalendarDays, CircleCheck, Clock3, CircleX, MinusCircle } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

type Subscription = {
  plan: string | null;
  status: "ACTIVE" | "TRIAL" | "EXPIRED" | "NO_SUBSCRIPTION";
  currentPeriodEnd: string | null;
};

const statusConfig = {
  ACTIVE: { label: "Active", icon: CircleCheck, tone: "success" },
  TRIAL: { label: "Trial", icon: Clock3, tone: "info" },
  EXPIRED: { label: "Expired", icon: CircleX, tone: "danger" },
  NO_SUBSCRIPTION: { label: "No subscription", icon: MinusCircle, tone: "neutral" },
} as const;

export function SubscriptionCard({ subscription, canManage = true }: { subscription: Subscription; canManage?: boolean }) {
  const config = statusConfig[subscription.status];
  const Icon = config.icon;
  const date = subscription.currentPeriodEnd
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(subscription.currentPeriodEnd))
    : null;

  return (
    <section className="panel subscription-panel" aria-labelledby="subscription-title">
      <div className="panel-heading">
        <div><p className="section-kicker">Membership</p><h2 id="subscription-title">Your subscription</h2></div>
        <span className={clsx("status-badge", `status-${config.tone}`)}><Icon size={15} aria-hidden="true" />{config.label}</span>
      </div>
      <div className="subscription-body">
        <div><span>Current plan</span><strong>{subscription.plan ?? "No plan selected"}</strong></div>
        <div><span>{subscription.status === "EXPIRED" ? "Expired on" : "Current period ends"}</span><strong>{date ?? "Not applicable"}</strong></div>
      </div>
      <div className="subscription-foot"><CalendarDays size={17} aria-hidden="true" /><span>{subscription.status === "ACTIVE" ? "Your protection remains active through this billing period." : subscription.status === "TRIAL" ? "Explore every KeenVPN location during your trial." : "Choose a plan when you are ready to activate protection."}</span></div>
      {canManage && <Link className="text-link" href="/plans">{subscription.status === "NO_SUBSCRIPTION" ? "Choose a plan" : "Change plan"} <span aria-hidden="true">→</span></Link>}
    </section>
  );
}
