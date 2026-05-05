/**
 * @harchos/sdk v0.3.0 — The Official TypeScript/JavaScript SDK for HarchOS
 *
 * HarchOS is the Operating System for Sovereign AI Infrastructure.
 * This SDK provides typed access to the HarchOS API with sovereign defaults:
 * region="morocco", sovereignty="strict", carbon_aware=true.
 *
 * @example
 * ```ts
 * import HarchOS from '@harchos/sdk';
 *
 * const client = new HarchOS({ apiKey: 'hsk_...' });
 *
 * // Inference — OpenAI-compatible
 * const completion = await client.inference.chat.completions.create({
 *   model: 'harchos-llama-3.3-70b',
 *   messages: [{ role: 'user', content: 'Hello' }],
 *   carbon_aware: true,
 * });
 *
 * // Streaming
 * const stream = await client.inference.chat.completions.create({
 *   model: 'harchos-llama-3.3-70b',
 *   messages: [{ role: 'user', content: 'Hello' }],
 *   stream: true,
 * });
 * for await (const chunk of stream) {
 *   process.stdout.write(chunk.choices[0]?.delta?.content || '');
 * }
 *
 * // Carbon tracking
 * const intensity = await client.carbon.intensity('MA');
 * const optimal = await client.carbon.optimalHub({ region: 'morocco', gpu_count: 4 });
 *
 * // Carbon tracker — tracks total carbon across multiple requests
 * const tracker = client.carbon.tracker();
 * const r1 = await client.inference.chat.completions.create({...});
 * tracker.record(r1.carbon_footprint);
 * const r2 = await client.inference.chat.completions.create({...});
 * tracker.record(r2.carbon_footprint);
 * console.log(`Total CO2: ${tracker.totalGco2}g`);
 *
 * // Workloads
 * const workload = await client.workloads.create({ name: 'test', type: 'training', compute: { gpu_count: 4 } });
 * const workloads = await client.workloads.list();
 *
 * // Hubs
 * const hubs = await client.hubs.list();
 * ```
 *
 * @module @harchos/sdk
 */

// Client
export { HarchOS, type ClientOptions } from './client.js';

// Errors
export {
  HarchOSError,
  AuthenticationError,
  InvalidAPIKeyError,
  PermissionDeniedError,
  BadRequestError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  SovereigntyError,
  CarbonBudgetExceededError,
  TimeoutError,
  ConnectionError,
  NetworkError,
  isHarchOSError,
} from './errors.js';

// Types — all request and response types
export type {
  // Common
  PaginationMeta,
  ResourceMetadata,
  // Carbon Footprint
  CarbonFootprint,
  // Inference
  ChatMessageRole,
  ChatCompletionMessageParam,
  ToolCall,
  ChatCompletionRequest,
  ChatCompletionChoice,
  ChatCompletionUsage,
  ChatCompletionResponse,
  ChatCompletionChunkChoice,
  ChatCompletionChunk,
  // Carbon
  FuelMixEntry,
  CarbonIntensityZone,
  CarbonIntensityZoneList,
  CarbonOptimalHub,
  CarbonOptimizeResult,
  CarbonForecastPoint,
  CarbonForecast,
  CarbonMetrics,
  CarbonDashboard,
  // Hubs
  HubStatus,
  HubTier,
  HubCapacity,
  HubSpec,
  Hub,
  HubList,
  // Workloads
  WorkloadStatus,
  WorkloadType,
  ComputeRequirements,
  WorkloadSpec,
  Workload,
  WorkloadList,
  // Energy
  EnergyConsumption,
  EnergySource,
  EnergySummary,
  EnergyReport,
  // Models
  ModelStatus,
  ModelSize,
  ModelCapabilities,
  ModelSpec,
  Model,
  ModelList,
  // Pricing
  PricingPlan,
  CostBreakdown,
  CostEstimate,
  // Regions
  Region,
  // Health
  HealthStatus,
  PlatformMetrics,
  DetailedHealth,
} from './types.js';

// Resources
export { InferenceResource, Chat, ChatCompletions, type Transport } from './resources/inference.js';
export { WorkloadsResource, type ListWorkloadsParams } from './resources/workloads.js';
export { HubsResource, type ListHubsParams } from './resources/hubs.js';
export { CarbonResource, CarbonTracker, type OptimalHubParams, type OptimizeParams } from './resources/carbon.js';
export { PricingResource, type EstimateCostParams } from './resources/pricing.js';
export { AuthResource, type APIKeyInfo, type CreateAPIKeyParams } from './resources/auth.js';

// Streaming
export { StreamingResponse, parseSSEStream, parseSSELine } from './streaming.js';

// Retry
export { withRetry, isRetryableError, calculateDelay, type RetryConfig, type RetryResult } from './retry.js';

// Config
export { resolveConfig, type ClientConfig, SDK_VERSION } from './config.js';

// Version
export const VERSION = '0.3.0';

// Default export for convenience: `import HarchOS from '@harchos/sdk'`
export { HarchOS as default } from './client.js';
