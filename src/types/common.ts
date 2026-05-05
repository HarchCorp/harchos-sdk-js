/**
 * Common types shared across all HarchOS SDK modules.
 */

import type { SovereignRegion, SovereigntyLevel, DataClassification } from "./sovereignty.js";

// ─── Pagination ─────────────────────────────────────────────────────────────

export interface PaginationParams {
  /** Maximum number of items to return (1–100, default: 25) */
  limit?: number;
  /** Cursor for the next page of results */
  cursor?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  /** Cursor to fetch the next page (null if last page) */
  nextCursor: string | null;
  /** Total items available (may be approximate) */
  totalCount: number;
  hasMore: boolean;
}

// ─── API Response Envelope ──────────────────────────────────────────────────

/** Successful API response envelope */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

/** Error API response envelope */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: ResponseMeta;
}

/** Discriminated union of API responses */
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  region: SovereignRegion;
  latencyMs: number;
}

// ─── Sorting ────────────────────────────────────────────────────────────────

export type SortOrder = "asc" | "desc";

export interface SortParams {
  /** Field to sort by */
  field: string;
  order?: SortOrder;
}

// ─── Timestamps ─────────────────────────────────────────────────────────────

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

// ─── Metadata ───────────────────────────────────────────────────────────────

export interface ResourceMetadata {
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

// ─── Sovereignty Annotations ────────────────────────────────────────────────

export interface SovereigntyAnnotations {
  region: SovereignRegion;
  sovereignty: SovereigntyLevel;
  dataClassification: DataClassification;
  dataResidency: "local" | "regional";
  encryptedAtRest: boolean;
}

// ─── Health ─────────────────────────────────────────────────────────────────

export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface HealthCheck {
  status: HealthStatus;
  message?: string;
  checkedAt: string;
}

// ─── RequestOptions ─────────────────────────────────────────────────────────

export interface RequestOptions {
  /** Request timeout in milliseconds (overrides client default) */
  timeoutMs?: number;
  /** Maximum retries for this request (overrides client default) */
  maxRetries?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Extra headers for this request */
  headers?: Record<string, string>;
  /** Idempotency key for safe retries */
  idempotencyKey?: string;
}

// ─── ListParams ─────────────────────────────────────────────────────────────

export interface ListParams extends PaginationParams {
  sort?: SortParams;
  /** Filter by label key=value pairs */
  labels?: Record<string, string>;
}
