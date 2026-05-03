/**
 * Model type definitions for HarchOS SDK.
 *
 * Models are AI models available for deployment as workloads.
 */

import type { Timestamps, ResourceMetadata, SovereigntyAnnotations } from "./common.js";
import type { SovereignRegion } from "./sovereignty.js";

// ─── Model Categories ───────────────────────────────────────────────────────

export type ModelCategory =
  | "language"
  | "vision"
  | "audio"
  | "multimodal"
  | "embedding"
  | "reranking"
  | "code";

// ─── Model License ──────────────────────────────────────────────────────────

export type ModelLicense =
  | "apache-2.0"
  | "mit"
  | "gpl-3.0"
  | "cc-by-4.0"
  | "cc-by-nc-4.0"
  | "llama-community"
  | "mistral"
  | "proprietary"
  | "other";

// ─── Model Quantization ─────────────────────────────────────────────────────

export type QuantizationLevel =
  | "fp32"
  | "fp16"
  | "bf16"
  | "int8"
  | "int4"
  | "gptq-4bit"
  | "awq-4bit"
  | "gguf-q4_0"
  | "gguf-q8_0";

// ─── Model ──────────────────────────────────────────────────────────────────

export interface Model {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: ModelCategory;
  license: ModelLicense;
  developer: string;
  /** Available quantization levels */
  quantizations: QuantizationLevel[];
  /** Number of parameters (billions) */
  parametersB: number;
  /** Context window in tokens */
  contextLength: number;
  /** Minimum GPU memory required in GB */
  minGpuMemoryGb: number;
  /** Regions where this model is available */
  availableRegions: SovereignRegion[];
  /** Whether the model is currently available for deployment */
  available: boolean;
  /** Sovereign compliance info */
  sovereignty: SovereigntyAnnotations;
  /** Carbon intensity of running this model (gCO2e/token estimate) */
  carbonPerToken?: number;
  metadata?: ResourceMetadata;
  timestamps: Timestamps;
}

// ─── Model Variant ──────────────────────────────────────────────────────────

export interface ModelVariant {
  modelId: string;
  quantization: QuantizationLevel;
  minGpuMemoryGb: number;
  estimatedThroughputTokensS: number;
  available: boolean;
}

// ─── List Params ────────────────────────────────────────────────────────────

export interface ListModelsParams {
  category?: ModelCategory;
  available?: boolean;
  region?: SovereignRegion;
  minContextLength?: number;
  maxParametersB?: number;
  limit?: number;
  cursor?: string;
}
