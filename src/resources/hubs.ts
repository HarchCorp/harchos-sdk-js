/**
 * Hubs Resource Module for HarchOS SDK
 */

import type {
  Hub,
  HubMetrics,
  HubConnectivityResult,
  ListHubsParams,
  PaginatedResponse,
  RequestOptions,
} from "../types/index.js";
import type { HttpClient } from "../client.js";

export class HubsResource {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** List all hubs with optional filtering */
  async list(
    params?: ListHubsParams,
    opts?: RequestOptions,
  ): Promise<PaginatedResponse<Hub>> {
    return this.client.get<PaginatedResponse<Hub>>("/hubs", {
      query: params,
      ...opts,
    });
  }

  /** Get a single hub by ID */
  async get(id: string, opts?: RequestOptions): Promise<Hub> {
    return this.client.get<Hub>(`/hubs/${id}`, opts);
  }

  /** Get real-time metrics for a hub */
  async metrics(
    id: string,
    opts?: RequestOptions,
  ): Promise<HubMetrics> {
    return this.client.get<HubMetrics>(`/hubs/${id}/metrics`, opts);
  }

  /** Test connectivity to a hub */
  async testConnectivity(
    id: string,
    opts?: RequestOptions,
  ): Promise<HubConnectivityResult> {
    return this.client.post<HubConnectivityResult>(
      `/hubs/${id}/connectivity-test`,
      opts,
    );
  }

  /** Get the nearest hub based on latency */
  async nearest(opts?: RequestOptions): Promise<Hub> {
    return this.client.get<Hub>("/hubs/nearest", opts);
  }

  /** Get recommended hub based on sovereignty and carbon-aware policies */
  async recommended(opts?: RequestOptions): Promise<Hub> {
    return this.client.get<Hub>("/hubs/recommended", opts);
  }
}
