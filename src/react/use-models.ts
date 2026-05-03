/**
 * React Hook: useModels
 */

import { useState, useEffect, useCallback } from "react";
import type { HarchOSClient } from "../client.js";
import type {
  Model,
  ListModelsParams,
  PaginatedResponse,
} from "../types/index.js";

export interface UseModelsResult {
  models: Model[];
  totalCount: number;
  hasMore: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useModels(
  client: HarchOSClient,
  params?: ListModelsParams,
): UseModelsResult {
  const [models, setModels] = useState<Model[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result: PaginatedResponse<Model> = await client.models.list(params);
      setModels(result.items);
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

  return { models, totalCount, hasMore, loading, error, refetch: fetch };
}
