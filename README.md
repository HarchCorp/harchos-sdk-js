# @harchos/sdk

**Official TypeScript/JavaScript SDK for [HarchOS](https://harchos.com) — Sovereign AI Infrastructure for Africa**

[![CI](https://github.com/HarchCorp/harchos-sdk-js/actions/workflows/ci.yml/badge.svg)](https://github.com/HarchCorp/harchos-sdk-js/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@harchos/sdk.svg)](https://www.npmjs.com/package/@harchos/sdk)
[![license](https://img.shields.io/github/license/HarchCorp/harchos-sdk-js)](./LICENSE)

## Features

- **Zero runtime dependencies** — lightweight, secure, auditable
- **Full TypeScript** — IntelliSense, discriminated unions, branded types
- **Tree-shakeable ESM** — only bundle what you use
- **Node.js 18+, Deno, browser** — universal runtime support
- **WebSocket streaming** — async iterables for real-time data
- **Circuit breaker** — resilient API calls with automatic recovery
- **Exponential backoff** — configurable retry with jitter strategies
- **Sovereign defaults** — region=`morocco`, sovereignty=`strict`, carbonAware=`true`
- **Branded types** — compile-time enforcement of sovereignty policies
- **React hooks** — `@harchos/react` companion package

## Install

```bash
# npm
npm install @harchos/sdk

# pnpm
pnpm add @harchos/sdk
```

## Quick Start

```typescript
import { HarchOSClient } from "@harchos/sdk";

const client = new HarchOSClient({
  apiKey: process.env.HARCHOS_API_KEY!,
});

// List workloads
const { items } = await client.workloads.list();

// Create a workload with sovereign defaults
const workload = await client.workloads.create({
  name: "my-llm-service",
  type: "inference",
  model: "llama-3.1-70b",
  resources: {
    gpuUnits: 2,
    gpuType: "A100",
    cpuCores: 16,
    memoryGb: 64,
    storageGb: 500,
  },
  replicas: 2,
});
```

## Configuration

### Sovereign Defaults

All configurations default to Morocco with strict sovereignty:

```typescript
const client = new HarchOSClient({
  apiKey: "your-key",
  // These are the defaults — explicitly shown for clarity
  config: {
    sovereign: {
      region: "morocco",
      sovereignty: "strict",
      carbonAware: true,
      dataResidency: "local",
      encryptionAtRest: true,
      auditLogging: true,
    },
  },
});
```

### Named Profiles

```typescript
import { registerProfile, HarchOSClient } from "@harchos/sdk";

registerProfile("staging", {
  baseUrl: "https://staging.api.harchos.com",
  sovereign: { region: "nigeria", sovereignty: "moderate", dataResidency: "regional" },
});

const client = new HarchOSClient({ profile: "staging" });
```

### Environment Variables

| Variable | Description |
|---|---|
| `HARCHOS_API_KEY` | API key for authentication |
| `HARCHOS_BASE_URL` | Override API base URL |
| `HARCHOS_REGION` | Sovereign region (morocco, nigeria, etc.) |
| `HARCHOS_SOVEREIGNTY` | Sovereignty level (strict, moderate, minimal) |
| `HARCHOS_CARBON_AWARE` | Enable carbon-aware scheduling (true/false) |

## Authentication

### API Key

```typescript
import { HarchOSClient, apiKeyAuth } from "@harchos/sdk";

const client = new HarchOSClient({ apiKey: "hrk_live_abc123" });
```

### OAuth2

```typescript
import { HarchOSClient, oauth2Auth } from "@harchos/sdk";

const client = new HarchOSClient({
  auth: oauth2Auth({
    clientId: "your-client-id",
    clientSecret: "your-client-secret",
    scopes: ["workloads:read", "workloads:write"],
  }),
});
```

## Streaming

```typescript
import { createStream } from "@harchos/sdk";
import type { WorkloadEvent } from "@harchos/sdk";

const stream = createStream<WorkloadEvent>("/workloads/wl-123/events", {
  autoReconnect: true,
});

stream.setAuthToken("your-token");
await stream.connect();

for await (const message of stream) {
  console.log(message.data); // WorkloadEvent
}
```

## Circuit Breaker

```typescript
const client = new HarchOSClient({
  apiKey: "key",
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeoutMs: 30_000,
  },
});

// Check circuit state
console.log(client.circuitBreaker.stats);
```

## React Hooks

```tsx
import { HarchOSClient } from "@harchos/sdk";
import { useWorkloads, useCarbonIntensity } from "@harchos/sdk/react";

const client = new HarchOSClient({ apiKey: "key" });

function WorkloadsPage() {
  const { workloads, loading, error, fetchMore, hasMore } = useWorkloads(client);
  const { data: carbon } = useCarbonIntensity(client);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Carbon intensity: {carbon?.gco2ePerKwh} gCO2e/kWh</p>
      {workloads.map((w) => (
        <div key={w.id}>{w.name} — {w.state}</div>
      ))}
      {hasMore && <button onClick={fetchMore}>Load more</button>}
    </div>
  );
}
```

## Available Regions

| Region | Identifier | Country |
|---|---|---|
| Morocco | `morocco` | Morocco |
| Algeria | `algeria` | Algeria |
| Tunisia | `tunisia` | Tunisia |
| Egypt | `egypt` | Egypt |
| Nigeria | `nigeria` | Nigeria |
| Kenya | `kenya` | Kenya |
| South Africa | `south-africa` | South Africa |
| Senegal | `senegal` | Senegal |
| Ghana | `ghana` | Ghana |
| Ethiopia | `ethiopia` | Ethiopia |

## Error Handling

All errors extend `HarchOSError` with a discriminated `code` field:

```typescript
import { isHarchOSError, isErrorCode, RateLimitError } from "@harchos/sdk";

try {
  await client.workloads.create({ ... });
} catch (error) {
  if (isErrorCode(error, "RATE_LIMITED")) {
    console.log(`Retry after ${error.retryAfterMs}ms`);
  }
  if (isErrorCode(error, "SOVEREIGNTY_REGION_MISMATCH")) {
    console.log("Sovereignty violation detected!");
  }
}
```

## API Reference

### Resources

| Resource | Methods |
|---|---|
| `client.workloads` | list, get, create, update, delete, start, stop, scale, metrics, events, logs |
| `client.models` | list, get, variants, variant, search |
| `client.hubs` | list, get, metrics, testConnectivity, nearest, recommended |
| `client.energy` | carbonIntensity, consumption, getResourceConsumption, budgets, getBudget, createBudget, greenWindows |

## License

MIT © [HarchCorp](https://github.com/HarchCorp)
