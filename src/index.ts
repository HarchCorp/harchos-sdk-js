/**
 * @harchos/sdk — Official TypeScript/JavaScript SDK for HarchOS
 *
 * Sovereign AI Infrastructure for Africa.
 *
 * @packageDocumentation
 */

// ─── Client ─────────────────────────────────────────────────────────────────

export { HarchOSClient, type HarchOSClientOptions, type HttpClient, type HttpRequestOptions } from "./client.js";

// ─── Configuration ──────────────────────────────────────────────────────────

export {
  resolveConfig,
  registerProfile,
  updateProfile,
  getProfile,
  listProfiles,
  registerDefaultProfile,
  type ClientConfig,
  type ProfileConfig,
  type ResolveConfigOptions,
} from "./config.js";

// ─── Authentication ─────────────────────────────────────────────────────────

export {
  AuthManager,
  apiKeyAuth,
  oauth2Auth,
  type ApiKeyAuth,
  type OAuth2Auth,
  type AuthProvider,
  type TokenInfo,
} from "./auth.js";

// ─── Errors ─────────────────────────────────────────────────────────────────

export {
  HarchOSError,
  AuthenticationError,
  TokenExpiredError,
  ForbiddenError,
  ConfigurationError,
  MissingProfileError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  CircuitOpenError,
  SovereigntyViolationError,
  ResourceNotFoundError,
  WorkloadConflictError,
  EnergyInsufficientError,
  StreamDisconnectedError,
  isHarchOSError,
  isErrorCode,
  type HarchOSErrorCode,
} from "./errors.js";

// ─── Circuit Breaker ────────────────────────────────────────────────────────

export {
  CircuitBreaker,
  createCircuitBreaker,
  type CircuitBreakerConfig,
  type CircuitState,
  type CircuitBreakerStats,
} from "./circuit-breaker.js";

// ─── Retry ──────────────────────────────────────────────────────────────────

export {
  withRetry,
  createRetryWrapper,
  isRetryableError,
  calculateDelay,
  type RetryConfig,
  type RetryResult,
} from "./retry.js";

// ─── Streaming ──────────────────────────────────────────────────────────────

export {
  StreamClient,
  createStream,
  type StreamingConfig,
  type StreamMessage,
  type ConnectionState,
  type StreamEvents,
  type StreamMessageOf,
} from "./streaming.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export type {
  // Sovereignty
  Brand,
  SovereigntyLevel,
  SovereignRegion,
  SovereignConfig,
  SovereignConfigInput,
  DataClassification,
} from "./types/sovereignty.js";

export {
  brand,
  createSovereignConfig,
  isSovereignRegion,
} from "./types/sovereignty.js";

export type {
  // Common
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
} from "./types/common.js";

export type {
  // Workloads
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
} from "./types/workloads.js";

export type {
  // Models
  ModelCategory,
  ModelLicense,
  QuantizationLevel,
  Model,
  ModelVariant,
  ListModelsParams,
} from "./types/models.js";

export type {
  // Hubs
  HubState,
  HubTier,
  HubResources,
  Hub,
  HubMetrics,
  HubConnectivityResult,
  ListHubsParams,
} from "./types/hubs.js";

export type {
  // Energy
  EnergySource,
  CarbonIntensity,
  CarbonForecastPoint,
  EnergyConsumption,
  EnergyBudget,
  GreenSchedulingWindow,
  ListEnergyConsumptionParams,
  GetCarbonIntensityParams,
} from "./types/energy.js";

export type {
  // Pricing
  PricingPlan,
  BillingRecord,
  CostBreakdown,
  CostEstimate,
  ListPricingPlansParams,
  ListBillingRecordsParams,
  EstimateCostParams,
} from "./types/pricing.js";

export type {
  // Regions
  Region,
  ListRegionsParams,
} from "./types/regions.js";

export type {
  // Monitoring
  PlatformMetrics,
  DetailedHealth,
} from "./types/monitoring.js";

// ─── Resource Modules ───────────────────────────────────────────────────────

export { WorkloadsResource } from "./resources/workloads.js";
export { ModelsResource } from "./resources/models.js";
export { HubsResource } from "./resources/hubs.js";
export { EnergyResource } from "./resources/energy.js";
export { PricingResource } from "./resources/pricing.js";
export { RegionsResource } from "./resources/regions.js";
export { MonitoringResource } from "./resources/monitoring.js";
