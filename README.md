# TypeScript Bark SDK

A TypeScript SDK for [Bark](https://github.com/Finb/Bark) API v2, published on
JSR.

## Overview

- Bark API v2 support (`push`, `pushEncrypted`, `health`, `ping`, `info`)
- Typed request/response models
- Typed error model for message/encryption/response failures
- Works in Deno, Node.js (20+), and browsers

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

- [Supported algorithms](https://github.com/HoshinoRei/typescript-bark-sdk/wiki/BarkEncryptedPushAlgorithm#enumeration-members)
- [More examples and usage](https://github.com/HoshinoRei/typescript-bark-sdk/wiki/Exports)

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
- Unit tests: `deno task test`
- Prepublish gate: `deno task prepublish`

`deno task prepublish` runs formatting/lint/type-check/tests and
`deno publish --dry-run`.

## License

[MIT](LICENSE)
