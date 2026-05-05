/**
 * React Hook: useWorkloads
 *
 * Provides stateful access to HarchOS workload operations
 * with automatic loading, error, and refetch support.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { HarchOSClient } from "../client.js";
import type {
  Workload,
  ListWorkloadsParams,
  PaginatedResponse,
} from "../types/index.js";

export interface UseWorkloadsResult {
  workloads: Workload[];
  totalCount: number;
  hasMore: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  fetchMore: () => Promise<void>;
}

export function useWorkloads(
  client: HarchOSClient,
  params?: ListWorkloadsParams,
): UseWorkloadsResult {
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cursorRef = useRef<string | null>(null);
  const paramsRef = useRef(params);

  // Memoize params by serialized key to avoid infinite re-render loops
  const paramsKey = JSON.stringify(params);
  const memoizedParams = useMemo(() => params, [paramsKey]);

  const fetch = useCallback(async (append: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const result: PaginatedResponse<Workload> = await client.workloads.list({
        ...paramsRef.current,
        cursor: append ? cursorRef.current ?? undefined : undefined,
      });

      if (append) {
        setWorkloads((prev: Workload[]) => [...prev, ...result.items]);
      } else {
        setWorkloads(result.items);
      }
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
      cursorRef.current = result.nextCursor;
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [client]);

  const refetch = useCallback(() => {
    cursorRef.current = null;
    fetch(false);
  }, [fetch]);

  const fetchMore = useCallback(async () => {
    if (hasMore && !loading) {
      await fetch(true);
    }
  }, [fetch, hasMore, loading]);

  useEffect(() => {
    paramsRef.current = memoizedParams;
    cursorRef.current = null;
    fetch(false);
  }, [fetch, memoizedParams]);

  return { workloads, totalCount, hasMore, loading, error, refetch, fetchMore };
}
