/**
 * @harchos/sdk v0.3.0 — Pricing Resource
 */

import type { Transport } from './inference.js';
import type { CostEstimate, PricingPlan } from '../types.js';

export interface EstimateCostParams {
  gpu_count: number;
  gpu_type?: string;
  duration_hours?: number;
  hub_id?: string;
}

export class PricingResource {
  constructor(private readonly transport: Transport) {}

  /** List available pricing plans. */
  async listPlans(): Promise<PricingPlan[]> {
    return this.transport.request<PricingPlan[]>('GET', '/pricing/plans');
  }

  /** Estimate cost for a workload. */
  async estimate(params: EstimateCostParams): Promise<CostEstimate> {
    return this.transport.request<CostEstimate>('POST', '/pricing/estimate', params);
  }
}
