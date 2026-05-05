/**
 * @harchos/sdk v0.3.0 — Workloads Resource
 *
 * Full CRUD for HarchOS workloads — the primary compute abstraction.
 */

import type { Transport } from './inference.js';
import type {
  Workload,
  WorkloadList,
  WorkloadSpec,
  WorkloadStatus,
  WorkloadType,
} from '../types.js';

export interface ListWorkloadsParams {
  status?: WorkloadStatus;
  workload_type?: WorkloadType;
  hub_id?: string;
  labels?: Record<string, string>;
  page?: number;
  per_page?: number;
}

export class WorkloadsResource {
  constructor(private readonly transport: Transport) {}

  /** List workloads with optional filtering. */
  async list(params?: ListWorkloadsParams): Promise<WorkloadList> {
    return this.transport.request<WorkloadList>('GET', '/workloads', undefined, undefined);
  }

  /** Retrieve a workload by ID. */
  async get(workloadId: string): Promise<Workload> {
    return this.transport.request<Workload>('GET', `/workloads/${workloadId}`);
  }

  /** Create a new workload. */
  async create(spec: WorkloadSpec): Promise<Workload> {
    return this.transport.request<Workload>('POST', '/workloads', spec);
  }

  /** Update an existing workload. */
  async update(workloadId: string, spec: Partial<WorkloadSpec>): Promise<Workload> {
    return this.transport.request<Workload>('PUT', `/workloads/${workloadId}`, spec);
  }

  /** Cancel a running workload. */
  async cancel(workloadId: string): Promise<Workload> {
    return this.transport.request<Workload>('PATCH', `/workloads/${workloadId}`, {
      status: 'cancelled',
    });
  }

  /** Pause a running workload. */
  async pause(workloadId: string): Promise<Workload> {
    return this.transport.request<Workload>('PATCH', `/workloads/${workloadId}`, {
      status: 'paused',
    });
  }

  /** Resume a paused workload. */
  async resume(workloadId: string): Promise<Workload> {
    return this.transport.request<Workload>('PATCH', `/workloads/${workloadId}`, {
      status: 'running',
    });
  }

  /** Delete a workload. */
  async delete(workloadId: string): Promise<void> {
    await this.transport.request('DELETE', `/workloads/${workloadId}`);
  }
}
