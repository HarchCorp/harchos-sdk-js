/**
 * Carbon Resource Module for HarchOS SDK.
 *
 * HarchOS's key differentiator: native carbon-aware GPU orchestration.
 * Use this resource to query carbon intensity, find the greenest hub,
 * optimize workload scheduling, and track carbon savings.
 */

import type { HttpClient } from "../client.js";
import type {
  CarbonIntensityZone,
  CarbonIntensityZoneList,
  CarbonOptimalHub,
  CarbonOptimalHubParams,
  CarbonOptimizeResult,
  CarbonOptimizeParams,
  CarbonForecast,
  CarbonMetrics,
  CarbonDashboard,
} from "../types/carbon.js";
import type { RequestOptions } from "../types/index.js";

export class CarbonResource {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** Get real-time carbon intensity for an electricity zone */
  async getIntensity(
    zone: string,
    opts?: RequestOptions,
  ): Promise<CarbonIntensityZone> {
    return this.client.get<CarbonIntensityZone>(
      `/carbon/intensity/${zone}`,
      opts,
    );
  }

  /** Get carbon intensity for all known zones */
  async listIntensities(
    opts?: RequestOptions,
  ): Promise<CarbonIntensityZoneList> {
    return this.client.get<CarbonIntensityZoneList>(
      "/carbon/intensity",
      opts,
    );
  }

  /** Find the carbon-optimal hub for a workload */
  async optimalHub(
    params?: CarbonOptimalHubParams,
    opts?: RequestOptions,
  ): Promise<CarbonOptimalHub> {
    return this.client.post<CarbonOptimalHub>(
      "/carbon/optimal-hub",
      { body: params ?? {}, ...opts },
    );
  }

  /** Optimize a workload's scheduling based on carbon intensity */
  async optimize(
    params: CarbonOptimizeParams,
    opts?: RequestOptions,
  ): Promise<CarbonOptimizeResult> {
    return this.client.post<CarbonOptimizeResult>(
      "/carbon/optimize",
      { body: params, ...opts },
    );
  }

  /** Get a carbon intensity forecast for a zone */
  async getForecast(
    zone: string,
    params?: { hours?: number },
    opts?: RequestOptions,
  ): Promise<CarbonForecast> {
    return this.client.get<CarbonForecast>(
      `/carbon/forecast/${zone}`,
      { query: params, ...opts },
    );
  }

  /** Get aggregate carbon metrics for the platform */
  async getMetrics(
    params?: { periodDays?: number },
    opts?: RequestOptions,
  ): Promise<CarbonMetrics> {
    return this.client.get<CarbonMetrics>(
      "/carbon/metrics",
      { query: params, ...opts },
    );
  }

  /** Get full carbon-aware dashboard data */
  async getDashboard(
    opts?: RequestOptions,
  ): Promise<CarbonDashboard> {
    return this.client.get<CarbonDashboard>(
      "/carbon/dashboard",
      opts,
    );
  }
}
