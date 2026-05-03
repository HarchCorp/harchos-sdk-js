import { describe, it, expect } from "vitest";
import {
  HarchOSError,
  AuthenticationError,
  TokenExpiredError,
  ForbiddenError,
  ConfigurationError,
  MissingProfileError,
  NetworkError,
  TimeoutError,
  RateLimitError,
  CircuitOpenError,
  SovereigntyViolationError,
  ResourceNotFoundError,
  WorkloadConflictError,
  EnergyInsufficientError,
  StreamDisconnectedError,
  isHarchOSError,
  isErrorCode,
} from "../src/errors.js";

describe("HarchOSError", () => {
  it("creates a base error with all fields", () => {
    const err = new HarchOSError({
      message: "test error",
      code: "UNKNOWN",
      statusCode: 500,
      requestId: "req-123",
    });
    expect(err.message).toBe("test error");
    expect(err.code).toBe("UNKNOWN");
    expect(err.statusCode).toBe(500);
    expect(err.requestId).toBe("req-123");
    expect(err.name).toBe("HarchOSError");
    expect(err.timestamp).toBeInstanceOf(Date);
  });

  it("serializes to JSON", () => {
    const err = new HarchOSError({
      message: "test",
      code: "UNKNOWN",
      statusCode: 500,
      requestId: "req-1",
    });
    const json = err.toJSON();
    expect(json.code).toBe("UNKNOWN");
    expect(json.statusCode).toBe(500);
    expect(json.requestId).toBe("req-1");
    expect(json.message).toBe("test");
  });

  it("supports cause chain", () => {
    const cause = new Error("original");
    const err = new HarchOSError({ message: "wrapped", code: "UNKNOWN", cause });
    expect(err.cause).toBe(cause);
  });
});

describe("Error Hierarchy", () => {
  it("AuthenticationError has correct code", () => {
    const err = new AuthenticationError("bad creds");
    expect(err.code).toBe("AUTH_INVALID_CREDENTIALS");
    expect(err).toBeInstanceOf(HarchOSError);
    expect(err).toBeInstanceOf(Error);
  });

  it("TokenExpiredError stores expiration", () => {
    const expiresAt = new Date("2025-01-01T00:00:00Z");
    const err = new TokenExpiredError(expiresAt);
    expect(err.code).toBe("AUTH_TOKEN_EXPIRED");
    expect(err.expiresAt).toBe(expiresAt);
    expect(err.statusCode).toBe(401);
  });

  it("ForbiddenError stores required role", () => {
    const err = new ForbiddenError("no access", { requiredRole: "admin" });
    expect(err.code).toBe("AUTH_FORBIDDEN");
    expect(err.requiredRole).toBe("admin");
    expect(err.statusCode).toBe(403);
  });

  it("RateLimitError stores retryAfterMs", () => {
    const err = new RateLimitError(5000);
    expect(err.code).toBe("RATE_LIMITED");
    expect(err.retryAfterMs).toBe(5000);
    expect(err.statusCode).toBe(429);
  });

  it("CircuitOpenError stores opensAt date", () => {
    const date = new Date();
    const err = new CircuitOpenError(date);
    expect(err.code).toBe("CIRCUIT_OPEN");
    expect(err.opensAt).toBe(date);
  });

  it("SovereigntyViolationError has violation type", () => {
    const err = new SovereigntyViolationError("region mismatch", "region_mismatch");
    expect(err.code).toBe("SOVEREIGNTY_REGION_MISMATCH");
    expect(err.violation).toBe("region_mismatch");
  });

  it("ResourceNotFoundError for workloads", () => {
    const err = new ResourceNotFoundError("Workload", "wl-123");
    expect(err.code).toBe("WORKLOAD_NOT_FOUND");
    expect(err.statusCode).toBe(404);
    expect(err.resource).toBe("Workload");
    expect(err.id).toBe("wl-123");
  });

  it("EnergyInsufficientError stores values", () => {
    const err = new EnergyInsufficientError(100, 50);
    expect(err.code).toBe("ENERGY_INSUFFICIENT");
    expect(err.requested).toBe(100);
    expect(err.available).toBe(50);
  });

  it("StreamDisconnectedError stores close code", () => {
    const err = new StreamDisconnectedError(1006);
    expect(err.code).toBe("STREAM_DISCONNECTED");
    expect(err.code_).toBe(1006);
  });

  it("WorkloadConflictError has 409 status", () => {
    const err = new WorkloadConflictError();
    expect(err.code).toBe("WORKLOAD_CONFLICT");
    expect(err.statusCode).toBe(409);
  });
});

describe("Type Guards", () => {
  it("isHarchOSError narrows type", () => {
    const err = new AuthenticationError();
    expect(isHarchOSError(err)).toBe(true);
    expect(isHarchOSError(new Error("plain"))).toBe(false);
    expect(isHarchOSError(null)).toBe(false);
    expect(isHarchOSError("string")).toBe(false);
  });

  it("isErrorCode discriminates by code", () => {
    const err = new RateLimitError(1000);
    expect(isErrorCode(err, "RATE_LIMITED")).toBe(true);
    expect(isErrorCode(err, "UNKNOWN")).toBe(false);
    expect(isErrorCode(new Error("x"), "UNKNOWN")).toBe(false);
  });
});
