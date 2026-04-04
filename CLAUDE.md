# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development commands

- Install dependencies: `pnpm install`
- Build library (TypeScript + Vite lib bundle + d.ts): `pnpm build`
- Run tests with coverage: `pnpm test`
- Run a single test file: `pnpm vitest run test/unit/BarkClient.test.ts`
- Run tests matching a name: `pnpm vitest run -t "Server is healthy"`
- Lint and auto-fix: `pnpm lint`
- Lint check only: `pnpm lint:check`
- Format all files: `pnpm format`
- Format check only: `pnpm format:check`
- Generate docs: `pnpm doc`

## High-level architecture

This package is a TypeScript SDK for Bark API v2, built as a library for both Node.js and browser use.

- Public API surface is re-exported from `src/index.ts`.
- Core runtime behavior is centered in `src/lib/BarkClient.ts`:
  - Sets global axios base URL in constructor (default `https://api.day.app`).
  - Wraps Bark endpoints (`/healthz`, `/info`, `/ping`, `/push`) using `BarkClientUrl` enum.
  - Converts transport/API failures into typed domain errors (`BarkResponseError`) with `BarkResponseErrorType` classification.
  - Implements encrypted push (`pushEncrypted`) by validating key/iv lengths, deriving CryptoJS mode+key size from `BarkEncryptedPushAlgorithm`, AES-encrypting the JSON payload, then posting ciphertext.
- Message creation is handled by `src/lib/BarkMessageBuilder.ts`:
  - Fluent builder over `BarkMessage` request shape.
  - Validates URL fields (`icon`, `url`) and throws typed `BarkMessageError` when invalid.
- Domain contracts live under `src/model/`:
  - `request/` and `response/` contain wire types.
  - `enumeration/` provides API constants and error/message enums.
  - `error/` defines typed error classes used throughout the SDK.

## Build and test structure

- Build pipeline (`pnpm build`) runs `tsc` then Vite library mode (`vite.config.ts`) to emit ES + UMD bundles and bundled type declarations (via `vite-plugin-dts`).
- Vitest config (`vitest.config.ts`) merges base Vite config, enables coverage reporters (`json-summary`, `json`, `text`), and writes JUnit output to `test-result/junit.xml` with `verbose` + `junit` reporters.
- Unit tests in `test/unit/*.test.ts` use `axios-mock-adapter` to simulate Bark server responses and assert both success paths and typed error mapping behavior.