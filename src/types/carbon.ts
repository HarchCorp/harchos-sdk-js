/**
 * Carbon-aware scheduling type definitions for HarchOS SDK.
 *
 * HarchOS is the ONLY platform with native carbon-aware GPU orchestration.
 * These types support carbon intensity queries, optimal hub selection,
 * workload optimization, and carbon forecasting.
 */

import type { SovereignRegion } from "./sovereignty.js";

// ─── Carbon Intensity Zone ──────────────────────────────────────────────────

export interface CarbonIntensityZone {
  /** Electricity Maps zone code (e.g. 'MA', 'FR', 'DE') */
  zone: string;
  /** Carbon intensity in gCO2/kWh */
  carbonIntensityGco2Kwh: number;
  /** Renewable energy percentage */
  renewablePercentage: number | null;
  /** Fossil fuel percentage */
  fossilPercentage: number | null;
  /** Timestamp of the data */
  updatedAt: string;
}

export interface CarbonIntensityZoneList {
  zones: CarbonIntensityZone[];
}

// ─── Carbon Optimal Hub ─────────────────────────────────────────────────────

export interface CarbonOptimalHub {
  /** Recommended hub name */
  recommendedHubName: string;
  /** Hub ID */
  hubId: string | null;
  /** Carbon intensity at the recommended hub */
  carbonIntensityGco2Kwh: number;
  /** Whether scheduling now is recommended */
  scheduleNow: boolean;
  /** Hours to defer if not scheduling now */
  deferHours: number | null;
  /** Reason for the recommendation */
  reason: string | null;
}

// ─── Carbon Optimize Result ─────────────────────────────────────────────────

export type CarbonAction = "schedule_now" | "defer" | "reject";

export interface CarbonOptimizeResult {
  /** Workload name */
  workloadName: string;
  /** Recommended action */
  action: CarbonAction;
  /** Recommended hub */
  recommendedHub: string | null;
  /** Carbon intensity at recommended hub */
  carbonIntensityGco2Kwh: number | null;
  /** CO2 saved in kg vs non-carbon-aware scheduling */
  carbonSavedKg: number | null;
  /** Hours to defer if action is 'defer' */
  deferHours: number | null;
  /** Reason for the action */
  reason: string | null;
  /** Ranked list of hubs by carbon intensity */
  rankedHubs: CarbonRankedHub[];
}

export interface CarbonRankedHub {
  hubName: string;
  carbonIntensityGco2Kwh: number;
  availableGpus: number;
  score: number;
}

// ─── Carbon Forecast ────────────────────────────────────────────────────────

export interface CarbonForecastPoint {
  /** ISO timestamp */
  datetime: string;
  /** Forecasted carbon intensity in gCO2/kWh */
  carbonIntensityGco2Kwh: number;
  /** Forecasted renewable percentage */
  renewablePercentage: number;
}

export interface CarbonForecast {
  zone: string;
  forecastPoints: CarbonForecastPoint[];
  greenWindows: CarbonGreenWindow[];
}

export interface CarbonGreenWindow {
  start: string;
  end: string;
  renewablePercentage: number;
  avgCarbonIntensityGco2Kwh: number;
}

// ─── Carbon Metrics ─────────────────────────────────────────────────────────

export interface CarbonMetrics {
  totalCarbonSavedKg: number;
  greenSchedulesCount: number;
  averageRenewablePercentage: number;
  totalWorkloadsOptimized: number;
  periodDays: number;
}

// ─── Carbon Dashboard ───────────────────────────────────────────────────────

export interface CarbonDashboard {
  metrics: CarbonMetrics;
  intensities: CarbonIntensityZone[];
  recentActions: CarbonOptimizeResult[];
}

// ─── Carbon Optimize Params ─────────────────────────────────────────────────

export interface CarbonOptimizeParams {
  workloadName: string;
  workloadType?: string;
  gpuCount?: number;
  gpuType?: string;
  cpuCores?: number;
  memoryGb?: number;
  priority?: string;
  carbonAware?: boolean;
  carbonMaxGco2?: number;
  region?: SovereignRegion;
  estimatedDurationHours?: number;
}

export interface CarbonOptimalHubParams {
  region?: SovereignRegion;
  gpuCount?: number;
  gpuType?: string;
  carbonMaxGco2?: number;
  priority?: string;
  deferOk?: boolean;
}
