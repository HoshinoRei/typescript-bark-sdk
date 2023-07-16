# Typescript Bark SDK

## Introduction

A SDK for Bark written in TypeScript.

### Features

- Using Bark V2 API
- Encrypted push (developing)

### Getting started

#### Install

##### pnpm

```shell
pnpm add bark-sdk
```

##### Yarn

```shell
yarn add bark-sdk
```

##### npm

```shell
npm i bark-sdk
```

#### Push a simple message

```ts
import BarkClient from "bark-sdk"
import BarkMessageBuilder from "./BarkMessageBuilder";

const barkClient = new BarkClient("<your_bark_server_url>");

await barkClient.push(
  new BarkMessageBuilder()
    .body("<your_body>")
    .deviceKey("<your_device_key>")
    .title("<your_title>")
    .build()
)
```

For More usage, please read [wiki](https://github.com/HoshinoRei/typescript-bark-sdk/wiki)

## License

[MIT](LICENSE)