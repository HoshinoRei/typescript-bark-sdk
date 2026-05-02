# TypeScript Bark SDK

A TypeScript SDK for [Bark](https://github.com/Finb/Bark) API v2, published on
JSR.

## Overview

- Bark API v2 support (`push`, `pushEncrypted`, `health`, `ping`, `info`)
- Typed request/response models
- Typed error model for message/encryption/response failures
- Works in Deno, Node.js (latest LTS), and browsers

## Getting Started

```ts
import { BarkClient, BarkMessageBuilder } from "jsr:@hoshinorei/bark-sdk";

const client = new BarkClient("https://api.day.app");

await client.push(
  new BarkMessageBuilder()
    .body("hello")
    .deviceKey("<your_device_key>")
    .title("Bark")
    .build(),
);
```

## Encrypted Push

```ts
import {
  BarkClient,
  BarkEncryptedPushAlgorithm,
  BarkMessageBuilder,
} from "jsr:@hoshinorei/bark-sdk";

const client = new BarkClient("https://api.day.app");

await client.pushEncrypted(
  "<your_device_key>",
  new BarkMessageBuilder().body("<your_body>").title("<your_title>").build(),
  BarkEncryptedPushAlgorithm.AES_128_CBC,
  "<your_key>",
  "<your_iv>",
);
```

> `key`/`iv` must match the selected algorithm requirements.

- [Supported algorithms](https://jsr.io/@hoshinorei/bark-sdk/doc/~/BarkEncryptedPushAlgorithm#members)

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

- Format: `deno task fmt`
- Format check: `deno task fmt:check`
- Lint: `deno task lint`
- Type check: `deno task check`
- Unit tests (Deno, coverage + JUnit): `deno task test`
- Unit tests (Node latest LTS): `npm run test:node`
- Unit tests (Bun): `bun run test:bun`
- Prepublish gate: `deno task prepublish`

The test suite is written with `@cross/test` and is expected to pass in Deno,
Node latest LTS, and Bun.

`deno task prepublish` runs formatting/lint/type-check/tests and
`deno publish --dry-run`.

## License

[MIT](LICENSE)
