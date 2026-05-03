/**
 * WebSocket Streaming with Async Iterables for HarchOS SDK
 *
 * Provides real-time streaming via WebSocket connections with:
 *   - Async iterable interface (for-await-of)
 *   - Automatic reconnection with exponential backoff
 *   - Type-safe message deserialization
 *   - Graceful close and cleanup
 *   - Heartbeat / keep-alive
 */

import { StreamDisconnectedError, NetworkError } from "./errors.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StreamingConfig {
  /** WebSocket URL base (default: wss://stream.harchos.com) */
  url: string;
  /** Reconnect on disconnection (default: true) */
  autoReconnect: boolean;
  /** Maximum reconnection attempts (default: 10) */
  maxReconnectAttempts: number;
  /** Initial reconnection delay in ms (default: 1_000) */
  reconnectDelayMs: number;
  /** Maximum reconnection delay cap in ms (default: 30_000) */
  maxReconnectDelayMs: number;
  /** Heartbeat interval in ms; 0 to disable (default: 30_000) */
  heartbeatIntervalMs: number;
  /** Custom headers (note: browsers don't support WS headers) */
  headers?: Record<string, string>;
}

export interface StreamMessage<T = unknown> {
  /** Message type discriminator */
  type: string;
  /** Payload data */
  data: T;
  /** Server timestamp */
  timestamp: string;
  /** Sequence number for ordering */
  sequence: number;
}

export type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export interface StreamEvents {
  onStateChange?: (state: ConnectionState) => void;
  onError?: (error: Error) => void;
  onReconnect?: (attempt: number) => void;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_STREAMING_CONFIG: Omit<StreamingConfig, "headers"> = {
  url: "wss://stream.harchos.com",
  autoReconnect: true,
  maxReconnectAttempts: 10,
  reconnectDelayMs: 1_000,
  maxReconnectDelayMs: 30_000,
  heartbeatIntervalMs: 30_000,
};

// ─── Streaming Client ───────────────────────────────────────────────────────

export class StreamClient implements AsyncIterable<StreamMessage>, AsyncDisposable {
  private config: StreamingConfig;
  private events: StreamEvents;
  private ws: WebSocket | null = null;
  private state: ConnectionState = "disconnected";
  private reconnectAttempt = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private messageQueue: StreamMessage[] = [];
  private pendingResolvers: Array<(result: IteratorResult<StreamMessage>) => void> = [];
  private abortController = new AbortController();
  private authToken: string | null = null;

  constructor(
    private path: string,
    config?: Partial<StreamingConfig>,
    events?: StreamEvents,
  ) {
    this.config = { ...DEFAULT_STREAMING_CONFIG, ...config };
    this.events = events ?? {};
  }

  /** Set the auth token for the WebSocket connection */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /** Current connection state */
  get connectionState(): ConnectionState {
    return this.state;
  }

  /** Connect to the WebSocket stream */
  async connect(): Promise<void> {
    if (this.state === "connected" || this.state === "connecting") {
      return;
    }

    this.setState("connecting");

    const url = new URL(this.path, this.config.url);
    if (this.authToken) {
      url.searchParams.set("token", this.authToken);
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url.toString());
      } catch (cause) {
        reject(new NetworkError(`Failed to create WebSocket: ${(cause as Error).message}`, { cause: cause as Error }));
        return;
      }

      this.ws.onopen = () => {
        this.setState("connected");
        this.reconnectAttempt = 0;
        this.startHeartbeat();
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as StreamMessage;
          this.enqueueMessage(message);
        } catch {
          // Skip malformed messages
        }
      };

      this.ws.onerror = () => {
        // onclose will fire after this
      };

      this.ws.onclose = (event) => {
        this.stopHeartbeat();
        this.ws = null;

        if (this.abortController.signal.aborted) {
          this.setState("disconnected");
          this.flushPending("Stream closed");
          return;
        }

        if (this.config.autoReconnect && this.reconnectAttempt < this.config.maxReconnectAttempts) {
          this.setState("reconnecting");
          this.scheduleReconnect();
        } else {
          this.setState("disconnected");
          const error = new StreamDisconnectedError(event.code);
          this.events.onError?.(error);
          this.flushPending("Stream closed", error);
        }
      };
    });
  }

  /** Disconnect from the stream */
  disconnect(): void {
    this.abortController.abort();
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
    this.setState("disconnected");
    this.flushPending("Stream closed");
  }

  /** Send a message through the WebSocket */
  send(data: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new StreamDisconnectedError(null);
    }
    this.ws.send(JSON.stringify(data));
  }

  // ─── Async Iterable ───────────────────────────────────────────────────

  [Symbol.asyncIterator](): AsyncIterator<StreamMessage> {
    return {
      next: (): Promise<IteratorResult<StreamMessage>> => {
        if (this.messageQueue.length > 0) {
          return Promise.resolve({ value: this.messageQueue.shift()!, done: false });
        }

        if (this.state === "disconnected" && !this.config.autoReconnect) {
          return Promise.resolve({ value: undefined, done: true } as IteratorResult<StreamMessage>);
        }

        return new Promise<IteratorResult<StreamMessage>>((resolve) => {
          this.pendingResolvers.push(resolve);
        });
      },
      return: (): Promise<IteratorResult<StreamMessage>> => {
        this.disconnect();
        return Promise.resolve({ value: undefined, done: true } as IteratorResult<StreamMessage>);
      },
    };
  }

  // ─── Async Disposable ─────────────────────────────────────────────────

  async [Symbol.asyncDispose](): Promise<void> {
    this.disconnect();
  }

  // ─── Private ──────────────────────────────────────────────────────────

  private enqueueMessage(message: StreamMessage): void {
    if (this.pendingResolvers.length > 0) {
      const resolver = this.pendingResolvers.shift()!;
      resolver({ value: message, done: false });
    } else {
      this.messageQueue.push(message);
    }
  }

  private flushPending(reason: string, error?: Error): void {
    while (this.pendingResolvers.length > 0) {
      const resolver = this.pendingResolvers.shift()!;
      if (error) {
        // Rejecting would break the iterator protocol, so end iteration
        resolver({ value: undefined, done: true } as IteratorResult<StreamMessage>);
      } else {
        resolver({ value: undefined, done: true } as IteratorResult<StreamMessage>);
      }
    }
  }

  private setState(state: ConnectionState): void {
    if (this.state === state) return;
    this.state = state;
    this.events.onStateChange?.(state);
  }

  private startHeartbeat(): void {
    if (this.config.heartbeatIntervalMs <= 0) return;
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, this.config.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempt++;
    const delay = Math.min(
      this.config.reconnectDelayMs * Math.pow(2, this.reconnectAttempt - 1),
      this.config.maxReconnectDelayMs,
    );
    const jitter = delay * 0.1 * Math.random();
    const totalDelay = delay + jitter;

    this.events.onReconnect?.(this.reconnectAttempt);

    setTimeout(() => {
      if (!this.abortController.signal.aborted) {
        this.connect().catch((error: Error) => {
          this.events.onError?.(error);
        });
      }
    }, totalDelay);
  }
}

// ─── Typed Stream Factory ───────────────────────────────────────────────────

/**
 * Create a typed async iterable stream for a specific HarchOS resource.
 *
 * @example
 * ```ts
 * const stream = createStream<WorkloadEvent>("/workloads/123/events", config);
 * for await (const message of stream) {
 *   console.log(message.data); // WorkloadEvent
 * }
 * ```
 */
export function createStream<T = unknown>(
  path: string,
  config?: Partial<StreamingConfig>,
  events?: StreamEvents,
): StreamClient & { [Symbol.asyncIterator](): AsyncIterator<StreamMessage<T>> } {
  const client = new StreamClient(path, config, events);
  return client as StreamClient & { [Symbol.asyncIterator](): AsyncIterator<StreamMessage<T>> };
}

/** Typed stream message */
export type StreamMessageOf<T> = Omit<StreamMessage, "data"> & { data: T };
