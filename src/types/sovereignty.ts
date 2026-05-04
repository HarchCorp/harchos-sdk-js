/**
 * Branded Types for HarchOS Sovereignty System
 *
 * Branded types enforce compile-time guarantees that plain strings/numbers
 * cannot satisfy accidentally. Use the `brand<T>` helper and the
 * corresponding factory functions to create values.
 */

// ─── Brand Utility ──────────────────────────────────────────────────────────

/**
 * Opaque branded type. The phantom `_brand` field ensures nominal typing
 * so that `SovereignRegion` is NOT assignable to `string`.
 */
export type Brand<T, B extends string> = T & { readonly _brand: B };

/** Brand a value at the boundary (e.g., after validation). */
export function brand<T, B extends string>(value: T): Brand<T, B> {
  return value as Brand<T, B>;
}

// ─── Sovereignty Levels ─────────────────────────────────────────────────────

/** The strictness level for data sovereignty enforcement. */
export type SovereigntyLevel =
  | Brand<"strict", "SovereigntyLevel">
  | Brand<"moderate", "SovereigntyLevel">
  | Brand<"minimal", "SovereigntyLevel">;

/** Create a validated SovereigntyLevel. Throws on invalid values. */
export function SovereigntyLevel(level: string): SovereigntyLevel {
  const valid = ["strict", "moderate", "minimal"] as const;
  if (!valid.includes(level as (typeof valid)[number])) {
    throw new Error(
      `Invalid sovereignty level "${level}". Must be one of: ${valid.join(", ")}`,
    );
  }
  return brand<string, "SovereigntyLevel">(level) as SovereigntyLevel;
}

SovereigntyLevel.STRICT = brand<string, "SovereigntyLevel">("strict") as SovereigntyLevel;
SovereigntyLevel.MODERATE = brand<string, "SovereigntyLevel">("moderate") as SovereigntyLevel;
SovereigntyLevel.MINIMAL = brand<string, "SovereigntyLevel">("minimal") as SovereigntyLevel;

// ─── Sovereign Region ───────────────────────────────────────────────────────

/** A validated HarchOS region identifier. */
export type SovereignRegion =
  | Brand<"morocco", "SovereignRegion">
  | Brand<"algeria", "SovereignRegion">
  | Brand<"tunisia", "SovereignRegion">
  | Brand<"egypt", "SovereignRegion">
  | Brand<"nigeria", "SovereignRegion">
  | Brand<"kenya", "SovereignRegion">
  | Brand<"south-africa", "SovereignRegion">
  | Brand<"senegal", "SovereignRegion">
  | Brand<"ghana", "SovereignRegion">
  | Brand<"ethiopia", "SovereignRegion">;

const VALID_REGIONS = [
  "morocco",
  "algeria",
  "tunisia",
  "egypt",
  "nigeria",
  "kenya",
  "south-africa",
  "senegal",
  "ghana",
  "ethiopia",
] as const;

/** Create a validated SovereignRegion. Throws on invalid values. */
export function SovereignRegion(region: string): SovereignRegion {
  if (!VALID_REGIONS.includes(region as (typeof VALID_REGIONS)[number])) {
    throw new Error(
      `Invalid sovereign region "${region}". Must be one of: ${VALID_REGIONS.join(", ")}`,
    );
  }
  return brand<string, "SovereignRegion">(region) as SovereignRegion;
}

SovereignRegion.MOROCCO = brand<string, "SovereignRegion">("morocco") as SovereignRegion;
SovereignRegion.ALGERIA = brand<string, "SovereignRegion">("algeria") as SovereignRegion;
SovereignRegion.TUNISIA = brand<string, "SovereignRegion">("tunisia") as SovereignRegion;
SovereignRegion.EGYPT = brand<string, "SovereignRegion">("egypt") as SovereignRegion;
SovereignRegion.NIGERIA = brand<string, "SovereignRegion">("nigeria") as SovereignRegion;
SovereignRegion.KENYA = brand<string, "SovereignRegion">("kenya") as SovereignRegion;
SovereignRegion.SOUTH_AFRICA = brand<string, "SovereignRegion">("south-africa") as SovereignRegion;
SovereignRegion.SENEGAL = brand<string, "SovereignRegion">("senegal") as SovereignRegion;
SovereignRegion.GHANA = brand<string, "SovereignRegion">("ghana") as SovereignRegion;
SovereignRegion.ETHIOPIA = brand<string, "SovereignRegion">("ethiopia") as SovereignRegion;

/** Type guard for SovereignRegion */
export function isSovereignRegion(value: string): value is SovereignRegion {
  return VALID_REGIONS.includes(value as (typeof VALID_REGIONS)[number]);
}

// ─── Sovereign Config (compile-time policy enforcement) ─────────────────────

/**
 * Branded config type that can ONLY be created via `createSovereignConfig()`.
 * This enforces that all policy checks are validated at the boundary.
 */
export type SovereignConfig = Brand<
  {
    readonly region: SovereignRegion;
    readonly sovereignty: SovereigntyLevel;
    readonly carbonAware: boolean;
    readonly dataResidency: "local" | "regional";
    readonly encryptionAtRest: boolean;
    readonly auditLogging: boolean;
  },
  "SovereignConfig"
>;

/** Options for creating a SovereignConfig */
export interface SovereignConfigInput {
  region?: string;
  sovereignty?: string;
  carbonAware?: boolean;
  dataResidency?: "local" | "regional";
  encryptionAtRest?: boolean;
  auditLogging?: boolean;
}

/**
 * Create a validated SovereignConfig. This is the ONLY way to produce
 * a value of type `SovereignConfig`, ensuring all policy defaults and
 * validations are applied at the boundary.
 *
 * Sovereign defaults:
 *  - region = "morocco"
 *  - sovereignty = "strict"
 *  - carbonAware = true
 *  - dataResidency = "local"
 *  - encryptionAtRest = true
 *  - auditLogging = true
 */
export function createSovereignConfig(input?: SovereignConfigInput): SovereignConfig {
  const region = SovereignRegion(input?.region ?? "morocco");
  const sovereignty = SovereigntyLevel(input?.sovereignty ?? "strict");
  const carbonAware = input?.carbonAware ?? true;
  const dataResidency = input?.dataResidency ?? "local";
  const encryptionAtRest = input?.encryptionAtRest ?? true;
  const auditLogging = input?.auditLogging ?? true;

  // Enforce strict sovereignty rules
  if (sovereignty === SovereigntyLevel.STRICT) {
    if (dataResidency !== "local") {
      throw new Error(
        'Strict sovereignty requires dataResidency="local". ' +
        'Use SovereigntyLevel.MODERATE or .MINIMAL for regional residency.',
      );
    }
    if (!encryptionAtRest) {
      throw new Error(
        "Strict sovereignty requires encryptionAtRest=true.",
      );
    }
    if (!auditLogging) {
      throw new Error(
        "Strict sovereignty requires auditLogging=true.",
      );
    }
  }

  return brand({
    region,
    sovereignty,
    carbonAware,
    dataResidency,
    encryptionAtRest,
    auditLogging,
  });
}

// ─── Data Classification ────────────────────────────────────────────────────

export type DataClassification =
  | Brand<"public", "DataClassification">
  | Brand<"internal", "DataClassification">
  | Brand<"confidential", "DataClassification">
  | Brand<"restricted", "DataClassification">;

const VALID_CLASSIFICATIONS = ["public", "internal", "confidential", "restricted"] as const;

export function DataClassification(level: string): DataClassification {
  if (!VALID_CLASSIFICATIONS.includes(level as (typeof VALID_CLASSIFICATIONS)[number])) {
    throw new Error(
      `Invalid data classification "${level}". Must be one of: ${VALID_CLASSIFICATIONS.join(", ")}`,
    );
  }
  return brand<string, "DataClassification">(level) as DataClassification;
}

DataClassification.PUBLIC = brand<string, "DataClassification">("public") as DataClassification;
DataClassification.INTERNAL = brand<string, "DataClassification">("internal") as DataClassification;
DataClassification.CONFIDENTIAL = brand<string, "DataClassification">("confidential") as DataClassification;
DataClassification.RESTRICTED = brand<string, "DataClassification">("restricted") as DataClassification;
