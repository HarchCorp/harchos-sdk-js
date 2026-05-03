/**
 * Energy Resource Module for HarchOS SDK
 */

import type {
  CarbonIntensity,
  EnergyConsumption,
  EnergyBudget,
  GreenSchedulingWindow,
  ListEnergyConsumptionParams,
  GetCarbonIntensityParams,
  PaginatedResponse,
  RequestOptions,
} from "../types/index.js";
import type { HttpClient } from "../client.js";

export class EnergyResource {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** Get current carbon intensity for a region */
  async carbonIntensity(
    params?: GetCarbonIntensityParams,
    opts?: RequestOptions,
  ): Promise<CarbonIntensity> {
    return this.client.get<CarbonIntensity>("/energy/carbon-intensity", {
      query: params,
      ...opts,
    });
  }

  /** List energy consumption records */
  async consumption(
    params?: ListEnergyConsumptionParams,
    opts?: RequestOptions,
  ): Promise<PaginatedResponse<EnergyConsumption>> {
    return this.client.get<PaginatedResponse<EnergyConsumption>>(
      "/energy/consumption",
      { query: params, ...opts },
    );
  }

  /** Get energy consumption for a specific resource */
  async getResourceConsumption(
    resourceId: string,
    opts?: RequestOptions,
  ): Promise<EnergyConsumption> {
    return this.client.get<EnergyConsumption>(
      `/energy/consumption/${resourceId}`,
      opts,
    );
  }

  /** List energy budgets */
  async budgets(opts?: RequestOptions): Promise<EnergyBudget[]> {
    return this.client.get<EnergyBudget[]>("/energy/budgets", opts);
  }

  /** Get a specific energy budget */
  async getBudget(
    id: string,
    opts?: RequestOptions,
  ): Promise<EnergyBudget> {
    return this.client.get<EnergyBudget>(`/energy/budgets/${id}`, opts);
  }

  /** Create an energy budget */
  async createBudget(
    data: Omit<EnergyBudget, "id" | "timestamps" | "currentKwh" | "currentCarbonGco2e">,
    opts?: RequestOptions,
  ): Promise<EnergyBudget> {
    return this.client.post<EnergyBudget>("/energy/budgets", {
      body: data,
      ...opts,
    });
  }

  /** Get green scheduling windows (optimal carbon-aware time slots) */
  async greenWindows(
    params?: { region?: string; hoursAhead?: number },
    opts?: RequestOptions,
  ): Promise<GreenSchedulingWindow[]> {
    return this.client.get<GreenSchedulingWindow[]>(
      "/energy/green-windows",
      { query: params, ...opts },
    );
  }
}
