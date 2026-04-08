# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Development commands

- Format all files: `deno task fmt`
- Format check only: `deno task fmt:check`
- Lint: `deno task lint`
- Type check public entry: `deno task check`
- Run tests with coverage + JUnit output: `deno task test`
- Generate lcov report: `deno task coverage`
- Publish package: `deno publish`

## High-level architecture

This package is a TypeScript SDK for Bark API v2, built as a Deno-first library.

- Public API surface is re-exported from `mod.ts`.
- Core runtime behavior is centered in `bark_client.ts`:
  - Uses instance-scoped server address (default `https://api.day.app`).
  - Wraps Bark endpoints (`/healthz`, `/info`, `/ping`, `/push`) using
    `BarkClientUrl` enum.
  - Converts transport/API failures into typed domain errors
    (`BarkResponseError`) with `BarkResponseErrorType` classification.
  - Implements encrypted push (`pushEncrypted`) by validating key/iv lengths,
    deriving mode+key size from `BarkEncryptedPushAlgorithm`, AES-encrypting the
    JSON payload, then posting ciphertext.
- Message creation is handled by `bark_message_builder.ts`:
  - Fluent builder over `BarkMessage` request shape.
  - Validates URL fields (`icon`, `url`) and throws typed `BarkMessageError`
    when invalid.
- Domain contracts live under root-level directories:
  - `types/` contains wire types.
  - `enums/` provides API constants and error/message enums.
  - `errors/` defines typed error classes used throughout the SDK.
  - `internal/` contains non-exported internal helpers and error types.

## Build and test structure

- Deno tasks are defined in `deno.json`.
- Unit tests in `tests/*_test.ts` use Deno test APIs and assert Bark behavior
  and typed error mapping.
- Coverage and JUnit outputs are generated via Deno test flags for CI
  consumption.
