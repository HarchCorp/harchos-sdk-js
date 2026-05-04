/**
 * HarchOS SDK Authentication Module
 *
 * Supports API key and OAuth2 client-credentials flows.
 * Handles automatic token refresh with a safety margin.
 */

import { AuthenticationError } from "./errors.js";

// ─── Browser-safe env access ─────────────────────────────────────────────────

function getEnvVar(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ApiKeyAuth {
  type: "api_key";
  apiKey: string;
}

export interface OAuth2Auth {
  type: "oauth2";
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scopes?: string[];
}

export type AuthProvider = ApiKeyAuth | OAuth2Auth;

export interface TokenInfo {
  accessToken: string;
  tokenType: string;
  expiresAt: Date | null;
  scopes: string[];
}

// ─── Auth Manager ───────────────────────────────────────────────────────────

/** Seconds before actual expiry when we consider a token stale */
const EXPIRY_BUFFER_S = 30;

export class AuthManager {
  private provider: AuthProvider;
  private cachedToken: TokenInfo | null = null;
  private refreshPromise: Promise<TokenInfo> | null = null;

  constructor(provider: AuthProvider) {
    this.provider = Object.freeze({ ...provider });
  }

  /** Get the current auth provider type */
  get authType(): "api_key" | "oauth2" {
    return this.provider.type;
  }

  /**
   * Get a valid authorization header value.
   * For API keys: returns the key directly.
   * For OAuth2: returns "Bearer <token>", refreshing if needed.
   */
  async getAuthorization(): Promise<string> {
    if (this.provider.type === "api_key") {
      return this.provider.apiKey;
    }

    const token = await this.getValidToken();
    return `${token.tokenType} ${token.accessToken}`;
  }

  /**
   * Build headers map with the appropriate Authorization header.
   */
  async authHeaders(): Promise<Record<string, string>> {
    const authorization = await this.getAuthorization();

    if (this.provider.type === "api_key") {
      return { "X-API-Key": authorization };
    }

    return { Authorization: authorization };
  }

  /**
   * Invalidate the cached token, forcing a refresh on next use.
   */
  invalidate(): void {
    this.cachedToken = null;
    this.refreshPromise = null;
  }

  // ─── Private ────────────────────────────────────────────────────────────

  private async getValidToken(): Promise<TokenInfo> {
    // Return cached if still fresh
    if (this.cachedToken && !this.isTokenExpired(this.cachedToken)) {
      return this.cachedToken;
    }

    // Dedupe concurrent refreshes
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.fetchToken();
    try {
      const token = await this.refreshPromise;
      this.cachedToken = token;
      return token;
    } finally {
      this.refreshPromise = null;
    }
  }

  private isTokenExpired(token: TokenInfo): boolean {
    if (!token.expiresAt) return false;
    const bufferMs = EXPIRY_BUFFER_S * 1000;
    return Date.now() >= token.expiresAt.getTime() - bufferMs;
  }

  private async fetchToken(): Promise<TokenInfo> {
    if (this.provider.type !== "oauth2") {
      throw new AuthenticationError("OAuth2 token fetch called on API key provider");
    }

    const { clientId, clientSecret, tokenUrl, scopes } = this.provider;

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    });

    if (scopes && scopes.length > 0) {
      body.set("scope", scopes.join(" "));
    }

    let response: Response;
    try {
      response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: body.toString(),
      });
    } catch (cause) {
      throw new AuthenticationError("Failed to reach OAuth2 token endpoint", {
        cause: cause as Error,
      });
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new AuthenticationError(
        `OAuth2 token request failed (${response.status}): ${text}`,
        { statusCode: response.status },
      );
    }

    const json = await response.json() as Record<string, unknown>;

    if (typeof json.access_token !== "string") {
      throw new AuthenticationError("OAuth2 response missing access_token");
    }

    const expiresIn =
      typeof json.expires_in === "number" ? json.expires_in : null;

    return {
      accessToken: json.access_token,
      tokenType: typeof json.token_type === "string" ? json.token_type : "Bearer",
      expiresAt: expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : null,
      scopes: typeof json.scope === "string" ? json.scope.split(" ") : scopes ?? [],
    };
  }
}

// ─── Factory Helpers ────────────────────────────────────────────────────────

/**
 * Create an API key auth provider from environment or explicit value.
 */
export function apiKeyAuth(apiKey?: string): ApiKeyAuth {
  const key = apiKey ?? getEnvVar("HARCHOS_API_KEY");
  if (!key) {
    throw new AuthenticationError(
      "API key required. Pass explicitly or set HARCHOS_API_KEY env var.",
    );
  }
  return { type: "api_key", apiKey: key };
}

/**
 * Create an OAuth2 auth provider.
 */
export function oauth2Auth(opts: {
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
  scopes?: string[];
}): OAuth2Auth {
  const clientId = opts.clientId ?? getEnvVar("HARCHOS_CLIENT_ID");
  const clientSecret = opts.clientSecret ?? getEnvVar("HARCHOS_CLIENT_SECRET");
  const tokenUrl =
    opts.tokenUrl ?? getEnvVar("HARCHOS_TOKEN_URL") ?? "https://auth.harchos.com/oauth2/token";

  if (!clientId || !clientSecret) {
    throw new AuthenticationError(
      "OAuth2 requires clientId and clientSecret. " +
      "Pass explicitly or set HARCHOS_CLIENT_ID / HARCHOS_CLIENT_SECRET env vars.",
    );
  }

  return {
    type: "oauth2",
    clientId,
    clientSecret,
    tokenUrl,
    scopes: opts.scopes,
  };
}
