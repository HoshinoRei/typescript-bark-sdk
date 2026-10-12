# TypeScript Bark SDK

A Bun-first TypeScript SDK for the [Bark](https://github.com/Finb/Bark) API v2,
published to npm.

## Overview

- Bun-native test and development workflow
- Bark API v2 support (`push`, `pushEncrypted`, `health`, `ping`, `info`)
- Typed request/response models
- Typed error model for message/encryption/response failures

## Installation

```shell
bun add @hoshinorei/bark-sdk
```

## Getting Started

```ts
import { BarkClient, BarkMessageBuilder } from "@hoshinorei/bark-sdk"

const client = new BarkClient("https://api.day.app")

await client.push(
  new BarkMessageBuilder()
    .body("hello")
    .deviceKey("<your_device_key>")
    .title("Bark")
    .build(),
)
```

## Encrypted Push

```ts
import {
  BarkClient,
  BarkEncryptedPushAlgorithm,
  BarkMessageBuilder,
} from "@hoshinorei/bark-sdk"

const client = new BarkClient("https://api.day.app")

await client.pushEncrypted(
  "<your_device_key>",
  new BarkMessageBuilder().body("<your_body>").title("<your_title>").build(),
  BarkEncryptedPushAlgorithm.AES_128_CBC,
  "<your_key>",
  "<your_iv>",
)
```

> `key`/`iv` must match the selected algorithm requirements.

- [Supported algorithms](./enums/bark_encrypted_push_algorithm.ts)

## Public API

### Core

- `BarkClient`
- `BarkMessageBuilder`

### Enums

- `BarkEncryptedPushAlgorithm`
- `BarkMessageLevel`
- `BarkMessageSound`
- `BarkEncryptionErrorType`
- `BarkMessageErrorType`
- `BarkResponseErrorType`

### Errors

- `BarkEncryptionError`
- `BarkMessageError`
- `BarkResponseError`

### Types

- `BarkMessage`
- `BarkInfoResponse`
- `BarkResponse`

## Development

- Install dependencies: `bun install`
- Format all files: `bun run fmt`
- Format check only: `bun run fmt:check`
- Fix lint issues: `bun run lint`
- Lint check only: `bun run lint:check`
- Type check public entry and tests: `bun run check`
- Unit tests with coverage and JUnit output: `bun run test`
- Run all validation gates: `bun run validate`
- Preview the npm package: `bun run pack`

The project uses Prettier for formatting and ESLint for static analysis. The
test suite uses Bun's built-in `bun:test` runner and is supported on Bun 1.4 or
newer. The release workflow publishes the package to npm.

## License

[MIT](LICENSE)
