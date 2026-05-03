import { describe, it, expect } from "vitest";
import { isRetryableError, calculateDelay, withRetry } from "../src/retry.js";
import {
  NetworkError,
  RateLimitError,
  TimeoutError,
  HarchOSError,
} from "../src/errors.js";

describe("isRetryableError", () => {
  it("retries on NetworkError", () => {
    expect(isRetryableError(new NetworkError())).toBe(true);
  });

  it("retries on TimeoutError", () => {
    expect(isRetryableError(new TimeoutError(5000))).toBe(true);
  });

  it("retries on RateLimitError", () => {
    expect(isRetryableError(new RateLimitError(1000))).toBe(true);
  });

  it("retries on 5xx HarchOSError", () => {
    const err = new HarchOSError({ message: "bad gateway", code: "UNKNOWN", statusCode: 502 });
    expect(isRetryableError(err)).toBe(true);
  });

  it("does not retry on 4xx (non-429)", () => {
    const err = new HarchOSError({ message: "not found", code: "UNKNOWN", statusCode: 404 });
    expect(isRetryableError(err)).toBe(false);
  });

  it("does not retry on generic Error", () => {
    expect(isRetryableError(new Error("generic"))).toBe(false);
  });
});

describe("calculateDelay", () => {
  const config = {
    initialDelayMs: 1000,
    maxDelayMs: 30_000,
    backoffMultiplier: 2,
    jitter: "none" as const,
  };

  it("calculates exponential backoff", () => {
    expect(calculateDelay(0, config)).toBe(1000);
    expect(calculateDelay(1, config)).toBe(2000);
    expect(calculateDelay(2, config)).toBe(4000);
    expect(calculateDelay(3, config)).toBe(8000);
  });

  it("caps at maxDelayMs", () => {
    expect(calculateDelay(10, config)).toBe(30_000);
  });

  it("full jitter returns value between 0 and base", () => {
    const jitterConfig = { ...config, jitter: "full" as const };
    const delay = calculateDelay(2, jitterConfig);
    expect(delay).toBeGreaterThanOrEqual(0);
    expect(delay).toBeLessThanOrEqual(4000);
  });
});

describe("withRetry", () => {
  it("returns value on first successful attempt", async () => {
    const result = await withRetry(async () => 42);
    expect(result.value).toBe(42);
    expect(result.attempts).toBe(1);
  });

  it("retries on retryable errors and succeeds", async () => {
    let callCount = 0;
    const result = await withRetry(
      async () => {
        callCount++;
        if (callCount < 3) throw new NetworkError("fail");
        return "success";
      },
      {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
        jitter: "none",
      },
    );
    expect(result.value).toBe("success");
    expect(result.attempts).toBe(3);
  });

  it("throws after exhausting retries", async () => {
    await expect(
      withRetry(
        async () => {
          throw new NetworkError("always fails");
        },
        {
          maxRetries: 2,
          initialDelayMs: 10,
          maxDelayMs: 100,
          backoffMultiplier: 1,
          jitter: "none",
        },
      ),
    ).rejects.toThrow(NetworkError);
  });

  it("does not retry non-retryable errors", async () => {
    const err = new HarchOSError({ message: "bad request", code: "UNKNOWN", statusCode: 400 });
    await expect(
      withRetry(
        async () => { throw err; },
        {
          maxRetries: 3,
          initialDelayMs: 10,
          maxDelayMs: 100,
          backoffMultiplier: 1,
          jitter: "none",
        },
      ),
    ).rejects.toThrow(HarchOSError);
  });

  it("calls onRetry callback", async () => {
    const retries: number[] = [];
    let callCount = 0;

    await withRetry(
      async () => {
        callCount++;
        if (callCount < 3) throw new NetworkError("fail");
        return "ok";
      },
      {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 1,
        jitter: "none",
        onRetry: (attempt) => retries.push(attempt),
      },
    );

    expect(retries).toEqual([1, 2]);
  });
});
