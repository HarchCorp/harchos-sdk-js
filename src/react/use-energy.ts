/**
 * React Hook: useEnergy
 *
 * Provides access to carbon intensity and energy consumption data.
 */

import { useState, useEffect, useCallback } from "react";
import type { HarchOSClient } from "../client.js";
import type {
  CarbonIntensity,
  EnergyConsumption,
  GetCarbonIntensityParams,
  ListEnergyConsumptionParams,
  PaginatedResponse,
} from "../types/index.js";

export interface UseCarbonIntensityResult {
  data: CarbonIntensity | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCarbonIntensity(
  client: HarchOSClient,
  params?: GetCarbonIntensityParams,
): UseCarbonIntensityResult {
  const [data, setData] = useState<CarbonIntensity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.energy.carbonIntensity(params);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [client, params]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export interface UseEnergyConsumptionResult {
  consumption: EnergyConsumption[];
  totalCount: number;
  hasMore: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useEnergyConsumption(
  client: HarchOSClient,
  params?: ListEnergyConsumptionParams,
): UseEnergyConsumptionResult {
  const [consumption, setConsumption] = useState<EnergyConsumption[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result: PaginatedResponse<EnergyConsumption> =
        await client.energy.consumption(params);
      setConsumption(result.items);
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

  return { consumption, totalCount, hasMore, loading, error, refetch: fetch };
}
