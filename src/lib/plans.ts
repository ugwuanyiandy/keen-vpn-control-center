export const PLAN_CATALOG = [
  {
    id: "keen-essential",
    name: "Keen Essential",
    description: "A simple starting point for everyday private browsing.",
    features: ["Global server directory", "Preferred location pinning", "30-day activation"],
    highlighted: false,
    durationDays: 30,
  },
  {
    id: "keen-plus",
    name: "Keen Plus",
    description: "Our balanced plan for regular protection across devices.",
    features: ["Global server directory", "Preferred location pinning", "30-day activation"],
    highlighted: true,
    durationDays: 30,
  },
  {
    id: "keen-max",
    name: "Keen Max",
    description: "The top Keen tier for customers who want our fullest plan.",
    features: ["Global server directory", "Preferred location pinning", "30-day activation"],
    highlighted: false,
    durationDays: 30,
  },
] as const;

export type PlanId = (typeof PLAN_CATALOG)[number]["id"];
export type PlanCatalogItem = (typeof PLAN_CATALOG)[number];

export function findPlan(planId: string) {
  return PLAN_CATALOG.find((plan) => plan.id === planId);
}

export function planIdForName(name: string | null) {
  return PLAN_CATALOG.find((plan) => plan.name === name)?.id ?? null;
}
