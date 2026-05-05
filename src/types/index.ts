/**
 * HarchOS SDK Type Definitions — Barrel Export
 */

// Sovereignty branded types
export type {
  Brand,
  SovereigntyLevel,
  SovereignRegion,
  SovereignConfig,
  SovereignConfigInput,
  DataClassification,
} from "./sovereignty.js";

export {
  brand,
  SovereigntyLevel as createSovereigntyLevel,
  SovereignRegion as createSovereignRegion,
  isSovereignRegion,
  createSovereignConfig,
  DataClassification as createDataClassification,
} from "./sovereignty.js";

// Common types
export type {
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
  ApiErrorResponse,
  ApiResult,
  ResponseMeta,
  SortOrder,
  SortParams,
  Timestamps,
  ResourceMetadata,
  SovereigntyAnnotations,
  HealthStatus,
  HealthCheck,
  RequestOptions,
  ListParams,
} from "./common.js";

// Workload types
export type {
  WorkloadState,
  WorkloadType,
  ComputeResources,
  AutoScalingConfig,
  Workload,
  CreateWorkloadRequest,
  CreateWorkloadResponse,
  UpdateWorkloadRequest,
  UpdateWorkloadResponse,
  WorkloadMetrics,
  WorkloadEventType,
  WorkloadEvent,
  WorkloadLogEntry,
  ListWorkloadsParams,
} from "./workloads.js";

// Model types
export type {
  ModelCategory,
  ModelLicense,
  QuantizationLevel,
  Model,
  ModelVariant,
  ListModelsParams,
} from "./models.js";

// Hub types
export type {
  HubState,
  HubTier,
  HubResources,
  Hub,
  HubMetrics,
  HubConnectivityResult,
  ListHubsParams,
} from "./hubs.js";

// Energy types
export type {
  EnergySource,
  CarbonIntensity,
  CarbonForecastPoint,
  EnergyConsumption,
  EnergyBudget,
  GreenSchedulingWindow,
  ListEnergyConsumptionParams,
  GetCarbonIntensityParams,
} from "./energy.js";

// Pricing types
export type {
  PricingPlan,
  BillingRecord,
  CostBreakdown,
  CostEstimate,
  ListPricingPlansParams,
  ListBillingRecordsParams,
  EstimateCostParams,
} from "./pricing.js";

// Region types
export type {
  Region,
  ListRegionsParams,
} from "./regions.js";

// Monitoring types
export type {
  PlatformMetrics,
  DetailedHealth,
} from "./monitoring.js";

// Carbon-aware types
export type {
  CarbonIntensityZone,
  CarbonIntensityZoneList,
  CarbonOptimalHub,
  CarbonOptimalHubParams,
  CarbonOptimizeResult,
  CarbonOptimizeParams,
  CarbonAction,
  CarbonRankedHub,
  CarbonForecast,
  CarbonGreenWindow,
  CarbonMetrics,
  CarbonDashboard,
} from "./carbon.js";
