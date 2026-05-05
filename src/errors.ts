/**
 * @harchos/sdk v0.3.0 — Error Classes
 *
 * Custom error hierarchy with structured codes (E#### format),
 * human-readable titles, and machine-readable details.
 * Every error inherits from HarchOSError for easy catch-all handling.
 */

// ---------------------------------------------------------------------------
// Base Error
// ---------------------------------------------------------------------------

export class HarchOSError extends Error {
  /** Machine-readable error code in E#### format */
  public readonly code: string;
  /** Short human-readable title */
  public readonly title: string;
  /** Detailed error description */
  public readonly detail: string;
  /** HTTP status code (if applicable) */
  public readonly statusCode?: number;
  /** Response headers */
  public readonly headers: Record<string, string>;
  /** Raw response body */
  public readonly body?: unknown;

  constructor(opts: {
    message?: string;
    code?: string;
    title?: string;
    detail?: string;
    statusCode?: number;
    headers?: Record<string, string>;
    body?: unknown;
  }) {
    super(opts.message ?? opts.title ?? 'An unknown error occurred');
    this.name = 'HarchOSError';
    this.code = opts.code ?? 'E0000';
    this.title = opts.title ?? 'Unknown Error';
    this.detail = opts.detail ?? opts.message ?? '';
    this.statusCode = opts.statusCode;
    this.headers = opts.headers ?? {};
    this.body = opts.body;
  }

  /** String representation with code, title, and detail */
  override toString(): string {
    return `${this.name} [${this.code}]: ${this.title} — ${this.detail}`;
  }

  /** JSON-serializable representation */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      title: this.title,
      detail: this.detail,
      statusCode: this.statusCode,
    };
  }
}

// ---------------------------------------------------------------------------
// Authentication Errors
// ---------------------------------------------------------------------------

export class AuthenticationError extends HarchOSError {
  constructor(detail = 'Authentication failed', opts?: { headers?: Record<string, string>; body?: unknown }) {
    super({
      message: 'Authentication failed',
      code: 'E1001',
      title: 'Authentication Error',
      detail,
      statusCode: 401,
      headers: opts?.headers,
      body: opts?.body,
    });
    this.name = 'AuthenticationError';
  }
}

export class InvalidAPIKeyError extends HarchOSError {
  constructor(detail = 'The provided API key is invalid') {
    super({
      message: 'Invalid API key',
      code: 'E1002',
      title: 'Invalid API Key',
      detail,
      statusCode: 401,
    });
    this.name = 'InvalidAPIKeyError';
  }
}

// ---------------------------------------------------------------------------
// Permission Errors
// ---------------------------------------------------------------------------

export class PermissionDeniedError extends HarchOSError {
  constructor(detail = 'You do not have permission to perform this action') {
    super({
      message: 'Permission denied',
      code: 'E2001',
      title: 'Permission Denied',
      detail,
      statusCode: 403,
    });
    this.name = 'PermissionDeniedError';
  }
}

// ---------------------------------------------------------------------------
// Client Errors
// ---------------------------------------------------------------------------

export class BadRequestError extends HarchOSError {
  constructor(detail = 'The request was malformed', opts?: { headers?: Record<string, string>; body?: unknown }) {
    super({
      message: 'Bad request',
      code: 'E3001',
      title: 'Bad Request',
      detail,
      statusCode: 400,
      headers: opts?.headers,
      body: opts?.body,
    });
    this.name = 'BadRequestError';
  }
}

export class NotFoundError extends HarchOSError {
  constructor(detail = 'The requested resource was not found', opts?: { headers?: Record<string, string>; body?: unknown }) {
    super({
      message: 'Resource not found',
      code: 'E3002',
      title: 'Not Found',
      detail,
      statusCode: 404,
      headers: opts?.headers,
      body: opts?.body,
    });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends HarchOSError {
  constructor(detail = 'The request conflicts with the current state') {
    super({
      message: 'Conflict',
      code: 'E3003',
      title: 'Conflict',
      detail,
      statusCode: 409,
    });
    this.name = 'ConflictError';
  }
}

export class ValidationError extends HarchOSError {
  public readonly field?: string;

  constructor(detail = 'Validation failed', field?: string) {
    super({
      message: 'Validation error',
      code: 'E3004',
      title: 'Validation Error',
      detail: field ? `${detail} (field: ${field})` : detail,
    });
    this.name = 'ValidationError';
    this.field = field;
  }
}

// ---------------------------------------------------------------------------
// Rate Limit Error
// ---------------------------------------------------------------------------

export class RateLimitError extends HarchOSError {
  public readonly retryAfter?: number;

  constructor(detail = 'Rate limit exceeded', retryAfter?: number, opts?: { headers?: Record<string, string>; body?: unknown }) {
    super({
      message: 'Rate limit exceeded',
      code: 'E4001',
      title: 'Rate Limit Exceeded',
      detail: retryAfter
        ? `${detail} — retry after ${retryAfter}s`
        : detail,
      statusCode: 429,
      headers: opts?.headers,
      body: opts?.body,
    });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

// ---------------------------------------------------------------------------
// Server Errors
// ---------------------------------------------------------------------------

export class InternalServerError extends HarchOSError {
  constructor(detail = 'An internal server error occurred', opts?: { headers?: Record<string, string>; body?: unknown }) {
    super({
      message: 'Internal server error',
      code: 'E5001',
      title: 'Internal Server Error',
      detail,
      statusCode: 500,
      headers: opts?.headers,
      body: opts?.body,
    });
    this.name = 'InternalServerError';
  }
}

export class ServiceUnavailableError extends HarchOSError {
  constructor(detail = 'The service is temporarily unavailable') {
    super({
      message: 'Service unavailable',
      code: 'E5002',
      title: 'Service Unavailable',
      detail,
      statusCode: 503,
    });
    this.name = 'ServiceUnavailableError';
  }
}

// ---------------------------------------------------------------------------
// Sovereignty Errors
// ---------------------------------------------------------------------------

export class SovereigntyError extends HarchOSError {
  constructor(detail = 'Operation violates sovereignty constraints') {
    super({
      message: 'Sovereignty violation',
      code: 'E6001',
      title: 'Sovereignty Error',
      detail,
    });
    this.name = 'SovereigntyError';
  }
}

export class CarbonBudgetExceededError extends HarchOSError {
  public readonly budgetGrams?: number;
  public readonly actualGrams?: number;

  constructor(detail = 'Carbon budget exceeded', opts?: { budgetGrams?: number; actualGrams?: number }) {
    super({
      message: 'Carbon budget exceeded',
      code: 'E6002',
      title: 'Carbon Budget Exceeded',
      detail: opts?.budgetGrams != null && opts?.actualGrams != null
        ? `${detail} (budget: ${opts.budgetGrams}g, actual: ${opts.actualGrams}g)`
        : detail,
    });
    this.name = 'CarbonBudgetExceededError';
    this.budgetGrams = opts?.budgetGrams;
    this.actualGrams = opts?.actualGrams;
  }
}

// ---------------------------------------------------------------------------
// Network Errors
// ---------------------------------------------------------------------------

export class TimeoutError extends HarchOSError {
  constructor(detail = 'Request timed out') {
    super({
      message: 'Request timed out',
      code: 'E7001',
      title: 'Timeout',
      detail,
    });
    this.name = 'TimeoutError';
  }
}

export class ConnectionError extends HarchOSError {
  constructor(detail = 'Connection failed') {
    super({
      message: 'Connection failed',
      code: 'E7002',
      title: 'Connection Error',
      detail,
    });
    this.name = 'ConnectionError';
  }
}

export class NetworkError extends HarchOSError {
  public readonly cause?: Error;

  constructor(detail = 'Network error occurred', opts?: { cause?: Error }) {
    super({
      message: 'Network error',
      code: 'E7003',
      title: 'Network Error',
      detail,
    });
    this.name = 'NetworkError';
    this.cause = opts?.cause;
  }
}

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

export function isHarchOSError(error: unknown): error is HarchOSError {
  return error instanceof HarchOSError;
}

// ---------------------------------------------------------------------------
// Status Code → Error Class mapping
// ---------------------------------------------------------------------------

const STATUS_CODE_MAP: Record<number, new (detail?: string) => HarchOSError> = {
  400: BadRequestError as new (detail?: string) => HarchOSError,
  401: AuthenticationError as new (detail?: string) => HarchOSError,
  403: PermissionDeniedError,
  404: NotFoundError as new (detail?: string) => HarchOSError,
  409: ConflictError,
  429: RateLimitError as new (detail?: string) => HarchOSError,
  500: InternalServerError as new (detail?: string) => HarchOSError,
  503: ServiceUnavailableError,
};

/**
 * Raise the appropriate typed error for an HTTP status code.
 */
export function raiseForStatus(
  statusCode: number,
  message: string,
  headers?: Record<string, string>,
  body?: unknown,
): never {
  if (statusCode >= 200 && statusCode < 300) {
    // Should never reach here, but just in case
    return undefined as never;
  }

  const ErrorClass = STATUS_CODE_MAP[statusCode];

  if (ErrorClass === RateLimitError) {
    const retryAfter = headers?.['retry-after']
      ? Number(headers['retry-after'])
      : undefined;
    throw new RateLimitError(message, retryAfter, { headers, body });
  }

  if (ErrorClass === AuthenticationError) {
    throw new AuthenticationError(message, { headers, body });
  }

  if (ErrorClass === BadRequestError) {
    throw new BadRequestError(message, { headers, body });
  }

  if (ErrorClass === NotFoundError) {
    throw new NotFoundError(message, { headers, body });
  }

  if (ErrorClass === InternalServerError) {
    throw new InternalServerError(message, { headers, body });
  }

  if (ErrorClass) {
    throw new ErrorClass(message);
  }

  throw new HarchOSError({
    message,
    code: `E${statusCode}`,
    title: `HTTP ${statusCode}`,
    detail: message,
    statusCode,
    headers,
    body,
  });
}
