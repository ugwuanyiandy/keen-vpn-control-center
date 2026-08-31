"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { planIdForName } from "@/lib/plans";

type Plan = {
  id: string;
  name: string;
  description: string;
  features: readonly string[];
  highlighted: boolean;
  durationDays: number;
};

type Subscription = {
  plan: string | null;
  status: "ACTIVE" | "TRIAL" | "EXPIRED" | "NO_SUBSCRIPTION";
  currentPeriodEnd: string | null;
};

export function PlansClient({ plans, initialSubscription }: { plans: readonly Plan[]; initialSubscription: Subscription }) {
  const router = useRouter();
  const [subscription, setSubscription] = useState(initialSubscription);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const currentPlanId = subscription.status === "ACTIVE" ? planIdForName(subscription.plan) : null;
  const activationDate = new Date();
  const endDate = new Date(activationDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  async function activate() {
    if (!selected) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/me/subscription/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selected.id }),
      });
      const payload = (await response.json()) as {
        data?: { subscription: Subscription };
        error?: { message?: string };
      };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message ?? "Unable to activate this plan.");
      }
      setSubscription(payload.data.subscription);
      setSelected(null);
      toast.success(`${payload.data.subscription.plan} is now active.`);
      router.refresh();
    } catch (activationError) {
      const message = (activationError as Error).message;
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="page-wrap plans-page">
      <header className="page-header">
        <div>
          <p className="section-kicker">Membership plans</p>
          <h1>Choose your KeenVPN plan</h1>
          <p>Activate any plan immediately for 30 days. No payment step is included in this demo.</p>
        </div>
        <Link className="secondary-button" href="/account">Back to account</Link>
      </header>

      <section className="plan-grid" aria-label="Available plans">
        {plans.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          return (
            <article className={`plan-card${plan.highlighted ? " plan-card-highlighted" : ""}`} key={plan.id}>
              <div className="plan-card-heading">
                <div><p className="section-kicker">30-day plan</p><h2>{plan.name}</h2></div>
                {isCurrent ? <Badge className="status-badge status-success">Current</Badge> : plan.highlighted ? <Badge className="status-badge status-info">Popular</Badge> : null}
              </div>
              <p className="plan-description">{plan.description}</p>
              <ul className="plan-features">
                {plan.features.map((feature) => <li key={feature}><Check size={15} aria-hidden="true" />{feature}</li>)}
              </ul>
              <Button className={plan.highlighted ? "primary-button" : "secondary-button"} variant={plan.highlighted ? "default" : "outline"} disabled={isCurrent} onClick={() => { setError(""); setSelected(plan); }}>
                {isCurrent ? <CheckCircle2 size={16} aria-hidden="true" /> : <ShieldCheck size={16} aria-hidden="true" />}
                {isCurrent ? "Current active plan" : subscription.plan ? "Switch to this plan" : "Select this plan"}
              </Button>
            </article>
          );
        })}
      </section>

      <p className="plans-note">Plan tiers do not change server access in this product demonstration.</p>

      {selected && (
        <AlertDialog open onOpenChange={(open) => { if (!open && !pending) setSelected(null); }}>
          <AlertDialogContent className="confirmation-dialog">
            <AlertDialogHeader>
              <AlertDialogMedia className="confirmation-icon"><ShieldCheck size={23} aria-hidden="true" /></AlertDialogMedia>
              <AlertDialogTitle>Activate {selected.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                {subscription.plan
                  ? `${selected.name} will replace ${subscription.plan} immediately.`
                  : `${selected.name} will activate immediately.`}
                {" "}Your 30-day period runs from {formatDate(activationDate)} through {formatDate(endDate)}. No payment will be collected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {error && <p className="form-error confirmation-error" role="alert">{error}</p>}
            <AlertDialogFooter>
              <AlertDialogCancel className="secondary-button" disabled={pending}>Cancel</AlertDialogCancel>
              <AlertDialogAction className="primary-button" disabled={pending} onClick={(event) => { event.preventDefault(); void activate(); }}>
                {pending && <LoaderCircle className="spin" size={16} aria-hidden="true" />}{pending ? "Activating…" : "Confirm activation"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}
