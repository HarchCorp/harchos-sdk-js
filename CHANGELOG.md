# Changelog

All notable changes to the HarchOS SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2025-03-04

### Added

- Initial release of `@harchos/sdk`
- `HarchOSClient` with full HTTP pipeline (auth, retry, circuit breaker, sovereignty)
- Authentication: API key and OAuth2 client-credentials flows
- Configuration management with named profiles and environment variable overrides
- Sovereign defaults: region=`morocco`, sovereignty=`strict`, carbonAware=`true`
- Branded types for `SovereigntyLevel`, `SovereignRegion`, `DataClassification`
- `SovereignConfig` branded type with compile-time policy enforcement
- Circuit breaker pattern (Closed → Open → Half-Open)
- Retry logic with exponential backoff and jitter strategies
- WebSocket streaming with async iterables and automatic reconnection
- Resource modules: workloads, models, hubs, energy
- React hooks companion: `useWorkloads`, `useModels`, `useHubs`, `useCarbonIntensity`, `useEnergyConsumption`
- Full TypeScript type definitions with discriminated unions
- Error hierarchy with `HarchOSError` base and typed subclasses
- GitHub Actions CI/CD workflows
- Zero runtime dependencies
