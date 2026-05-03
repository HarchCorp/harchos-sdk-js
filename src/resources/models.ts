/**
 * Models Resource Module for HarchOS SDK
 */

import type {
  Model,
  ModelVariant,
  ListModelsParams,
  PaginatedResponse,
  RequestOptions,
} from "../types/index.js";
import type { HttpClient } from "../client.js";

export class ModelsResource {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  /** List available models with optional filtering */
  async list(
    params?: ListModelsParams,
    opts?: RequestOptions,
  ): Promise<PaginatedResponse<Model>> {
    return this.client.get<PaginatedResponse<Model>>("/models", {
      query: params,
      ...opts,
    });
  }

  /** Get a single model by ID */
  async get(id: string, opts?: RequestOptions): Promise<Model> {
    return this.client.get<Model>(`/models/${id}`, opts);
  }

  /** Get available variants for a model */
  async variants(
    id: string,
    opts?: RequestOptions,
  ): Promise<ModelVariant[]> {
    return this.client.get<ModelVariant[]>(`/models/${id}/variants`, opts);
  }

  /** Get a specific model variant */
  async variant(
    modelId: string,
    quantization: string,
    opts?: RequestOptions,
  ): Promise<ModelVariant> {
    return this.client.get<ModelVariant>(
      `/models/${modelId}/variants/${quantization}`,
      opts,
    );
  }

  /** Search models by name or description */
  async search(
    query: string,
    opts?: RequestOptions,
  ): Promise<PaginatedResponse<Model>> {
    return this.client.get<PaginatedResponse<Model>>("/models/search", {
      query: { q: query },
      ...opts,
    });
  }
}
