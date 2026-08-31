"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchCachedPage,
  getCachedPage,
  type PaginatedData,
  paginationCacheKey,
  prefetchAdjacentPages,
  seedPageCache,
} from "@/lib/pagination-cache";

export function usePaginatedResource<T>({
  endpoint,
  params,
  initialData,
  debounceMs = 0,
}: {
  endpoint: string;
  params: Record<string, string | number>;
  initialData?: PaginatedData<T>;
  debounceMs?: number;
}) {
  const key = useMemo(() => paginationCacheKey(endpoint, params), [endpoint, params]);
  const [seed] = useState(() => {
    if (initialData) seedPageCache(endpoint, params, initialData);
    return { key, data: initialData };
  });
  const [loaded, setLoaded] = useState<{ key: string; data: PaginatedData<T> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cached = getCachedPage<PaginatedData<T>>(endpoint, params);
  const data = loaded?.key === key ? loaded.data : cached ?? (seed.key === key ? seed.data : undefined);

  const load = useCallback(
    async (revalidate = true) => {
      const current = getCachedPage<PaginatedData<T>>(endpoint, params);
      setLoading(!current);
      setError("");
      try {
        const next = await fetchCachedPage<PaginatedData<T>>(endpoint, params, { revalidate });
        setLoaded({ key, data: next });
        prefetchAdjacentPages<T>(endpoint, params, next.pagination);
        return next;
      } catch (loadError) {
        setError((loadError as Error).message);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, key, params],
  );

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(async () => {
      setLoading(!getCachedPage<PaginatedData<T>>(endpoint, params));
      const next = await fetchCachedPage<PaginatedData<T>>(endpoint, params, { revalidate: true }).catch(
        (loadError: Error) => {
          if (active) setError(loadError.message);
          return undefined;
        },
      );
      if (!active) return;
      if (next) {
        setLoaded({ key, data: next });
        setError("");
        prefetchAdjacentPages<T>(endpoint, params, next.pagination);
      }
      setLoading(false);
    }, debounceMs);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [debounceMs, endpoint, key, params]);

  return { data, loading, error, refresh: load };
}
