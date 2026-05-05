/**
 * @harchos/sdk v0.3.0 — SSE Streaming Parser
 *
 * Server-Sent Events (SSE) parser for OpenAI-compatible streaming responses.
 * Parses `data: {...}\n\n` formatted SSE streams into typed chunks.
 */

import type { ChatCompletionChunk } from './types.js';

// ---------------------------------------------------------------------------
// SSE Line Parser
// ---------------------------------------------------------------------------

/**
 * Parse a single SSE data line into a ChatCompletionChunk.
 * Handles `data: [DONE]` as the stream terminator.
 */
export function parseSSELine<T = ChatCompletionChunk>(line: string): T | null {
  // Trim whitespace
  const trimmed = line.trim();

  // Empty lines are separators — skip
  if (trimmed === '') return null;

  // Lines must start with "data: " or "data:"
  if (!trimmed.startsWith('data:')) return null;

  // Extract the data payload
  const data = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5);

  // Stream terminator
  if (data.trim() === '[DONE]') {
    return null;
  }

  try {
    return JSON.parse(data) as T;
  } catch {
    // Malformed JSON — skip
    return null;
  }
}

// ---------------------------------------------------------------------------
// SSE Stream Parser (Async Iterable)
// ---------------------------------------------------------------------------

/**
 * Create an async iterable from a ReadableStream of SSE data.
 * Used for OpenAI-compatible chat completion streaming.
 *
 * @example
 * ```ts
 * const stream = parseSSEStream(response.body!);
 * for await (const chunk of stream) {
 *   process.stdout.write(chunk.choices[0]?.delta?.content || '');
 * }
 * ```
 */
export async function* parseSSEStream<T = ChatCompletionChunk>(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<T, void, undefined> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Process any remaining data in buffer
        if (buffer.trim()) {
          const lines = buffer.split('\n');
          for (const line of lines) {
            const parsed = parseSSELine<T>(line);
            if (parsed !== null) {
              yield parsed;
            }
          }
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events (separated by double newlines)
      const parts = buffer.split('\n\n');

      // Keep the last part in the buffer (might be incomplete)
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const lines = part.split('\n');
        for (const line of lines) {
          const parsed = parseSSELine<T>(line);
          if (parsed !== null) {
            yield parsed;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// StreamingResponse — wraps an async iterable with convenience methods
// ---------------------------------------------------------------------------

export class StreamingResponse<T = ChatCompletionChunk> implements AsyncIterable<T> {
  private readonly stream: AsyncIterable<T>;

  constructor(stream: AsyncIterable<T>) {
    this.stream = stream;
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this.stream[Symbol.asyncIterator]();
  }

  /**
   * Collect all chunks into a single array.
   * Useful for testing or when you need all chunks at once.
   */
  async toArray(): Promise<T[]> {
    const chunks: T[] = [];
    for await (const chunk of this.stream) {
      chunks.push(chunk);
    }
    return chunks;
  }

  /**
   * Collect all content from streaming chat completion chunks into a single string.
   * Only works when T is ChatCompletionChunk.
   */
  async toText(): Promise<string> {
    let content = '';
    for await (const chunk of this.stream) {
      const c = chunk as unknown as ChatCompletionChunk;
      const delta = c.choices?.[0]?.delta?.content;
      if (delta) {
        content += delta;
      }
    }
    return content;
  }
}
