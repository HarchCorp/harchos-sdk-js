/**
 * HarchOS SDK — Main client.
 *
 * The primary entry point for interacting with the HarchOS API.
 * Provides sovereign defaults: region="morocco", sovereignty="strict", carbon_aware=true.
 *
 * @example
 * ```ts
 * import { HarchOSClient } from "@harchos/sdk";
 *
 * const client = new HarchOSClient({ apiKey: "hsk_..." });
 *
 * // Get carbon intensity for Morocco
 * const carbon = await client.carbon.getIntensity("MA");
 * console.log(`Morocco: ${carbon.carbon_intensity_gco2_kwh} gCO2/kWh`);
 *
 * // List all hubs
 * const hubs = await client.hubs.list();
 * console.log(`${hubs.total} hubs available`);
 * ```
 */

import { HttpTransport, type TransportConfig } from "./http.js";
import { CarbonResource } from "./resources/carbon.js";
import { EnergyResource } from "./resources/energy.js";
import { HubsResource } from "./resources/hubs.js";
import { ModelsResource } from "./resources/models.js";
import { MonitoringResource } from "./resources/monitoring.js";
import { PricingResource } from "./resources/pricing.js";
import { RegionsResource } from "./resources/regions.js";
import { WorkloadsResource } from "./resources/workloads.js";
import type { HealthStatus } from "./models.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface ClientOptions {
  /** HarchOS API key (starts with `hsk_`). */
  apiKey?: string;
  /** API base URL. Default: `https://harchos-api-production.up.railway.app/v1` */
  baseURL?: string;
  /** Data residency region. Default: `"morocco"` */
  region?: string;
  /** Sovereignty enforcement level. Default: `"strict"` */
  sovereignty?: "strict" | "moderate" | "minimal";
  /** Enable carbon-aware scheduling. Default: `true` */
  carbonAware?: boolean;
  /** Request timeout in seconds. Default: `30` */
  timeout?: number;
  /** Maximum retry attempts. Default: `3` */
  maxRetries?: number;
  /** Extra HTTP headers to send with every request. */
  defaultHeaders?: Record<string, string>;
}

const DEFAULT_BASE_URL = "https://harchos-api-production.up.railway.app/v1";
const DEFAULT_TIMEOUT = 30;
const DEFAULT_MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class HarchOSClient {
  private readonly transport: HttpTransport;
  private readonly _region: string;
  private readonly _sovereignty: string;
  private readonly _carbonAware: boolean;

  /** Carbon-aware scheduling resource — HarchOS's key differentiator. */
  readonly carbon: CarbonResource;

  /** Sovereign compute hub management. */
  readonly hubs: HubsResource;

  /** Workload lifecycle management. */
  readonly workloads: WorkloadsResource;

  /** Energy consumption and reporting. */
  readonly energy: EnergyResource;

  /** Available AI models. */
  readonly models: ModelsResource;

  /** Pricing and cost estimation. */
  readonly pricing: PricingResource;

  /** Region information. */
  readonly regions: RegionsResource;

  /** Platform monitoring. */
  readonly monitoring: MonitoringResource;

  constructor(options: ClientOptions = {}) {
    // Build transport config from options + environment
    const apiKey = options.apiKey ?? readEnv("HARCHOS_API_KEY");
    const baseURL = options.baseURL ?? readEnv("HARCHOS_BASE_URL") ?? DEFAULT_BASE_URL;
    const timeout = options.timeout ?? envNumber("HARCHOS_TIMEOUT", DEFAULT_TIMEOUT);
    const maxRetries = options.maxRetries ?? envNumber("HARCHOS_MAX_RETRIES", DEFAULT_MAX_RETRIES);

    this._region = options.region ?? readEnv("HARCHOS_REGION") ?? "morocco";
    this._sovereignty = options.sovereignty ?? readEnv("HARCHOS_SOVEREIGNTY") ?? "strict";
    this._carbonAware = options.carbonAware ?? true;

    const config: TransportConfig = {
      baseURL,
      apiKey,
      timeout,
      maxRetries,
      defaultHeaders: {
        "X-HarchOS-Region": this._region,
        "X-HarchOS-Sovereignty": this._sovereignty,
        "X-HarchOS-Carbon-Aware": String(this._carbonAware),
        ...options.defaultHeaders,
      },
    };

    this.transport = new HttpTransport(config);

    // Initialize resource modules
    this.carbon = new CarbonResource(this.transport);
    this.hubs = new HubsResource(this.transport);
    this.workloads = new WorkloadsResource(this.transport);
    this.energy = new EnergyResource(this.transport);
    this.models = new ModelsResource(this.transport);
    this.pricing = new PricingResource(this.transport);
    this.regions = new RegionsResource(this.transport);
    this.monitoring = new MonitoringResource(this.transport);
  }

  // ------------------------------------------------------------------
  // Accessors
  // ------------------------------------------------------------------

  /** The configured data residency region. */
  get region(): string {
    return this._region;
  }

  /** The sovereignty enforcement level. */
  get sovereignty(): string {
    return this._sovereignty;
  }

  /** Whether carbon-aware scheduling is enabled. */
  get carbonAware(): boolean {
    return this._carbonAware;
  }

  // ------------------------------------------------------------------
  // Health check
  // ------------------------------------------------------------------

  /** Check the health of the HarchOS API. */
  async health(): Promise<HealthStatus> {
    return this.transport.get("/health");
  }

  // ------------------------------------------------------------------
  // Factory
  // ------------------------------------------------------------------

  /** Create a client configured from environment variables. */
  static fromEnv(overrides?: ClientOptions): HarchOSClient {
    return new HarchOSClient(overrides);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}

function envNumber(key: string, fallback: number): number {
  const val = readEnv(key);
  if (val !== undefined) {
    const n = Number(val);
    if (!isNaN(n)) return n;
  }
  return fallback;
}
