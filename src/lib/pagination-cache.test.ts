import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearPageCache,
  fetchCachedPage,
  getCachedPage,
  pageCacheSize,
  paginationCacheKey,
  prefetchAdjacentPages,
  seedPageCache,
} from "@/lib/pagination-cache";

afterEach(() => {
  clearPageCache();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("pagination cache", () => {
  it("normalizes query keys and isolates different filter combinations", () => {
    expect(paginationCacheKey("/api/servers", { page: 1, q: "paris" })).toBe(
      paginationCacheKey("/api/servers", { q: "paris", page: 1 }),
    );
    seedPageCache("/api/servers", { page: 1, q: "paris" }, { value: "Paris" });
    expect(getCachedPage<{ value: string }>("/api/servers", { q: "paris", page: 1 })?.value).toBe("Paris");
    expect(getCachedPage("/api/servers", { q: "london", page: 1 })).toBeUndefined();
  });

  it("deduplicates concurrent requests", async () => {
    let finish!: (value: unknown) => void;
    const fetchMock = vi.fn(() => new Promise((resolve) => { finish = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    const first = fetchCachedPage("/api/servers", { page: 2 });
    const second = fetchCachedPage("/api/servers", { page: 2 });
    finish({ ok: true, json: async () => ({ data: { items: [], pagination: { page: 2, pageSize: 12, total: 24, totalPages: 2 } } }) });
    await Promise.all([first, second]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("preloads valid adjacent pages and keeps the LRU bounded", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ data: { items: [], pagination: { page: 1, pageSize: 12, total: 36, totalPages: 3 } } }) }));
    vi.stubGlobal("fetch", fetchMock);
    prefetchAdjacentPages("/api/servers", { page: 2, q: "" }, { page: 2, pageSize: 12, total: 36, totalPages: 3 });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    for (let page = 1; page <= 61; page += 1) seedPageCache("/api/users", { page }, { page });
    expect(pageCacheSize()).toBe(60);
    expect(getCachedPage("/api/users", { page: 1 })).toBeUndefined();
  });
});
