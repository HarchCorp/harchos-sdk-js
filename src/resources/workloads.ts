/**
 * Workloads Resource Module for HarchOS SDK
 */

import type {
  Workload,
  CreateWorkloadRequest,
  CreateWorkloadResponse,
  UpdateWorkloadRequest,
  UpdateWorkloadResponse,
  WorkloadMetrics,
  WorkloadEvent,
  WorkloadLogEntry,
  ListWorkloadsParams,
  PaginatedResponse,
  RequestOptions,
} from "../types/index.js";
import type { HttpClient } from "../client.js";

export class WorkloadsResource {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** List all workloads with optional filtering */
  async list(
    params?: ListWorkloadsParams,
    opts?: RequestOptions,
  ): Promise<PaginatedResponse<Workload>> {
    return this.client.get<PaginatedResponse<Workload>>("/workloads", {
      query: params,
      ...opts,
    });
  }

  /** Get a single workload by ID */
  async get(id: string, opts?: RequestOptions): Promise<Workload> {
    return this.client.get<Workload>(`/workloads/${id}`, opts);
  }

  /** Create a new workload */
  async create(
    data: CreateWorkloadRequest,
    opts?: RequestOptions,
  ): Promise<CreateWorkloadResponse> {
    return this.client.post<CreateWorkloadResponse>("/workloads", {
      body: data,
      idempotencyKey: opts?.idempotencyKey,
      ...opts,
    });
  }

  /** Update an existing workload */
  async update(
    id: string,
    data: UpdateWorkloadRequest,
    opts?: RequestOptions,
  ): Promise<UpdateWorkloadResponse> {
    return this.client.patch<UpdateWorkloadResponse>(`/workloads/${id}`, {
      body: data,
      ...opts,
    });
  }

  /** Delete (stop and remove) a workload */
  async delete(id: string, opts?: RequestOptions): Promise<void> {
    await this.client.delete(`/workloads/${id}`, opts);
  }

  /** Start a stopped workload */
  async start(id: string, opts?: RequestOptions): Promise<Workload> {
    return this.client.post<Workload>(`/workloads/${id}/start`, opts);
  }

  /** Stop a running workload */
  async stop(id: string, opts?: RequestOptions): Promise<Workload> {
    return this.client.post<Workload>(`/workloads/${id}/stop`, opts);
  }

  /** Get real-time metrics for a workload */
  async metrics(
    id: string,
    opts?: RequestOptions,
  ): Promise<WorkloadMetrics> {
    return this.client.get<WorkloadMetrics>(`/workloads/${id}/metrics`, opts);
  }

  /** List events for a workload */
  async events(
    id: string,
    opts?: RequestOptions,
  ): Promise<WorkloadEvent[]> {
    return this.client.get<WorkloadEvent[]>(`/workloads/${id}/events`, opts);
  }

  /** Get logs for a workload */
  async logs(
    id: string,
    params?: { tail?: number; follow?: boolean },
    opts?: RequestOptions,
  ): Promise<WorkloadLogEntry[]> {
    return this.client.get<WorkloadLogEntry[]>(`/workloads/${id}/logs`, {
      query: params,
      ...opts,
    });
  }

  /** Scale a workload to a specific replica count */
  async scale(
    id: string,
    replicas: number,
    opts?: RequestOptions,
  ): Promise<Workload> {
    return this.client.post<Workload>(`/workloads/${id}/scale`, {
      body: { replicas },
      ...opts,
    });
  }
}
