/**
 * @harchos/sdk v0.3.0 — Hubs Resource
 *
 * Manages HarchOS Hubs — sovereign compute clusters.
 */

import type { Transport } from './inference.js';
import type {
  Hub,
  HubCapacity,
  HubList,
  HubSpec,
  HubStatus,
  HubTier,
} from '../types.js';

export interface ListHubsParams {
  status?: HubStatus;
  tier?: HubTier;
  region?: string;
  labels?: Record<string, string>;
  page?: number;
  per_page?: number;
}

export class HubsResource {
  constructor(private readonly transport: Transport) {}

  /** List hubs with optional filtering. */
  async list(params?: ListHubsParams): Promise<HubList> {
    return this.transport.request<HubList>('GET', '/hubs', undefined, undefined);
  }

  /** Retrieve a hub by ID. */
  async get(hubId: string): Promise<Hub> {
    return this.transport.request<Hub>('GET', `/hubs/${hubId}`);
  }

  /** Create a new hub. */
  async create(spec: HubSpec): Promise<Hub> {
    return this.transport.request<Hub>('POST', '/hubs', spec);
  }

  /** Update an existing hub. */
  async update(hubId: string, spec: Partial<HubSpec>): Promise<Hub> {
    return this.transport.request<Hub>('PUT', `/hubs/${hubId}`, spec);
  }

  /** Get current capacity for a hub. */
  async capacity(hubId: string): Promise<HubCapacity> {
    return this.transport.request<HubCapacity>('GET', `/hubs/${hubId}/capacity`);
  }

  /** Scale a hub to a target GPU count. */
  async scale(hubId: string, targetGpuCount: number): Promise<Hub> {
    return this.transport.request<Hub>('PATCH', `/hubs/${hubId}`, {
      action: 'scale',
      target_gpu_count: targetGpuCount,
    });
  }

  /** Drain a hub (gracefully remove all workloads). */
  async drain(hubId: string): Promise<Hub> {
    return this.transport.request<Hub>('PATCH', `/hubs/${hubId}`, { action: 'drain' });
  }

  /** Delete a hub. */
  async delete(hubId: string): Promise<void> {
    await this.transport.request('DELETE', `/hubs/${hubId}`);
  }
}
