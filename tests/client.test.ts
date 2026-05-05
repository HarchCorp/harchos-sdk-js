import { describe, it, expect, vi, beforeEach } from "vitest";
import { HarchOSClient } from "../src/client.js";
import { AuthenticationError, SovereigntyViolationError } from "../src/errors.js";

// We test the client construction and config integration.
// HTTP-level tests would need a mock server (out of scope for unit tests).

describe("HarchOSClient", () => {
  let client: HarchOSClient;

  beforeEach(() => {
    client = new HarchOSClient({ apiKey: "test-key-123" });
  });

  it("creates a client with default config", () => {
    expect(client.config.baseUrl).toBe("https://api.harchos.com");
    expect(client.config.apiVersion).toBe("v1");
    expect(client.config.sovereign.region).toBe("morocco" as unknown as string);
  });

  it("exposes all resource modules", () => {
    expect(client.workloads).toBeDefined();
    expect(client.models).toBeDefined();
    expect(client.hubs).toBeDefined();
    expect(client.energy).toBeDefined();
  });

  it("has a circuit breaker", () => {
    expect(client.circuitBreaker.currentState).toBe("closed");
  });

  it("configures auth with API key", () => {
    expect(client.auth.authType).toBe("api_key");
  });

  it("accepts custom config overrides", () => {
    const custom = new HarchOSClient({
      apiKey: "key",
      config: {
        baseUrl: "https://custom.harchos.com",
        timeoutMs: 10_000,
      },
    });
    expect(custom.config.baseUrl).toBe("https://custom.harchos.com");
    expect(custom.config.timeoutMs).toBe(10_000);
  });

  it("accepts sovereign config overrides", () => {
    const custom = new HarchOSClient({
      apiKey: "key",
      config: {
        sovereign: {
          region: "nigeria",
          sovereignty: "moderate",
          dataResidency: "regional",
        },
      },
    });
    expect(custom.config.sovereign.region).toBe("nigeria" as unknown as string);
    expect(custom.config.sovereign.sovereignty).toBe("moderate" as unknown as string);
  });
});
