/**
 * @harchos/sdk v0.3.0 — Inference Resource
 *
 * OpenAI-compatible chat completion API with carbon tracking.
 * Supports both regular and streaming responses.
 */

import { parseSSEStream, StreamingResponse } from '../streaming.js';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
} from '../types.js';

// ---------------------------------------------------------------------------
// HTTP Transport interface (injected by client)
// ---------------------------------------------------------------------------

export interface Transport {
  request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
    opts?: { stream?: boolean; headers?: Record<string, string> },
  ): Promise<T>;

  rawRequest(
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<Response>;
}

// ---------------------------------------------------------------------------
// Chat Completions Sub-resource
// ---------------------------------------------------------------------------

export class ChatCompletions {
  constructor(private readonly transport: Transport) {}

  /**
   * Create a chat completion.
   *
   * When `stream: true`, returns a StreamingResponse that can be iterated:
   * ```ts
   * const stream = await client.inference.chat.completions.create({
   *   model: 'harchos-llama-3.3-70b',
   *   messages: [{ role: 'user', content: 'Hello' }],
   *   stream: true,
   * });
   * for await (const chunk of stream) {
   *   process.stdout.write(chunk.choices[0]?.delta?.content || '');
   * }
   * ```
   */
  async create(
    params: ChatCompletionRequest & { stream?: false },
  ): Promise<ChatCompletionResponse>;
  async create(
    params: ChatCompletionRequest & { stream: true },
  ): Promise<StreamingResponse<ChatCompletionChunk>>;
  async create(
    params: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse | StreamingResponse<ChatCompletionChunk>>;
  async create(
    params: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse | StreamingResponse<ChatCompletionChunk>> {
    if (params.stream) {
      const response = await this.transport.rawRequest(
        'POST',
        '/inference/chat/completions',
        params,
      );

      if (!response.body) {
        throw new Error('No response body for streaming request');
      }

      const stream = parseSSEStream<ChatCompletionChunk>(response.body);
      return new StreamingResponse(stream);
    }

    return this.transport.request<ChatCompletionResponse>(
      'POST',
      '/inference/chat/completions',
      params,
    );
  }
}

// ---------------------------------------------------------------------------
// Chat Sub-resource
// ---------------------------------------------------------------------------

export class Chat {
  readonly completions: ChatCompletions;

  constructor(transport: Transport) {
    this.completions = new ChatCompletions(transport);
  }
}

// ---------------------------------------------------------------------------
// Inference Resource (top-level)
// ---------------------------------------------------------------------------

export class InferenceResource {
  readonly chat: Chat;

  constructor(transport: Transport) {
    this.chat = new Chat(transport);
  }
}
