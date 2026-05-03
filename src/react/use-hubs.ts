/**
 * React Hook: useHubs
 */

import { useState, useEffect, useCallback } from "react";
import type { HarchOSClient } from "../client.js";
import type {
  Hub,
  ListHubsParams,
  PaginatedResponse,
} from "../types/index.js";

export interface UseHubsResult {
  hubs: Hub[];
  totalCount: number;
  hasMore: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useHubs(
  client: HarchOSClient,
  params?: ListHubsParams,
): UseHubsResult {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result: PaginatedResponse<Hub> = await client.hubs.list(params);
      setHubs(result.items);
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [client, params]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { hubs, totalCount, hasMore, loading, error, refetch: fetch };
}
