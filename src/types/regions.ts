/**
 * Region type definitions for HarchOS SDK.
 *
 * Regions are geographic areas where HarchOS operates hubs,
 * with sovereignty boundaries and compliance info.
 */

// ─── Region ─────────────────────────────────────────────────────────────────

export interface Region {
  /** Human-readable region name (e.g. 'Morocco') */
  name: string;
  /** Region code (e.g. 'morocco', 'nigeria') */
  code: string;
  /** ISO 3166-1 alpha-2 country code (e.g. 'MA', 'NG') */
  country: string;
  /** Whether this region is currently available for deployments */
  available: boolean;
  /** Number of hubs in this region */
  hubCount: number;
  /** Total GPUs across all hubs in this region */
  totalGpus: number;
  /** Average renewable energy percentage across hubs */
  avgRenewablePercentage: number;
  /** Average carbon intensity in gCO2/kWh across hubs */
  avgCarbonIntensity: number;
  /** Network latency in ms from the Casablanca hub */
  latencyMsFromCasablanca?: number;
  /** Compliance frameworks supported (e.g. 'GDPR', 'PDPA', 'ISO27001') */
  complianceFrameworks: string[];
}

// ─── List Params ────────────────────────────────────────────────────────────

export interface ListRegionsParams {
  available?: boolean;
  limit?: number;
  cursor?: string;
}
