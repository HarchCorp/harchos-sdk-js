/**
 * Energy type definitions for HarchOS SDK.
 *
 * HarchOS is carbon-aware — these types track energy consumption,
 * carbon intensity, and renewable energy metrics.
 */

import type { Timestamps } from "./common.js";
import type { SovereignRegion } from "./sovereignty.js";

// ─── Energy Source ──────────────────────────────────────────────────────────

export type EnergySource =
  | "solar"
  | "wind"
  | "hydro"
  | "geothermal"
  | "nuclear"
  | "natural_gas"
  | "coal"
  | "grid_mix";

// ─── Carbon Intensity ───────────────────────────────────────────────────────

export interface CarbonIntensity {
  region: SovereignRegion;
  /** Carbon intensity in gCO2e/kWh */
  gco2ePerKwh: number;
  /** Percentage of renewable energy */
  renewablePercentage: number;
  /** Primary energy source */
  primarySource: EnergySource;
  /** When this measurement was taken */
  measuredAt: string;
  /** Forecasted carbon intensities (next 24h, hourly) */
  forecast?: CarbonForecastPoint[];
}

export interface CarbonForecastPoint {
  /** ISO timestamp for the forecast hour */
  timestamp: string;
  /** Forecasted carbon intensity in gCO2e/kWh */
  gco2ePerKwh: number;
  /** Forecasted renewable percentage */
  renewablePercentage: number;
}

// ─── Energy Consumption ─────────────────────────────────────────────────────

export interface EnergyConsumption {
  /** Resource ID (workload, hub, etc.) */
  resourceId: string;
  /** Resource type */
  resourceType: "workload" | "hub" | "cluster";
  region: SovereignRegion;
  /** Energy consumed in kWh */
  kwhConsumed: number;
  /** Carbon emitted in gCO2e */
  carbonGco2e: number;
  /** Renewable portion of consumed energy (0-1) */
  renewableFraction: number;
  /** Time period start */
  periodStart: string;
  /** Time period end */
  periodEnd: string;
}

// ─── Energy Budget ──────────────────────────────────────────────────────────

export interface EnergyBudget {
  id: string;
  name: string;
  region: SovereignRegion;
  /** Maximum kWh allowed per billing period */
  maxKwhPerPeriod: number;
  /** Maximum carbon budget in gCO2e per billing period */
  maxCarbonGco2ePerPeriod: number;
  /** Current consumption this period */
  currentKwh: number;
  /** Current carbon this period */
  currentCarbonGco2e: number;
  /** Whether to auto-scale down when budget is exceeded */
  autoScaleDown: boolean;
  /** Alert threshold as fraction (0-1) of budget */
  alertThreshold: number;
  timestamps: Timestamps;
}

// ─── Green Scheduling Window ────────────────────────────────────────────────

export interface GreenSchedulingWindow {
  region: SovereignRegion;
  /** Start time of the window */
  startsAt: string;
  /** End time of the window */
  endsAt: string;
  /** Average carbon intensity during window (gCO2e/kWh) */
  avgCarbonIntensity: number;
  /** Average renewable percentage during window */
  avgRenewablePercentage: number;
  /** Recommended for carbon-aware scheduling */
  recommended: boolean;
}

// ─── List Params ────────────────────────────────────────────────────────────

export interface ListEnergyConsumptionParams {
  resourceId?: string;
  resourceType?: "workload" | "hub" | "cluster";
  region?: SovereignRegion;
  periodStart?: string;
  periodEnd?: string;
  limit?: number;
  cursor?: string;
}

export interface GetCarbonIntensityParams {
  region?: SovereignRegion;
  includeForecast?: boolean;
}
