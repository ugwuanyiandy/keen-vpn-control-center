import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ServersClient } from "@/components/servers-client";

const london = {
  id: "cm12345678901234567890123",
  country: "United Kingdom",
  city: "London",
  hostname: "lon-01.keenvpn.net",
  active: true,
  latencyMs: 28,
  createdAt: "2026-08-29T10:00:00.000Z",
  updatedAt: "2026-08-29T10:00:00.000Z",
};

const paris = {
  ...london,
  id: "cm22345678901234567890123",
  country: "France",
  city: "Paris",
  hostname: "par-01.keenvpn.net",
  latencyMs: 35,
};

const data = {
  items: [london, paris],
  pagination: { page: 1, pageSize: 12, total: 2, totalPages: 1 },
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("customer server pinning", () => {
  it("pins immediately and rolls back when persistence fails", async () => {
    let finishRequest!: (value: unknown) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise((resolve) => { finishRequest = resolve; })));
    const user = userEvent.setup();
    render(<ServersClient initialData={data} initialPinnedServer={null} />);

    const button = screen.getAllByRole("button", { name: /pin this location/i })[0];
    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");

    await act(async () => {
      finishRequest({ ok: false, json: async () => ({ error: { message: "Server unavailable." } }) });
    });

    expect(await screen.findByText(/previous preference was restored/i)).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("asks before switching and cancel preserves the previous location", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ServersClient initialData={data} initialPinnedServer={london} />);

    await user.click(screen.getByRole("button", { name: /pin this location/i }));
    const dialog = screen.getByRole("alertdialog", { name: /disconnect from london/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/make paris, france your preferred server/i);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pinned location/i })).toHaveAttribute("aria-pressed", "true");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("optimistically switches after confirmation and rolls back on failure", async () => {
    let finishRequest!: (value: unknown) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise((resolve) => { finishRequest = resolve; })));
    const user = userEvent.setup();
    render(<ServersClient initialData={data} initialPinnedServer={london} />);

    const parisButton = screen.getByRole("button", { name: /pin this location/i });
    await user.click(parisButton);
    await user.click(screen.getByRole("button", { name: /disconnect and switch/i }));
    expect(parisButton).toHaveAttribute("aria-pressed", "true");

    await act(async () => {
      finishRequest({ ok: false, json: async () => ({ error: { message: "Switch failed." } }) });
    });

    expect(await screen.findByText(/previous preference was restored/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pinned location/i })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("server pagination", () => {
  it("returns to the top when moving to another results page", async () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const user = userEvent.setup();
    render(
      <ServersClient
        initialData={{ ...data, pagination: { ...data.pagination, total: 24, totalPages: 2 } }}
        initialPinnedServer={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});

describe("administrator server controls", () => {
  it("shows management actions and an active-state switch instead of pin controls", async () => {
    const user = userEvent.setup();
    render(<ServersClient initialData={{ ...data, items: [london] }} initialPinnedServer={null} isAdmin />);

    expect(screen.getByRole("button", { name: /add server/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pin this location/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("switch", { name: /location active/i })).toBeChecked();
  });

  it("requires confirmation before permanent deletion", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ServersClient initialData={{ ...data, items: [london] }} initialPinnedServer={null} isAdmin />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("alertdialog", { name: /delete london/i })).toHaveTextContent("lon-01.keenvpn.net");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
