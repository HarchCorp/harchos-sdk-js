/**
 * Regions Resource Module for HarchOS SDK
 */

import type {
  Region,
  ListRegionsParams,
  RequestOptions,
} from "../types/index.js";
import type { HttpClient } from "../client.js";

export class RegionsResource {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** List all available regions */
  async list(
    params?: ListRegionsParams,
    opts?: RequestOptions,
  ): Promise<Region[]> {
    return this.client.get<Region[]>("/regions", {
      query: params,
      ...opts,
    });
  }

  /** Get details for a specific region */
  async get(
    code: string,
    opts?: RequestOptions,
  ): Promise<Region> {
    return this.client.get<Region>(`/regions/${code}`, opts);
  }
}
