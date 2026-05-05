/**
 * Models resource for the HarchOS SDK.
 */

import type { HttpTransport } from "../http.js";
import type { Model, ModelList } from "../models.js";

export interface ListModelsParams {
  status?: string;
  framework?: string;
  page?: number;
  per_page?: number;
}

export class ModelsResource {
  constructor(private readonly transport: HttpTransport) {}

  /** List available models. */
  async list(params?: ListModelsParams): Promise<ModelList> {
    return this.transport.get("/models", params as Record<string, unknown>);
  }

  /** Retrieve a model by ID. */
  async get(modelId: string): Promise<Model> {
    return this.transport.get(`/models/${modelId}`);
  }
}
