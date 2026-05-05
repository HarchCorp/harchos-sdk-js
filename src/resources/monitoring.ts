/**
 * Monitoring Resource Module for HarchOS SDK
 */

import type {
  PlatformMetrics,
  DetailedHealth,
  RequestOptions,
} from "../types/index.js";
import type { HttpClient } from "../client.js";

export class MonitoringResource {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** Get aggregate platform metrics */
  async metrics(opts?: RequestOptions): Promise<PlatformMetrics> {
    return this.client.get<PlatformMetrics>("/monitoring/metrics", opts);
  }

  /** Get a detailed health check of the platform */
  async detailedHealth(opts?: RequestOptions): Promise<DetailedHealth> {
    return this.client.get<DetailedHealth>("/monitoring/health/detailed", opts);
  }
}
