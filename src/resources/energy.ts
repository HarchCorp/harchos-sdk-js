/**
 * Energy resource for the HarchOS SDK.
 */

import type { HttpTransport } from "../http.js";
import type { EnergyReport, EnergySummary } from "../models.js";

export class EnergyResource {
  constructor(private readonly transport: HttpTransport) {}

  /** Get energy consumption report. */
  async getReport(hubId?: string, periodDays = 30): Promise<EnergyReport> {
    const params: Record<string, unknown> = { period_days: periodDays };
    if (hubId) params.hub_id = hubId;
    return this.transport.get("/energy/report", params);
  }

  /** Get energy summary. */
  async getSummary(hubId?: string): Promise<EnergySummary> {
    const params: Record<string, unknown> = {};
    if (hubId) params.hub_id = hubId;
    return this.transport.get("/energy/summary", params);
  }
}
