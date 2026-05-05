/**
 * Monitoring resource for the HarchOS SDK.
 */

import type { HttpTransport } from "../http.js";
import type { DetailedHealth, PlatformMetrics } from "../models.js";

export class MonitoringResource {
  constructor(private readonly transport: HttpTransport) {}

  /** Get platform-wide metrics. */
  async getMetrics(): Promise<PlatformMetrics> {
    return this.transport.get("/monitoring/metrics");
  }

  /** Get detailed health status. */
  async getHealth(): Promise<DetailedHealth> {
    return this.transport.get("/health/detailed");
  }
}
