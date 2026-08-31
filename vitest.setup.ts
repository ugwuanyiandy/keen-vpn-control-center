import "@testing-library/jest-dom/vitest";

process.env.DATABASE_URL ??= "postgresql://keen:keen@localhost:5432/keenvpn_test?schema=public";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverMock as typeof ResizeObserver;
