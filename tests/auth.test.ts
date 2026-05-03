import { describe, it, expect } from "vitest";
import { AuthManager, apiKeyAuth, oauth2Auth } from "../src/auth.js";
import { AuthenticationError } from "../src/errors.js";

describe("apiKeyAuth", () => {
  it("creates an API key auth provider", () => {
    const auth = apiKeyAuth("test-key-123");
    expect(auth.type).toBe("api_key");
    expect(auth.apiKey).toBe("test-key-123");
  });

  it("throws if no API key is provided or in env", () => {
    const original = process.env["HARCHOS_API_KEY"];
    delete process.env["HARCHOS_API_KEY"];
    try {
      expect(() => apiKeyAuth()).toThrow(AuthenticationError);
    } finally {
      if (original) process.env["HARCHOS_API_KEY"] = original;
    }
  });

  it("reads API key from environment", () => {
    const original = process.env["HARCHOS_API_KEY"];
    process.env["HARCHOS_API_KEY"] = "env-key-456";
    try {
      const auth = apiKeyAuth();
      expect(auth.apiKey).toBe("env-key-456");
    } finally {
      if (original) {
        process.env["HARCHOS_API_KEY"] = original;
      } else {
        delete process.env["HARCHOS_API_KEY"];
      }
    }
  });
});

describe("oauth2Auth", () => {
  it("creates an OAuth2 auth provider", () => {
    const auth = oauth2Auth({
      clientId: "my-client",
      clientSecret: "my-secret",
      tokenUrl: "https://auth.example.com/token",
    });
    expect(auth.type).toBe("oauth2");
    expect(auth.clientId).toBe("my-client");
  });

  it("throws if credentials are missing", () => {
    const origId = process.env["HARCHOS_CLIENT_ID"];
    const origSecret = process.env["HARCHOS_CLIENT_SECRET"];
    delete process.env["HARCHOS_CLIENT_ID"];
    delete process.env["HARCHOS_CLIENT_SECRET"];
    try {
      expect(() => oauth2Auth({})).toThrow(AuthenticationError);
    } finally {
      if (origId) process.env["HARCHOS_CLIENT_ID"] = origId;
      if (origSecret) process.env["HARCHOS_CLIENT_SECRET"] = origSecret;
    }
  });
});

describe("AuthManager", () => {
  it("returns API key in X-API-Key header", async () => {
    const auth = new AuthManager(apiKeyAuth("test-key"));
    const headers = await auth.authHeaders();
    expect(headers["X-API-Key"]).toBe("test-key");
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("reports auth type correctly", () => {
    const apiManager = new AuthManager(apiKeyAuth("key"));
    expect(apiManager.authType).toBe("api_key");

    const oauthManager = new AuthManager(
      oauth2Auth({
        clientId: "c",
        clientSecret: "s",
      }),
    );
    expect(oauthManager.authType).toBe("oauth2");
  });

  it("invalidation resets cached token", async () => {
    const auth = new AuthManager(apiKeyAuth("test-key"));
    // For API key, invalidation is a no-op but shouldn't throw
    auth.invalidate();
    const headers = await auth.authHeaders();
    expect(headers["X-API-Key"]).toBe("test-key");
  });
});
