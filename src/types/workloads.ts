/**
 * Workload type definitions for HarchOS SDK.
 *
 * A Workload is the primary compute unit in HarchOS — an AI inference
 * deployment with sovereign placement constraints.
 */

import type { Timestamps, ResourceMetadata, SovereigntyAnnotations, HealthStatus } from "./common.js";
import type { SovereignRegion } from "./sovereignty.js";

// ─── Workload States ────────────────────────────────────────────────────────

export type WorkloadState =
  | "pending"
  | "scheduling"
  | "running"
  | "scaling"
  | "stopping"
  | "stopped"
  | "failed"
  | "migrating";

// ─── Workload Types ─────────────────────────────────────────────────────────

export type WorkloadType =
  | "inference"
  | "training"
  | "fine-tuning"
  | "embedding"
  | "reranking";

// ─── Compute Resources ──────────────────────────────────────────────────────

export interface ComputeResources {
  /** Number of GPU units (e.g., A100 = 1, A10 = 0.5) */
  gpuUnits: number;
  /** GPU type identifier */
  gpuType: string;
  /** CPU cores */
  cpuCores: number;
  /** Memory in GB */
  memoryGb: number;
  /** Storage in GB */
  storageGb: number;
}

// ─── Auto-Scaling ───────────────────────────────────────────────────────────

export interface AutoScalingConfig {
  /** Minimum number of replicas */
  minReplicas: number;
  /** Maximum number of replicas */
  maxReplicas: number;
  /** Target requests per second per replica */
  targetRps?: number;
  /** Target GPU utilization percentage (0-100) */
  targetGpuUtilization?: number;
  /** Scale-up cooldown in seconds */
  scaleUpCooldownS?: number;
  /** Scale-down cooldown in seconds */
  scaleDownCooldownS?: number;
}

// ─── Workload ───────────────────────────────────────────────────────────────

export interface Workload {
  id: string;
  name: string;
  type: WorkloadType;
  state: WorkloadState;
  model: string;
  region: SovereignRegion;
  resources: ComputeResources;
  replicas: number;
  autoScaling?: AutoScalingConfig;
  endpoint?: string;
  health: HealthStatus;
  sovereignty: SovereigntyAnnotations;
  metadata?: ResourceMetadata;
  timestamps: Timestamps;
}

// ─── Create Workload ────────────────────────────────────────────────────────

export interface CreateWorkloadRequest {
  name: string;
  type: WorkloadType;
  model: string;
  region?: string;
  resources: ComputeResources;
  replicas?: number;
  autoScaling?: AutoScalingConfig;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface CreateWorkloadResponse {
  id: string;
  name: string;
  state: WorkloadState;
  endpoint?: string;
}

// ─── Update Workload ────────────────────────────────────────────────────────

export interface UpdateWorkloadRequest {
  name?: string;
  resources?: Partial<ComputeResources>;
  replicas?: number;
  autoScaling?: AutoScalingConfig;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface UpdateWorkloadResponse {
  id: string;
  state: WorkloadState;
}

// ─── Workload Metrics ───────────────────────────────────────────────────────

export interface WorkloadMetrics {
  workloadId: string;
  requestsPerSecond: number;
  averageLatencyMs: number;
  p99LatencyMs: number;
  gpuUtilization: number;
  memoryUtilization: number;
  errorRate: number;
  timestamp: string;
}

// ─── Workload Events ────────────────────────────────────────────────────────

export type WorkloadEventType =
  | "created"
  | "started"
  | "scaled_up"
  | "scaled_down"
  | "stopped"
  | "failed"
  | "migrated"
  | "updated";

export interface WorkloadEvent {
  id: string;
  workloadId: string;
  type: WorkloadEventType;
  message: string;
  timestamp: string;
}

// ─── Workload Logs ──────────────────────────────────────────────────────────

export interface WorkloadLogEntry {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  source?: string;
}

// ─── List Params ────────────────────────────────────────────────────────────

export interface ListWorkloadsParams {
  state?: WorkloadState;
  type?: WorkloadType;
  region?: SovereignRegion;
  limit?: number;
  cursor?: string;
}
