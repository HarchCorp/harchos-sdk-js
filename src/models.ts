/**
 * TypeScript type definitions for HarchOS API responses.
 *
 * These interfaces mirror the Python SDK's Pydantic models and the
 * server's JSON response shapes.
 */

// ---------------------------------------------------------------------------
// Common
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ResourceMetadata {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface HealthStatus {
  status: string;
  version: string;
  uptime_seconds: number;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Carbon
// ---------------------------------------------------------------------------

export interface FuelMixEntry {
  fuel_type: string;
  percentage: number;
  power_mw?: number;
}

export interface CarbonIntensityZone {
  zone: string;
  zone_name: string;
  carbon_intensity_gco2_kwh: number;
  renewable_percentage: number;
  fossil_percentage: number;
  fuel_mix: FuelMixEntry[];
  source: string;
  is_forecast: boolean;
  datetime: string;
  updated_at: string;
}

export interface CarbonIntensityZoneList {
  zones: CarbonIntensityZone[];
  total: number;
}

export interface CarbonOptimalHub {
  recommended_hub_id?: string;
  recommended_hub_name: string;
  hub_region: string;
  hub_zone: string;
  carbon_intensity_gco2_kwh: number;
  renewable_percentage: number;
  available_gpus: number;
  action: string;
  defer_hours: number;
  defer_reason: string;
  estimated_carbon_saved_kg: number;
  alternative_hubs: Record<string, unknown>[];
  analyzed_at: string;
}

export interface CarbonOptimizeResult {
  action: string;
  workload_name: string;
  selected_hub_id?: string;
  selected_hub_name: string;
  carbon_intensity_at_schedule_gco2_kwh: number;
  carbon_saved_kg: number;
  baseline_carbon_kg: number;
  actual_carbon_kg: number;
  deferred_hours: number;
  reason: string;
  estimated_green_window?: Record<string, unknown>;
  optimized_at: string;
}

export interface CarbonForecastPoint {
  datetime: string;
  carbon_intensity_gco2_kwh: number;
  renewable_percentage: number;
  is_green: boolean;
}

export interface CarbonForecast {
  zone: string;
  zone_name: string;
  forecast: CarbonForecastPoint[];
  green_windows: Record<string, unknown>[];
}

export interface CarbonMetrics {
  total_carbon_saved_kg: number;
  total_workloads_optimized: number;
  total_workloads_deferred: number;
  average_carbon_intensity_gco2_kwh: number;
  best_hub_id?: string;
  best_hub_name: string;
  best_hub_carbon_intensity: number;
  worst_hub_carbon_intensity: number;
  period_start: string;
  period_end: string;
}

export interface CarbonDashboard {
  metrics: CarbonMetrics;
  hub_intensities: CarbonIntensityZone[];
  optimization_log: Record<string, unknown>[];
  green_windows: Record<string, unknown>[];
}

// ---------------------------------------------------------------------------
// Hubs
// ---------------------------------------------------------------------------

export type HubStatus =
  | "creating"
  | "ready"
  | "updating"
  | "scaling"
  | "draining"
  | "offline"
  | "error";

export type HubTier = "starter" | "standard" | "performance" | "enterprise";

export interface HubCapacity {
  total_gpus: number;
  available_gpus: number;
  total_cpu_cores: number;
  available_cpu_cores: number;
  total_memory_gb: number;
  available_memory_gb: number;
  total_storage_gb: number;
  available_storage_gb: number;
}

export interface HubSpec {
  name: string;
  region: string;
  tier?: HubTier;
  sovereignty_level?: "strict" | "moderate" | "minimal";
  gpu_types?: string[];
  auto_scale?: boolean;
  min_gpu_count?: number;
  max_gpu_count?: number;
  carbon_aware_scheduling?: boolean;
  labels?: Record<string, string>;
}

export interface Hub {
  metadata: ResourceMetadata;
  spec: HubSpec;
  status: HubStatus;
  capacity?: HubCapacity;
  endpoint?: string;
  active_workloads: number;
}

export interface HubList {
  items: Hub[];
  total: number;
  pagination?: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Workloads
// ---------------------------------------------------------------------------

export type WorkloadStatus =
  | "pending"
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused";

export type WorkloadType = "training" | "inference" | "fine_tuning" | "batch" | "serving";

export interface ComputeRequirements {
  gpu_count: number;
  gpu_type?: string;
  cpu_cores?: number;
  memory_gb?: number;
  storage_gb?: number;
}

export interface WorkloadSpec {
  name: string;
  workload_type?: WorkloadType;
  hub_id?: string;
  compute?: ComputeRequirements;
  priority?: "low" | "normal" | "high" | "critical";
  carbon_aware?: boolean;
  carbon_max_gco2?: number;
  image?: string;
  command?: string[];
  env?: Record<string, string>;
  labels?: Record<string, string>;
}

export interface Workload {
  metadata: ResourceMetadata;
  spec: WorkloadSpec;
  status: WorkloadStatus;
  hub_id?: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface WorkloadList {
  items: Workload[];
  total: number;
  pagination?: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Energy
// ---------------------------------------------------------------------------

export interface EnergyConsumption {
  kwh: number;
  gpu_hours: number;
  period_start: string;
  period_end: string;
}

export interface EnergySource {
  source: string;
  percentage: number;
}

export interface EnergySummary {
  total_kwh: number;
  gpu_hours: number;
  renewable_percentage: number;
  sources: EnergySource[];
}

export interface EnergyReport {
  consumption: EnergyConsumption;
  summary: EnergySummary;
}

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

export type ModelStatus = "available" | "loading" | "unavailable";

export interface ModelSize {
  parameters: string;
  size_gb: number;
}

export interface ModelCapabilities {
  tasks: string[];
  languages?: string[];
  max_context_length?: number;
}

export interface ModelSpec {
  name: string;
  framework?: string;
  size?: ModelSize;
  capabilities?: ModelCapabilities;
}

export interface Model {
  metadata: ResourceMetadata;
  spec: ModelSpec;
  status: ModelStatus;
  hub_id?: string;
}

export interface ModelList {
  items: Model[];
  total: number;
  pagination?: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export interface PricingPlan {
  name: string;
  gpu_hour_price: number;
  currency: string;
  tier: string;
}

export interface CostBreakdown {
  compute_cost: number;
  storage_cost: number;
  network_cost: number;
  total_cost: number;
  currency: string;
}

export interface CostEstimate {
  workload_name: string;
  breakdown: CostBreakdown;
  estimated_duration_hours: number;
}

// ---------------------------------------------------------------------------
// Regions
// ---------------------------------------------------------------------------

export interface Region {
  code: string;
  name: string;
  country: string;
  zones: string[];
  available_gpus: number;
  renewable_percentage: number;
  carbon_intensity_gco2_kwh: number;
}

// ---------------------------------------------------------------------------
// Monitoring
// ---------------------------------------------------------------------------

export interface PlatformMetrics {
  total_hubs: number;
  total_gpus: number;
  active_workloads: number;
  total_users: number;
  average_latency_ms: number;
  uptime_percentage: number;
}

export interface DetailedHealth {
  status: string;
  version: string;
  uptime_seconds: number;
  database: string;
  redis: string;
  api_endpoints: number;
  timestamp: string;
}
