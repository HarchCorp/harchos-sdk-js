/**
 * Carbon-aware scheduling resource for the HarchOS SDK.
 *
 * This is HarchOS's key differentiator: native carbon-aware GPU orchestration.
 */

import type { HttpTransport } from "../http.js";
import type {
  CarbonDashboard,
  CarbonForecast,
  CarbonIntensityZone,
  CarbonIntensityZoneList,
  CarbonMetrics,
  CarbonOptimalHub,
  CarbonOptimizeResult,
} from "../models.js";

export interface OptimalHubParams {
  region?: string;
  gpu_count?: number;
  gpu_type?: string;
  carbon_max_gco2?: number;
  priority?: string;
  defer_ok?: boolean;
}

export interface OptimizeParams {
  workload_name: string;
  workload_type?: string;
  gpu_count?: number;
  gpu_type?: string;
  cpu_cores?: number;
  memory_gb?: number;
  priority?: string;
  carbon_aware?: boolean;
  carbon_max_gco2?: number;
  region?: string;
  estimated_duration_hours?: number;
}

export class CarbonResource {
  constructor(private readonly transport: HttpTransport) {}

  /** Get real-time carbon intensity for an electricity zone. */
  async getIntensity(zone: string): Promise<CarbonIntensityZone> {
    return this.transport.get(`/carbon/intensity/${zone}`);
  }

  /** Get carbon intensity for all known zones. */
  async listIntensities(): Promise<CarbonIntensityZoneList> {
    return this.transport.get("/carbon/intensity");
  }

  /** Find the carbon-optimal hub for a workload. */
  async optimalHub(params?: OptimalHubParams): Promise<CarbonOptimalHub> {
    return this.transport.post("/carbon/optimal-hub", params ?? {});
  }

  /** Optimize a workload's scheduling based on carbon intensity. */
  async optimize(params: OptimizeParams): Promise<CarbonOptimizeResult> {
    return this.transport.post("/carbon/optimize", params);
  }

  /** Get a carbon intensity forecast for a zone. */
  async getForecast(zone: string, hours = 24): Promise<CarbonForecast> {
    return this.transport.get(`/carbon/forecast/${zone}`, { hours });
  }

  /** Get aggregate carbon metrics for the platform. */
  async getMetrics(periodDays = 30): Promise<CarbonMetrics> {
    return this.transport.get("/carbon/metrics", { period_days: periodDays });
  }

  /** Get full carbon-aware dashboard data. */
  async getDashboard(): Promise<CarbonDashboard> {
    return this.transport.get("/carbon/dashboard");
  }
}
