# Typescript Bark SDK

## Introduction

An SDK for [Bark](https://github.com/Finb/Bark) written in TypeScript.

### Features

- Using Bark V2 API
- Encrypted push

### Getting started

#### Install

##### pnpm

```shell
pnpm add @hoshinorei/bark-sdk
```

##### Yarn

```shell
yarn add @hoshinorei/bark-sdk
```

##### npm

```shell
npm i @hoshinorei/bark-sdk
```

#### Push a simple message

```ts
import { BarkClient, BarkMessageBuilder } from "@hoshinorei/bark-sdk";

const barkClient = new BarkClient("<your_bark_server_url>");

barkClient.push(
  new BarkMessageBuilder()
    .body("<your_body>")
    .deviceKey("<your_device_key>")
    .title("<your_title>")
    .build(),
);
```

#### Push an encrypted message

```ts
import {
  BarkClient,
  BarkEncryptedPushAlgorithm,
  BarkMessageBuilder,
} from "@hoshinorei/bark-sdk";

const barkClient = new BarkClient("<your_bark_server_url>");

barkClient.pushEncrypted(
  "<your_device_key>",
  new BarkMessageBuilder()
    .body("<your_body>")
    .title("<your_title>")
    .build(),
  BarkEncryptedPushAlgorithm.AES_128_CBC, // You can view the supported algorithms via the link below
  "<your_key>",
  "<your_iv>",
);
```

[Supported algorithm](https://github.com/HoshinoRei/typescript-bark-sdk/wiki/BarkEncryptedPushAlgorithm#enumeration-members)

For More usage, please read [wiki](https://github.com/HoshinoRei/typescript-bark-sdk/wiki).

## License

[MIT](LICENSE)
