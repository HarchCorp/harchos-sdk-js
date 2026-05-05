/**
 * Pricing Resource Module for HarchOS SDK
 */

import type {
  PricingPlan,
  BillingRecord,
  CostEstimate,
  ListPricingPlansParams,
  ListBillingRecordsParams,
  EstimateCostParams,
  RequestOptions,
} from "../types/index.js";
import type { HttpClient } from "../client.js";

export class PricingResource {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** List available pricing plans */
  async listPlans(
    params?: ListPricingPlansParams,
    opts?: RequestOptions,
  ): Promise<PricingPlan[]> {
    return this.client.get<PricingPlan[]>("/pricing/plans", {
      query: params,
      ...opts,
    });
  }

  /** Get a specific pricing plan by ID */
  async getPlan(
    id: string,
    opts?: RequestOptions,
  ): Promise<PricingPlan> {
    return this.client.get<PricingPlan>(`/pricing/plans/${id}`, opts);
  }

  /** Estimate the cost of a deployment */
  async estimateCost(
    params: EstimateCostParams,
    opts?: RequestOptions,
  ): Promise<CostEstimate> {
    return this.client.post<CostEstimate>("/pricing/estimate", {
      body: params,
      ...opts,
    });
  }

  /** List billing records */
  async listBillingRecords(
    params?: ListBillingRecordsParams,
    opts?: RequestOptions,
  ): Promise<BillingRecord[]> {
    return this.client.get<BillingRecord[]>("/pricing/billing", {
      query: params,
      ...opts,
    });
  }

  /** Get a specific billing record by ID */
  async getBillingRecord(
    id: string,
    opts?: RequestOptions,
  ): Promise<BillingRecord> {
    return this.client.get<BillingRecord>(`/pricing/billing/${id}`, opts);
  }
}
