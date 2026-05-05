/**
 * Monitoring type definitions for HarchOS SDK.
 *
 * Platform-level metrics and health information for HarchOS
 * infrastructure monitoring.
 */

// ─── Platform Metrics ───────────────────────────────────────────────────────

export interface PlatformMetrics {
  /** Total number of hubs on the platform */
  totalHubs: number;
  /** Total GPUs across all hubs */
  totalGpus: number;
  /** Currently available (idle) GPUs */
  availableGpus: number;
  /** Average GPU utilization across all hubs (0-100) */
  gpuUtilizationPercent: number;
  /** Total workloads ever created */
  totalWorkloads: number;
  /** Currently running workloads */
  activeWorkloads: number;
  /** Total energy consumed (kWh) */
  totalEnergyKwh: number;
  /** Average renewable energy percentage across all hubs (0-100) */
  avgRenewablePercentage: number;
  /** Average carbon intensity across all hubs (gCO2/kWh) */
  avgCarbonIntensity: number;
  /** Average Power Usage Effectiveness across hubs (>= 1.0) */
  avgPue: number;
  /** Total CO2 saved through carbon-aware scheduling (kg) */
  totalCo2SavedKg: number;
}

// ─── Detailed Health ────────────────────────────────────────────────────────

export interface DetailedHealth {
  /** Overall health status */
  status: "healthy" | "degraded" | "unhealthy";
  /** Database connectivity status */
  databaseStatus: "connected" | "degraded" | "disconnected";
  /** API server version (e.g. '0.1.0') */
  apiVersion: string;
  /** Server uptime in seconds */
  uptimeSeconds: number;
  /** Total number of registered API endpoints */
  totalEndpoints: number;
  /** Number of currently active API connections */
  activeConnections: number;
}
