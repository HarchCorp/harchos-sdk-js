/**
 * Regions resource for the HarchOS SDK.
 */

import type { HttpTransport } from "../http.js";
import type { Region } from "../models.js";

export class RegionsResource {
  constructor(private readonly transport: HttpTransport) {}

  /** List all available regions. */
  async list(): Promise<Region[]> {
    return this.transport.get("/regions");
  }

  /** Get details for a specific region. */
  async get(code: string): Promise<Region> {
    return this.transport.get(`/regions/${code}`);
  }
}
