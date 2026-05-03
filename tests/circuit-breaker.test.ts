import { describe, it, expect, vi } from "vitest";
import { CircuitBreaker, createCircuitBreaker, type CircuitState } from "../src/circuit-breaker.js";
import { CircuitOpenError } from "../src/errors.js";

describe("CircuitBreaker", () => {
  it("starts in closed state", () => {
    const cb = new CircuitBreaker();
    expect(cb.currentState).toBe("closed");
  });

  it("passes through requests in closed state", async () => {
    const cb = new CircuitBreaker();
    const result = await cb.execute(async () => 42);
    expect(result).toBe(42);
  });

  it("opens after reaching failure threshold", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000 });
    const fail = async () => {
      throw new Error("fail");
    };

    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(fail)).rejects.toThrow("fail");
    }

    expect(cb.currentState).toBe("open");
    await expect(cb.execute(async () => "ok")).rejects.toThrow(CircuitOpenError);
  });

  it("transitions to half-open after reset timeout", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 50 });

    // Trip the circuit
    await expect(cb.execute(async () => { throw new Error("fail"); })).rejects.toThrow();
    expect(cb.currentState).toBe("open");

    // Wait for reset timeout
    await new Promise((r) => setTimeout(r, 60));
    expect(cb.currentState).toBe("half_open");
  });

  it("closes after successful half-open probe", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 50 });

    // Trip the circuit
    await expect(cb.execute(async () => { throw new Error("fail"); })).rejects.toThrow();

    // Wait for half-open
    await new Promise((r) => setTimeout(r, 60));
    expect(cb.currentState).toBe("half_open");

    // Successful probe closes the circuit
    const result = await cb.execute(async () => "recovered");
    expect(result).toBe("recovered");
    expect(cb.currentState).toBe("closed");
  });

  it("re-opens on failed half-open probe", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 50 });

    // Trip the circuit
    await expect(cb.execute(async () => { throw new Error("fail"); })).rejects.toThrow();

    // Wait for half-open
    await new Promise((r) => setTimeout(r, 60));

    // Failed probe re-opens
    await expect(cb.execute(async () => { throw new Error("still failing"); })).rejects.toThrow();
    expect(cb.currentState).toBe("open");
  });

  it("fires onStateChange callback", async () => {
    const transitions: Array<[CircuitState, CircuitState]> = [];
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      resetTimeoutMs: 1000,
      onStateChange: (from, to) => transitions.push([from, to]),
    });

    await expect(cb.execute(async () => { throw new Error("fail"); })).rejects.toThrow();
    expect(transitions).toEqual([["closed", "open"]]);
  });

  it("manual reset closes the circuit", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1000 });
    await expect(cb.execute(async () => { throw new Error("fail"); })).rejects.toThrow();
    expect(cb.currentState).toBe("open");

    cb.reset();
    expect(cb.currentState).toBe("closed");
  });

  it("manual trip opens the circuit", () => {
    const cb = new CircuitBreaker();
    cb.trip();
    expect(cb.currentState).toBe("open");
    expect(cb.stats.totalTrips).toBe(1);
  });

  it("stats are accurate", async () => {
    const cb = new CircuitBreaker({ failureThreshold: 5 });

    // 2 successes
    await cb.execute(async () => 1);
    await cb.execute(async () => 2);

    // 1 failure
    await expect(cb.execute(async () => { throw new Error("x"); })).rejects.toThrow();

    const stats = cb.stats;
    expect(stats.successes).toBe(2);
    expect(stats.failures).toBe(1);
    expect(stats.state).toBe("closed");
  });

  it("createCircuitBreaker factory works", () => {
    const cb = createCircuitBreaker({ failureThreshold: 10 });
    expect(cb).toBeInstanceOf(CircuitBreaker);
  });
});
