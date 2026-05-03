/**
 * Hub type definitions for HarchOS SDK.
 *
 * Hubs are sovereign data center clusters providing compute
 * infrastructure across African regions.
 */

import type { Timestamps, ResourceMetadata, HealthStatus } from "./common.js";
import type { SovereignRegion, SovereigntyLevel } from "./sovereignty.js";

// ─── Hub States ─────────────────────────────────────────────────────────────

export type HubState = "active" | "maintenance" | "offline" | "provisioning";

// ─── Hub Tier ───────────────────────────────────────────────────────────────

export type HubTier = "community" | "enterprise" | "sovereign";

// ─── Hub Resources ──────────────────────────────────────────────────────────

export interface HubResources {
  totalGpuUnits: number;
  availableGpuUnits: number;
  gpuTypes: string[];
  totalCpuCores: number;
  availableCpuCores: number;
  totalMemoryGb: number;
  availableMemoryGb: number;
  totalStorageTb: number;
  availableStorageTb: number;
}

// ─── Hub ────────────────────────────────────────────────────────────────────

export interface Hub {
  id: string;
  name: string;
  displayName: string;
  description: string;
  region: SovereignRegion;
  /** Physical city location */
  city: string;
  /** Country */
  country: string;
  state: HubState;
  tier: HubTier;
  /** URL for API endpoint routed to this hub */
  endpoint: string;
  resources: HubResources;
  health: HealthStatus;
  sovereignty: SovereigntyLevel;
  /** Number of workloads currently running */
  activeWorkloads: number;
  /** Carbon intensity of this hub's energy grid (gCO2e/kWh) */
  carbonIntensityGco2eKwh: number;
  /** Percentage of renewable energy */
  renewablePercentage: number;
  /** Network latency to hub in ms (from client perspective) */
  latencyMs?: number;
  metadata?: ResourceMetadata;
  timestamps: Timestamps;
}

// ─── Hub Metrics ────────────────────────────────────────────────────────────

export interface HubMetrics {
  hubId: string;
  gpuUtilization: number;
  cpuUtilization: number;
  memoryUtilization: number;
  activeWorkloads: number;
  pendingWorkloads: number;
  carbonIntensityGco2eKwh: number;
  renewablePercentage: number;
  averageLatencyMs: number;
  timestamp: string;
}

// ─── Hub Connectivity Test ──────────────────────────────────────────────────

export interface HubConnectivityResult {
  hubId: string;
  reachable: boolean;
  latencyMs: number | null;
  error?: string;
  checkedAt: string;
}

// ─── List Params ────────────────────────────────────────────────────────────

export interface ListHubsParams {
  region?: SovereignRegion;
  tier?: HubTier;
  state?: HubState;
  available?: boolean;
  limit?: number;
  cursor?: string;
}
