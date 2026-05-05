/**
 * Pricing type definitions for HarchOS SDK.
 *
 * Covers pricing plans, billing records, and cost estimation
 * for HarchOS sovereign GPU cloud infrastructure.
 */

import type { Timestamps } from "./common.js";
import type { SovereignRegion } from "./sovereignty.js";

// ─── Pricing Plan ───────────────────────────────────────────────────────────

export interface PricingPlan {
  id: string;
  name: string;
  /** GPU type this plan covers (e.g. 'A100', 'H100') */
  gpuType: string;
  /** Price per GPU hour */
  pricePerGpuHour: number;
  /** Price per CPU core hour */
  pricePerCpuCoreHour: number;
  /** Price per GB storage per month */
  pricePerGbStorageMonth: number;
  /** Price per GB memory hour */
  pricePerGbMemoryHour: number;
  /** ISO 4217 currency code (e.g. 'USD', 'MAD', 'EUR') */
  currency: string;
  /** Region this plan applies to */
  region: SovereignRegion | string;
  /** Plan tier: community, enterprise, sovereign */
  tier: "community" | "enterprise" | "sovereign";
  /** Whether this is the default plan for the region */
  isDefault: boolean;
}

// ─── Billing Record ─────────────────────────────────────────────────────────

export interface BillingRecord {
  id: string;
  userId: string;
  /** Workload ID if applicable */
  workloadId?: string;
  /** Hub ID where resources were consumed */
  hubId?: string;
  /** Total GPU hours consumed */
  gpuHours: number;
  /** Total CPU core hours consumed */
  cpuCoreHours: number;
  /** Total memory GB-hours consumed */
  memoryGbHours: number;
  /** Total storage GB-months consumed */
  storageGbMonths: number;
  /** Total cost for this billing period */
  totalCost: number;
  /** Currency code */
  currency: string;
  /** Billing status: open, closed, paid, overdue */
  status: "open" | "closed" | "paid" | "overdue";
  /** Billing period start */
  periodStart: string;
  /** Billing period end */
  periodEnd: string;
  timestamps: Timestamps;
}

// ─── Cost Estimate ──────────────────────────────────────────────────────────

export interface CostBreakdown {
  /** GPU compute cost */
  gpuCost: number;
  /** CPU compute cost */
  cpuCost: number;
  /** Memory cost */
  memoryCost: number;
  /** Storage cost */
  storageCost: number;
  /** Network egress cost */
  networkCost: number;
  /** Any applicable discount percentage (0-100) */
  discountPercentage: number;
  /** Subtotal before discount */
  subtotal: number;
  /** Estimated tax */
  tax: number;
}

export interface CostEstimate {
  /** Number of GPUs requested */
  gpuCount: number;
  /** GPU type (e.g. 'A100', 'H100') */
  gpuType: string;
  /** Estimated hours of usage */
  hours: number;
  /** Target region */
  region: string;
  /** Target tier */
  tier: string;
  /** Estimated total cost */
  estimatedTotal: number;
  /** Currency code */
  currency: string;
  /** Detailed cost breakdown */
  breakdown: CostBreakdown;
}

// ─── List Params ────────────────────────────────────────────────────────────

export interface ListPricingPlansParams {
  region?: string;
  tier?: "community" | "enterprise" | "sovereign";
  gpuType?: string;
  limit?: number;
  cursor?: string;
}

export interface ListBillingRecordsParams {
  status?: "open" | "closed" | "paid" | "overdue";
  periodStart?: string;
  periodEnd?: string;
  limit?: number;
  cursor?: string;
}

export interface EstimateCostParams {
  gpuCount: number;
  gpuType: string;
  hours: number;
  region?: string;
  tier?: string;
  cpuCores?: number;
  memoryGb?: number;
  storageGb?: number;
}
