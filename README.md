# Typescript Bark SDK

## Introduction

A SDK for Bark written in TypeScript.

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

For More usage, please read [wiki](https://github.com/HoshinoRei/typescript-bark-sdk/wiki).

## License

[MIT](LICENSE)
