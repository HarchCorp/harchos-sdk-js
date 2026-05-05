# @harchos/sdk

[![npm version](https://img.shields.io/npm/v/@harchos/sdk.svg)](https://www.npmjs.com/package/@harchos/sdk)
[![PyPI version](https://img.shields.io/pypi/v/harchos.svg)](https://pypi.org/project/harchos/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The Official TypeScript/JavaScript SDK for HarchOS** — Carbon-Aware GPU Orchestration Platform

HarchOS is the Operating System for Sovereign AI Infrastructure. This SDK provides typed access to the HarchOS API with **sovereign defaults**: `region="morocco"`, `sovereignty="strict"`, `carbon_aware=true`.

## Install

```bash
npm install @harchos/sdk
# or
yarn add @harchos/sdk
# or
pnpm add @harchos/sdk
```

## Quick Start

```typescript
import { HarchOSClient } from "@harchos/sdk";

const client = new HarchOSClient({ apiKey: "hsk_..." });

// Carbon-aware scheduling — HarchOS's key differentiator
const carbon = await client.carbon.getIntensity("MA");
console.log(`Morocco: ${carbon.carbon_intensity_gco2_kwh} gCO2/kWh`);
console.log(`Renewable: ${carbon.renewable_percentage}%`);

// Find the greenest hub for your workload
const optimal = await client.carbon.optimalHub({
  region: "morocco",
  gpu_count: 4,
  gpu_type: "a100",
});
console.log(`Best hub: ${optimal.recommended_hub_name}`);
console.log(`Action: ${optimal.action}`);

// Optimize workload scheduling
const result = await client.carbon.optimize({
  workload_name: "training-job",
  gpu_count: 4,
  gpu_type: "a100",
  carbon_aware: true,
  carbon_max_gco2: 100,
});
console.log(`Action: ${result.action}, CO2 saved: ${result.carbon_saved_kg} kg`);

// List all hubs
const hubs = await client.hubs.list();
console.log(`${hubs.total} hubs, ${hubs.items.length} visible`);

// Create a carbon-aware workload
const workload = await client.workloads.create({
  name: "llama-training",
  workload_type: "training",
  compute: { gpu_count: 8, gpu_type: "a100" },
  carbon_aware: true,
});
```

## Configuration

### Environment Variables

```bash
export HARCHOS_API_KEY="hsk_..."
export HARCHOS_BASE_URL="https://harchos-api-production.up.railway.app/v1"
export HARCHOS_REGION="morocco"
export HARCHOS_SOVEREIGNTY="strict"
export HARCHOS_TIMEOUT="30"
export HARCHOS_MAX_RETRIES="3"
```

Then create a client with no arguments:

```typescript
const client = HarchOSClient.fromEnv();
```

### Programmatic Configuration

```typescript
const client = new HarchOSClient({
  apiKey: "hsk_test_development_key_12345",
  baseURL: "https://harchos-api-production.up.railway.app/v1",
  region: "morocco",
  sovereignty: "strict",
  carbonAware: true,
  timeout: 30,
  maxRetries: 3,
});
```

## API Reference

### `client.carbon` — Carbon-Aware Scheduling

HarchOS is the **only** GPU orchestration platform with a native Carbon API.

| Method | Description |
|--------|-------------|
| `carbon.getIntensity(zone)` | Get real-time carbon intensity for a zone |
| `carbon.listIntensities()` | Get carbon intensity for all zones |
| `carbon.optimalHub(params)` | Find the greenest hub for a workload |
| `carbon.optimize(params)` | Optimize workload scheduling by carbon intensity |
| `carbon.getForecast(zone, hours?)` | Get carbon intensity forecast |
| `carbon.getMetrics(periodDays?)` | Get aggregate carbon metrics |
| `carbon.getDashboard()` | Get full carbon dashboard data |

### `client.hubs` — Sovereign Compute Hubs

| Method | Description |
|--------|-------------|
| `hubs.list(params?)` | List hubs with optional filtering |
| `hubs.get(hubId)` | Retrieve a hub by ID |
| `hubs.create(spec)` | Create a new hub |
| `hubs.update(hubId, spec)` | Update a hub |
| `hubs.capacity(hubId)` | Get hub capacity |
| `hubs.scale(hubId, targetGpuCount)` | Scale a hub |
| `hubs.drain(hubId)` | Drain a hub |
| `hubs.delete(hubId)` | Delete a hub |

### `client.workloads` — Workload Management

| Method | Description |
|--------|-------------|
| `workloads.list(params?)` | List workloads with filtering |
| `workloads.get(workloadId)` | Retrieve a workload |
| `workloads.create(spec)` | Create a new workload |
| `workloads.update(workloadId, spec)` | Update a workload |
| `workloads.cancel(workloadId)` | Cancel a running workload |
| `workloads.pause(workloadId)` | Pause a workload |
| `workloads.resume(workloadId)` | Resume a paused workload |
| `workloads.delete(workloadId)` | Delete a workload |

### Other Resources

- **`client.energy`** — Energy consumption and reporting
- **`client.models`** — Available AI models
- **`client.pricing`** — Pricing plans and cost estimation
- **`client.regions`** — Region information
- **`client.monitoring`** — Platform monitoring and health
- **`client.health()`** — API health check

## Error Handling

```typescript
import { HarchOSError, RateLimitError, NotFoundError } from "@harchos/sdk";

try {
  const hub = await client.hubs.get("non-existent-id");
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log("Hub not found");
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after: ${error.retryAfter}s`);
  } else if (error instanceof HarchOSError) {
    console.log(`HarchOS error: ${error.message} (code: ${error.code})`);
  }
}
```

## Competitor Comparison

| Feature | HarchOS | Modal | Replicate | Together |
|---------|---------|-------|-----------|----------|
| **Carbon API** | ✅ | ❌ | ❌ | ❌ |
| **Sovereignty Controls** | ✅ | ❌ | ❌ | ❌ |
| **Data Residency** | ✅ | ❌ | ❌ | ❌ |
| **Carbon-Aware Scheduling** | ✅ | ❌ | ❌ | ❌ |
| **Python SDK** | ✅ | ✅ | ✅ | ✅ |
| **TypeScript/JS SDK** | ✅ | ✅ | ❌ | ❌ |
| **CLI** | ✅ | ❌ | ❌ | ❌ |
| **African Hubs** | ✅ | ❌ | ❌ | ❌ |

## Python SDK

Also available on PyPI:

```bash
pip install harchos
```

## License

MIT © HarchCorp
