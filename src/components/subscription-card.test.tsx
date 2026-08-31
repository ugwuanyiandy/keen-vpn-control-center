import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SubscriptionCard } from "@/components/subscription-card";

describe("SubscriptionCard", () => {
  it("shows an active plan and its period end", () => {
    render(<SubscriptionCard subscription={{ plan: "Keen Plus", status: "ACTIVE", currentPeriodEnd: "2026-09-28T12:00:00.000Z" }} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Keen Plus")).toBeInTheDocument();
    expect(screen.getByText(/Sep 28, 2026/)).toBeInTheDocument();
  });
});
