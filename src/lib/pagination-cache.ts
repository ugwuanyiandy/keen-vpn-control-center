export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedData<T> = { items: T[]; pagination: PaginationMeta };

type CacheEntry = { data?: unknown; promise?: Promise<unknown> };

const MAX_ENTRIES = 60;
const cache = new Map<string, CacheEntry>();
const generations = new Map<string, number>();

export function paginationCacheKey(endpoint: string, params: Record<string, string | number>) {
  const normalized = new URLSearchParams(
    Object.entries(params)
      .map(([key, value]) => [key, String(value)] as [string, string])
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  return `${endpoint}?${normalized.toString()}`;
}

function touch(key: string, entry: CacheEntry) {
  cache.delete(key);
  cache.set(key, entry);
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value as string | undefined;
    if (oldest) cache.delete(oldest);
  }
}

export function seedPageCache<T>(endpoint: string, params: Record<string, string | number>, data: T) {
  touch(paginationCacheKey(endpoint, params), { data });
}

export function getCachedPage<T>(endpoint: string, params: Record<string, string | number>) {
  const key = paginationCacheKey(endpoint, params);
  const entry = cache.get(key);
  if (!entry?.data) return undefined;
  touch(key, entry);
  return entry.data as T;
}

export async function fetchCachedPage<T>(
  endpoint: string,
  params: Record<string, string | number>,
  options: { revalidate?: boolean; signal?: AbortSignal } = {},
) {
  const key = paginationCacheKey(endpoint, params);
  const generation = generations.get(endpoint) ?? 0;
  const existing = cache.get(key);
  if (existing?.promise) return existing.promise as Promise<T>;
  if (existing?.data && !options.revalidate) return existing.data as T;

  const promise = (async () => {
    const response = await fetch(key, { signal: options.signal });
    const payload = (await response.json()) as { data?: T; error?: { message?: string } };
    if (!response.ok || !payload.data) {
      throw new Error(payload.error?.message ?? "Unable to load this page.");
    }
    if ((generations.get(endpoint) ?? 0) === generation) touch(key, { data: payload.data });
    return payload.data;
  })();

  touch(key, { data: existing?.data, promise });
  try {
    return await promise;
  } catch (error) {
    if (existing?.data) touch(key, { data: existing.data });
    else cache.delete(key);
    throw error;
  }
}

export function prefetchAdjacentPages<T>(
  endpoint: string,
  params: Record<string, string | number>,
  pagination: PaginationMeta,
) {
  for (const page of [pagination.page - 1, pagination.page + 1]) {
    if (page < 1 || page > pagination.totalPages) continue;
    void fetchCachedPage<PaginatedData<T>>(endpoint, { ...params, page }).catch(() => undefined);
  }
}

export function invalidatePageCache(endpointPrefix: string) {
  generations.set(endpointPrefix, (generations.get(endpointPrefix) ?? 0) + 1);
  for (const key of cache.keys()) {
    if (key.startsWith(endpointPrefix)) cache.delete(key);
  }
}

export function clearPageCache() {
  cache.clear();
  generations.clear();
}

export function pageCacheSize() {
  return cache.size;
}
