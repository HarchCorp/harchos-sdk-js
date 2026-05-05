/**
 * @harchos/sdk v0.3.0 — Auth Resource
 *
 * Authentication and API key management.
 */

import type { Transport } from './inference.js';

export interface APIKeyInfo {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  expires_at?: string;
  scopes: string[];
}

export interface CreateAPIKeyParams {
  name: string;
  scopes?: string[];
  expires_in_days?: number;
}

export class AuthResource {
  constructor(private readonly transport: Transport) {}

  /** List your API keys. */
  async listKeys(): Promise<APIKeyInfo[]> {
    return this.transport.request<APIKeyInfo[]>('GET', '/auth/keys');
  }

  /** Create a new API key. */
  async createKey(params: CreateAPIKeyParams): Promise<APIKeyInfo & { key: string }> {
    return this.transport.request<APIKeyInfo & { key: string }>('POST', '/auth/keys', params);
  }

  /** Revoke an API key. */
  async revokeKey(keyId: string): Promise<void> {
    await this.transport.request('DELETE', `/auth/keys/${keyId}`);
  }

  /** Verify your current API key. */
  async verify(): Promise<APIKeyInfo> {
    return this.transport.request<APIKeyInfo>('GET', '/auth/verify');
  }
}
