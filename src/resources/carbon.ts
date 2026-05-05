/**
 * @harchos/sdk v0.3.0 — Carbon Resource + Tracker
 *
 * Carbon-aware scheduling and tracking — HarchOS's unique differentiator.
 * Includes a CarbonTracker that tracks total carbon across multiple requests.
 */

import type { Transport } from './inference.js';
import type {
  CarbonDashboard,
  CarbonForecast,
  CarbonIntensityZone,
  CarbonIntensityZoneList,
  CarbonMetrics,
  CarbonOptimalHub,
  CarbonOptimizeResult,
  CarbonFootprint,
} from '../types.js';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Carbon Tracker
// ---------------------------------------------------------------------------

/**
 * Tracks carbon footprint across multiple inference requests.
 *
 * @example
 * ```ts
 * const tracker = client.carbon.tracker();
 * const r1 = await client.inference.chat.completions.create({...});
 * tracker.record(r1.carbon_footprint);
 * const r2 = await client.inference.chat.completions.create({...});
 * tracker.record(r2.carbon_footprint);
 * console.log(`Total CO2: ${tracker.totalGco2}g`);
 * ```
 */
export class CarbonTracker {
  private _totalGco2 = 0;
  private _totalRenewableWeighted = 0;
  private _totalSavedGco2 = 0;
  private _requestCount = 0;
  private _footprints: CarbonFootprint[] = [];

  /** Total CO2 emitted in grams across all tracked requests */
  get totalGco2(): number {
    return this._totalGco2;
  }

  /** Average renewable percentage across all tracked requests */
  get averageRenewablePercentage(): number {
    if (this._requestCount === 0) return 0;
    return this._totalRenewableWeighted / this._requestCount;
  }

  /** Total CO2 saved vs. industry average in grams */
  get totalSavedGco2(): number {
    return this._totalSavedGco2;
  }

  /** Number of tracked requests */
  get requestCount(): number {
    return this._requestCount;
  }

  /** All recorded carbon footprints */
  get footprints(): readonly CarbonFootprint[] {
    return this._footprints;
  }

  /** Record a carbon footprint from a response */
  record(footprint: CarbonFootprint): this {
    this._totalGco2 += footprint.gco2;
    this._totalRenewableWeighted += footprint.renewable_percentage;
    this._totalSavedGco2 += footprint.saved_vs_average_gco2;
    this._requestCount += 1;
    this._footprints.push(footprint);
    return this;
  }

  /** Reset all tracked data */
  reset(): this {
    this._totalGco2 = 0;
    this._totalRenewableWeighted = 0;
    this._totalSavedGco2 = 0;
    this._requestCount = 0;
    this._footprints = [];
    return this;
  }

  /** Get a summary object */
  summary(): {
    totalGco2: number;
    averageRenewablePercentage: number;
    totalSavedGco2: number;
    requestCount: number;
  } {
    return {
      totalGco2: this._totalGco2,
      averageRenewablePercentage: this.averageRenewablePercentage,
      totalSavedGco2: this._totalSavedGco2,
      requestCount: this._requestCount,
    };
  }
}

// ---------------------------------------------------------------------------
// Carbon Resource
// ---------------------------------------------------------------------------

export class CarbonResource {
  constructor(private readonly transport: Transport) {}

  /** Get real-time carbon intensity for an electricity zone. */
  async intensity(zone: string): Promise<CarbonIntensityZone> {
    return this.transport.request<CarbonIntensityZone>('GET', `/carbon/intensity/${zone}`);
  }

  /** Get carbon intensity for all known zones. */
  async listIntensities(): Promise<CarbonIntensityZoneList> {
    return this.transport.request<CarbonIntensityZoneList>('GET', '/carbon/intensity');
  }

  /** Find the carbon-optimal hub for a workload. */
  async optimalHub(params?: OptimalHubParams): Promise<CarbonOptimalHub> {
    return this.transport.request<CarbonOptimalHub>('POST', '/carbon/optimal-hub', params ?? {});
  }

  /** Optimize a workload's scheduling based on carbon intensity. */
  async optimize(params: OptimizeParams): Promise<CarbonOptimizeResult> {
    return this.transport.request<CarbonOptimizeResult>('POST', '/carbon/optimize', params);
  }

  /** Get a carbon intensity forecast for a zone. */
  async forecast(zone: string, hours = 24): Promise<CarbonForecast> {
    return this.transport.request<CarbonForecast>('GET', `/carbon/forecast/${zone}`, undefined, {
      headers: { 'X-Query-Hours': String(hours) },
    });
  }

  /** Get aggregate carbon metrics for the platform. */
  async metrics(periodDays = 30): Promise<CarbonMetrics> {
    return this.transport.request<CarbonMetrics>('GET', '/carbon/metrics', undefined, {
      headers: { 'X-Period-Days': String(periodDays) },
    });
  }

  /** Get full carbon-aware dashboard data. */
  async dashboard(): Promise<CarbonDashboard> {
    return this.transport.request<CarbonDashboard>('GET', '/carbon/dashboard');
  }

  /**
   * Create a new CarbonTracker instance for tracking carbon across multiple requests.
   *
   * @example
   * ```ts
   * const tracker = client.carbon.tracker();
   * const r1 = await client.inference.chat.completions.create({...});
   * tracker.record(r1.carbon_footprint);
   * console.log(`Total CO2: ${tracker.totalGco2}g`);
   * ```
   */
  tracker(): CarbonTracker {
    return new CarbonTracker();
  }
}
