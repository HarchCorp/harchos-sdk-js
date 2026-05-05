/**
 * Workloads resource for the HarchOS SDK.
 *
 * Manages HarchOS workloads — the primary compute abstraction.
 */

import type { HttpTransport } from "../http.js";
import type { Workload, WorkloadList, WorkloadSpec, WorkloadStatus, WorkloadType } from "../models.js";

export interface ListWorkloadsParams {
  status?: WorkloadStatus;
  workload_type?: WorkloadType;
  hub_id?: string;
  labels?: Record<string, string>;
  page?: number;
  per_page?: number;
}

export class WorkloadsResource {
  constructor(private readonly transport: HttpTransport) {}

  /** List workloads with optional filtering. */
  async list(params?: ListWorkloadsParams): Promise<WorkloadList> {
    return this.transport.get("/workloads", params as Record<string, unknown>);
  }

  /** Retrieve a workload by ID. */
  async get(workloadId: string): Promise<Workload> {
    return this.transport.get(`/workloads/${workloadId}`);
  }

  /** Create a new workload. */
  async create(spec: WorkloadSpec): Promise<Workload> {
    return this.transport.post("/workloads", spec);
  }

  /** Update an existing workload. */
  async update(workloadId: string, spec: Partial<WorkloadSpec>): Promise<Workload> {
    return this.transport.put(`/workloads/${workloadId}`, spec);
  }

  /** Cancel a running workload. */
  async cancel(workloadId: string): Promise<Workload> {
    return this.transport.patch(`/workloads/${workloadId}`, { status: "cancelled" });
  }

  /** Pause a running workload. */
  async pause(workloadId: string): Promise<Workload> {
    return this.transport.patch(`/workloads/${workloadId}`, { status: "paused" });
  }

  /** Resume a paused workload. */
  async resume(workloadId: string): Promise<Workload> {
    return this.transport.patch(`/workloads/${workloadId}`, { status: "running" });
  }

  /** Delete a workload. */
  async delete(workloadId: string): Promise<void> {
    return this.transport.delete(`/workloads/${workloadId}`);
  }
}
