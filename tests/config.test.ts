import { describe, it, expect, beforeEach } from "vitest";
import {
  resolveConfig,
  registerProfile,
  updateProfile,
  getProfile,
  listProfiles,
  type ProfileConfig,
} from "../src/config.js";
import { ConfigurationError, MissingProfileError } from "../src/errors.js";

// Reset profiles between tests
describe("Configuration", () => {
  beforeEach(() => {
    // We can't easily reset the module-level profiles map,
    // but we can test with unique profile names
  });

  it("resolves default config with sovereign defaults", () => {
    const config = resolveConfig();
    expect(config.baseUrl).toBe("https://api.harchos.com");
    expect(config.apiVersion).toBe("v1");
    expect(config.timeoutMs).toBe(30_000);
    expect(config.maxRetries).toBe(3);
    expect(config.sovereign.region).toBe("morocco" as unknown as string);
    expect(config.sovereign.sovereignty).toBe("strict" as unknown as string);
    expect(config.sovereign.carbonAware).toBe(true);
    expect(config.sovereign.dataResidency).toBe("local");
  });

  it("resolves config with explicit overrides", () => {
    const config = resolveConfig({
      overrides: {
        baseUrl: "https://custom.api.com",
        timeoutMs: 10_000,
      },
    });
    expect(config.baseUrl).toBe("https://custom.api.com");
    expect(config.timeoutMs).toBe(10_000);
  });

  it("registers and uses a named profile", () => {
    const profileName = `test-profile-${Date.now()}`;
    registerProfile(profileName, {
      baseUrl: "https://staging.api.harchos.com",
      timeoutMs: 5_000,
    });
    const config = resolveConfig({ profile: profileName });
    expect(config.baseUrl).toBe("https://staging.api.harchos.com");
    expect(config.timeoutMs).toBe(5_000);
  });

  it("throws on duplicate profile registration", () => {
    const name = `dup-${Date.now()}`;
    registerProfile(name, {});
    expect(() => registerProfile(name, {})).toThrow(ConfigurationError);
  });

  it("throws on missing profile", () => {
    expect(() => getProfile("nonexistent-profile")).toThrow(MissingProfileError);
  });

  it("updates an existing profile", () => {
    const name = `update-${Date.now()}`;
    registerProfile(name, { baseUrl: "https://old.com" });
    updateProfile(name, { baseUrl: "https://new.com" });
    const profile = getProfile(name);
    expect(profile.baseUrl).toBe("https://new.com");
  });

  it("lists registered profiles", () => {
    const names = listProfiles();
    expect(names).toContain("default");
  });

  it("validates timeout bounds", () => {
    expect(() =>
      resolveConfig({ overrides: { timeoutMs: 500 } })
    ).toThrow(ConfigurationError);
  });

  it("validates maxRetries bounds", () => {
    expect(() =>
      resolveConfig({ overrides: { maxRetries: 15 } })
    ).toThrow(ConfigurationError);
  });

  it("rejects non-local dataResidency with strict sovereignty", () => {
    expect(() =>
      resolveConfig({
        overrides: {
          sovereign: { sovereignty: "strict", dataResidency: "regional" },
        },
      })
    ).toThrow();
  });

  it("allows regional dataResidency with moderate sovereignty", () => {
    const config = resolveConfig({
      overrides: {
        sovereign: { sovereignty: "moderate", dataResidency: "regional" },
      },
    });
    expect(config.sovereign.dataResidency).toBe("regional");
  });

  it("returns frozen config object", () => {
    const config = resolveConfig();
    expect(Object.isFrozen(config)).toBe(true);
  });
});
