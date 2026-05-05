# Contributing to HarchOS SDK

Thank you for your interest in contributing to the HarchOS SDK! This document provides guidelines for contributing.

## Getting Started

### Prerequisites

- Node.js 18+ (we recommend 22)
- pnpm 9+

### Setup

```bash
git clone https://github.com/HarchCorp/harchos-sdk-js.git
cd harchos-sdk-js
pnpm install
```

### Development

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type check
pnpm lint

# Build
pnpm build
```

## Code Style

- **TypeScript strict mode** — no `any`, use proper types
- **Branded types** — use the `Brand<T, B>` utility for domain identifiers
- **Discriminated unions** — use `code` fields for error and response types
- **No runtime dependencies** — keep the SDK zero-dep
- **ESM-first** — use `.js` extensions in imports for compatibility

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New features
- `fix:` — Bug fixes
- `docs:` — Documentation changes
- `test:` — Test additions/changes
- `ci:` — CI/CD changes
- `refactor:` — Code refactoring
- `chore:` — Maintenance tasks

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`pnpm test`)
5. Ensure type checking passes (`pnpm lint`)
6. Commit with conventional commit messages
7. Push and open a pull request

## Sovereignty Guidelines

All contributions must respect HarchOS sovereignty principles:

- Default region is `morocco`
- Default sovereignty level is `strict`
- All data must support local residency
- Carbon-aware defaults should be enabled by default
- Never log or expose sensitive data

## Reporting Issues

- Use [GitHub Issues](https://github.com/HarchCorp/harchos-sdk-js/issues)
- Include SDK version, Node.js version, and OS
- Provide a minimal reproduction case

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
