/**
 * Pricing resource for the HarchOS SDK.
 */

import type { HttpTransport } from "../http.js";
import type { CostEstimate, PricingPlan } from "../models.js";

export interface EstimateCostParams {
  gpu_count: number;
  gpu_type?: string;
  duration_hours?: number;
  hub_id?: string;
}

export class PricingResource {
  constructor(private readonly transport: HttpTransport) {}

  /** List available pricing plans. */
  async listPlans(): Promise<PricingPlan[]> {
    return this.transport.get("/pricing/plans");
  }

  /** Estimate cost for a workload. */
  async estimate(params: EstimateCostParams): Promise<CostEstimate> {
    return this.transport.post("/pricing/estimate", params);
  }
}
