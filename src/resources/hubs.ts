/**
 * Hubs resource for the HarchOS SDK.
 *
 * Manages HarchOS Hubs — sovereign compute clusters.
 */

import type { HttpTransport } from "../http.js";
import type { Hub, HubCapacity, HubList, HubSpec, HubStatus, HubTier } from "../models.js";

export interface ListHubsParams {
  status?: HubStatus;
  tier?: HubTier;
  region?: string;
  labels?: Record<string, string>;
  page?: number;
  per_page?: number;
}

export class HubsResource {
  constructor(private readonly transport: HttpTransport) {}

  /** List hubs with optional filtering. */
  async list(params?: ListHubsParams): Promise<HubList> {
    return this.transport.get("/hubs", params as Record<string, unknown>);
  }

  /** Retrieve a hub by ID. */
  async get(hubId: string): Promise<Hub> {
    return this.transport.get(`/hubs/${hubId}`);
  }

  /** Create a new hub. */
  async create(spec: HubSpec): Promise<Hub> {
    return this.transport.post("/hubs", spec);
  }

  /** Update an existing hub. */
  async update(hubId: string, spec: Partial<HubSpec>): Promise<Hub> {
    return this.transport.put(`/hubs/${hubId}`, spec);
  }

  /** Get current capacity for a hub. */
  async capacity(hubId: string): Promise<HubCapacity> {
    return this.transport.get(`/hubs/${hubId}/capacity`);
  }

  /** Scale a hub to a target GPU count. */
  async scale(hubId: string, targetGpuCount: number): Promise<Hub> {
    return this.transport.patch(`/hubs/${hubId}`, {
      action: "scale",
      target_gpu_count: targetGpuCount,
    });
  }

  /** Drain a hub (gracefully remove all workloads). */
  async drain(hubId: string): Promise<Hub> {
    return this.transport.patch(`/hubs/${hubId}`, { action: "drain" });
  }

  /** Delete a hub. */
  async delete(hubId: string): Promise<void> {
    return this.transport.delete(`/hubs/${hubId}`);
  }
}
