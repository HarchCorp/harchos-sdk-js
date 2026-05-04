import { describe, it, expect } from "vitest";
import {
  SovereigntyLevel,
  SovereignRegion,
  isSovereignRegion,
  createSovereignConfig,
  DataClassification,
  type SovereignConfig,
} from "../src/types/sovereignty.js";
import { SovereigntyViolationError } from "../src/errors.js";

describe("SovereigntyLevel", () => {
  it("creates valid levels", () => {
    expect(SovereigntyLevel("strict")).toBe("strict" as unknown as string);
    expect(SovereigntyLevel("moderate")).toBe("moderate" as unknown as string);
    expect(SovereigntyLevel("minimal")).toBe("minimal" as unknown as string);
  });

  it("has static convenience values", () => {
    expect(SovereigntyLevel.STRICT).toBe("strict" as unknown as string);
    expect(SovereigntyLevel.MODERATE).toBe("moderate" as unknown as string);
    expect(SovereigntyLevel.MINIMAL).toBe("minimal" as unknown as string);
  });

  it("throws on invalid level", () => {
    expect(() => SovereigntyLevel("invalid")).toThrow();
  });
});

describe("SovereignRegion", () => {
  it("creates valid regions", () => {
    expect(SovereignRegion("morocco")).toBe("morocco" as unknown as string);
    expect(SovereignRegion("nigeria")).toBe("nigeria" as unknown as string);
    expect(SovereignRegion("kenya")).toBe("kenya" as unknown as string);
  });

  it("has static convenience values", () => {
    expect(SovereignRegion.MOROCCO).toBe("morocco" as unknown as string);
    expect(SovereignRegion.NIGERIA).toBe("nigeria" as unknown as string);
    expect(SovereignRegion.SOUTH_AFRICA).toBe("south-africa" as unknown as string);
  });

  it("throws on invalid region", () => {
    expect(() => SovereignRegion("invalid-region")).toThrow();
  });

  it("isSovereignRegion type guard works", () => {
    expect(isSovereignRegion("morocco")).toBe(true);
    expect(isSovereignRegion("invalid")).toBe(false);
  });
});

describe("DataClassification", () => {
  it("creates valid classifications", () => {
    expect(DataClassification("public")).toBe("public" as unknown as string);
    expect(DataClassification("restricted")).toBe("restricted" as unknown as string);
  });

  it("throws on invalid classification", () => {
    expect(() => DataClassification("top-secret")).toThrow();
  });
});

describe("createSovereignConfig", () => {
  it("creates default config with morocco + strict", () => {
    const config = createSovereignConfig();
    expect(config.region).toBe("morocco" as unknown as string);
    expect(config.sovereignty).toBe("strict" as unknown as string);
    expect(config.carbonAware).toBe(true);
    expect(config.dataResidency).toBe("local");
    expect(config.encryptionAtRest).toBe(true);
    expect(config.auditLogging).toBe(true);
  });

  it("accepts custom region and sovereignty", () => {
    const config = createSovereignConfig({
      region: "nigeria",
      sovereignty: "moderate",
      dataResidency: "regional",
    });
    expect(config.region).toBe("nigeria" as unknown as string);
    expect(config.sovereignty).toBe("moderate" as unknown as string);
    expect(config.dataResidency).toBe("regional");
  });

  it("rejects regional dataResidency with strict sovereignty", () => {
    expect(() =>
      createSovereignConfig({
        sovereignty: "strict",
        dataResidency: "regional",
      })
    ).toThrow();
  });

  it("rejects encryptionAtRest=false with strict sovereignty", () => {
    expect(() =>
      createSovereignConfig({
        sovereignty: "strict",
        encryptionAtRest: false,
      })
    ).toThrow();
  });

  it("rejects auditLogging=false with strict sovereignty", () => {
    expect(() =>
      createSovereignConfig({
        sovereignty: "strict",
        auditLogging: false,
      })
    ).toThrow();
  });

  it("allows relaxed settings with moderate sovereignty", () => {
    const config = createSovereignConfig({
      sovereignty: "moderate",
      dataResidency: "regional",
    });
    expect(config.dataResidency).toBe("regional");
  });

  it("returns a branded SovereignConfig type", () => {
    const config = createSovereignConfig();
    // Branded type should have the _brand property at compile time
    // At runtime, it's just the object
    expect(typeof config).toBe("object");
    expect(config.region).toBeDefined();
    expect(config.sovereignty).toBeDefined();
  });
});
