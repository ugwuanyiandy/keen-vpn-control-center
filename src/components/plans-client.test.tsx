import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlansClient } from "@/components/plans-client";
import { PLAN_CATALOG } from "@/lib/plans";

const mocks = vi.hoisted(() => ({ refresh: vi.fn(), toastSuccess: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("sonner", () => ({ toast: { success: mocks.toastSuccess, error: vi.fn() } }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  mocks.refresh.mockReset();
  mocks.toastSuccess.mockReset();
});

describe("plan selection", () => {
  it("marks the current active plan and disables reactivation", () => {
    render(<PlansClient plans={PLAN_CATALOG} initialSubscription={{ plan: "Keen Plus", status: "ACTIVE", currentPeriodEnd: "2026-09-30T00:00:00.000Z" }} />);
    expect(screen.getByRole("button", { name: /current active plan/i })).toBeDisabled();
  });

  it("describes replacement and cancellation sends no request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<PlansClient plans={PLAN_CATALOG} initialSubscription={{ plan: "Keen Trial", status: "TRIAL", currentPeriodEnd: "2026-09-07T00:00:00.000Z" }} />);
    await user.click(screen.getAllByRole("button", { name: /switch to this plan/i })[0]);
    expect(screen.getByRole("alertdialog")).toHaveTextContent(/replace Keen Trial immediately/i);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("activates a selected plan and updates the current state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { subscription: { plan: "Keen Essential", status: "ACTIVE", currentPeriodEnd: "2026-09-30T00:00:00.000Z" } } }) }));
    const user = userEvent.setup();
    render(<PlansClient plans={PLAN_CATALOG} initialSubscription={{ plan: null, status: "NO_SUBSCRIPTION", currentPeriodEnd: null }} />);
    await user.click(screen.getAllByRole("button", { name: /select this plan/i })[0]);
    await user.click(screen.getByRole("button", { name: /confirm activation/i }));
    expect(await screen.findByRole("button", { name: /current active plan/i })).toBeDisabled();
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Keen Essential is now active.");
    expect(mocks.refresh).toHaveBeenCalled();
  });
});
