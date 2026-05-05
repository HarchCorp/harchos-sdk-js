/**
 * @harchos/sdk — The Official TypeScript/JavaScript SDK for HarchOS
 *
 * HarchOS is the Operating System for Sovereign AI Infrastructure.
 * This SDK provides typed access to the HarchOS API with sovereign defaults:
 * region="morocco", sovereignty="strict", carbon_aware=true.
 *
 * @example
 * ```ts
 * import { HarchOSClient } from "@harchos/sdk";
 *
 * const client = new HarchOSClient({ apiKey: "hsk_..." });
 *
 * // Carbon-aware scheduling — HarchOS's key differentiator
 * const carbon = await client.carbon.getIntensity("MA");
 * console.log(`Morocco: ${carbon.carbon_intensity_gco2_kwh} gCO2/kWh`);
 * console.log(`Renewable: ${carbon.renewable_percentage}%`);
 *
 * // Find the greenest hub for your workload
 * const optimal = await client.carbon.optimalHub({ region: "morocco", gpu_count: 4 });
 * console.log(`Best hub: ${optimal.recommended_hub_name}`);
 *
 * // List all hubs
 * const hubs = await client.hubs.list();
 *
 * // Create a workload
 * const workload = await client.workloads.create({
 *   name: "training-job",
 *   workload_type: "training",
 *   compute: { gpu_count: 4, gpu_type: "a100" },
 *   carbon_aware: true,
 * });
 * ```
 *
 * @module @harchos/sdk
 */

// Client
export { HarchOSClient, type ClientOptions } from "./client.js";

// Errors
export {
  HarchOSError,
  AuthenticationError,
  InvalidAPIKeyError,
  APIKeyExpiredError,
  PermissionDeniedError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  SovereigntyError,
  DataResidencyError,
  CarbonBudgetExceededError,
  ValidationError,
  TimeoutError,
  ConnectionError,
} from "./errors.js";

// Models
export type {
  PaginationMeta,
  ResourceMetadata,
  HealthStatus,
  FuelMixEntry,
  CarbonIntensityZone,
  CarbonIntensityZoneList,
  CarbonOptimalHub,
  CarbonOptimizeResult,
  CarbonForecastPoint,
  CarbonForecast,
  CarbonMetrics,
  CarbonDashboard,
  HubStatus,
  HubTier,
  HubCapacity,
  HubSpec,
  Hub,
  HubList,
  WorkloadStatus,
  WorkloadType,
  ComputeRequirements,
  WorkloadSpec,
  Workload,
  WorkloadList,
  EnergyConsumption,
  EnergySource,
  EnergySummary,
  EnergyReport,
  ModelStatus,
  ModelSize,
  ModelCapabilities,
  ModelSpec,
  Model,
  ModelList,
  PricingPlan,
  CostBreakdown,
  CostEstimate,
  Region,
  PlatformMetrics,
  DetailedHealth,
} from "./models.js";

// Resources (for advanced usage)
export { CarbonResource, type OptimalHubParams, type OptimizeParams } from "./resources/carbon.js";
export { HubsResource, type ListHubsParams } from "./resources/hubs.js";
export { WorkloadsResource, type ListWorkloadsParams } from "./resources/workloads.js";
export { EnergyResource } from "./resources/energy.js";
export { ModelsResource, type ListModelsParams } from "./resources/models.js";
export { PricingResource, type EstimateCostParams } from "./resources/pricing.js";
export { RegionsResource } from "./resources/regions.js";
export { MonitoringResource } from "./resources/monitoring.js";

// Version
export const VERSION = "0.2.1";
