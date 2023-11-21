import { afterEach, describe, expect, test } from "@jest/globals";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import crypto from "crypto";

import BarkClient from "../../src/lib/BarkClient";
import BarkMessageBuilder from "../../src/lib/BarkMessageBuilder";
import BarkClientUrl from "../../src/model/enumeration/BarkClientUrl";
import BarkEncryptedPushAlgorithm from "../../src/model/enumeration/BarkEncryptedPushAlgorithm";
import BarkEncryptionErrorType from "../../src/model/enumeration/BarkEncryptionErrorType";
import BarkMessageLevel from "../../src/model/enumeration/BarkMessageLevel";
import BarkMessageSound from "../../src/model/enumeration/BarkMessageSound";
import BarkEncryptionError from "../../src/model/error/BarkEncryptionError";
import type BarkMessage from "../../src/model/request/BarkMessage";

const client = new BarkClient();

const mockAxios = new MockAdapter(axios);

afterEach(() => {
  mockAxios.reset();
});

describe("Health", () => {
  test("Server is healthy", async () => {
    mockAxios.onGet(BarkClientUrl.HEALTHZ).reply(200, "ok");

    await expect(client.health()).resolves.not.toThrowError();
  });

  test("Server is unhealthy", async () => {
    mockAxios.onGet(BarkClientUrl.HEALTHZ).timeout();

    await expect(client.health()).rejects.toThrowErrorMatchingSnapshot();
  });
});

describe("Info", () => {
  test("Server respond info", async () => {
    mockAxios.onGet(BarkClientUrl.INFO).reply(200, {
      arch: "linux/arm64",
      build: "2023-04-10 08:13:23",
      commit: "dc8de8416c9c2c6c8cd6b95a85ff09c5653dfd11",
      devices: 1,
      version: "v2.1.5",
    });

    await expect(client.info()).resolves.toEqual({
      arch: "linux/arm64",
      build: new Date(Date.parse("2023-04-10 08:13:23")),
      commit: "dc8de8416c9c2c6c8cd6b95a85ff09c5653dfd11",
      devices: 1,
      version: "v2.1.5",
    });
  });

  test("Server don't respond info", async () => {
    mockAxios.onGet(BarkClientUrl.INFO).timeout();

    await expect(client.info()).rejects.toThrowErrorMatchingSnapshot();
  });
});

describe("Ping", () => {
  test("Server is running", async () => {
    mockAxios.onGet(BarkClientUrl.PING).reply(200, {
      code: 200,
      message: "pong",
      timestamp: Date.parse(new Date().toString()),
    });

    await expect(client.ping()).resolves.not.toThrowError();
  });

  test("Server is not running", async () => {
    mockAxios.onGet(BarkClientUrl.PING).timeout();

    await expect(client.info()).rejects.toThrowErrorMatchingSnapshot();
  });
});

const barkMessageCommonProperty = {
  badge: 1,
  body: "Test body",
  category: "Test category",
  copy: "Test copy",
  device_Key: "Device Key",
  group: "Bark SDK Unit Test",
  level: BarkMessageLevel.ACTIVE,
  sound: BarkMessageSound.ALARM,
  title: "Test title",
};

describe.each([
  {
    badge: barkMessageCommonProperty.badge,
    body: barkMessageCommonProperty.body,
    category: barkMessageCommonProperty.category,
    copy: barkMessageCommonProperty.copy,
    device_key: barkMessageCommonProperty.device_Key,
    isArchive: "1",
    group: barkMessageCommonProperty.group,
    level: barkMessageCommonProperty.level,
    sound: barkMessageCommonProperty.sound,
    title: barkMessageCommonProperty.title,
  },
  new BarkMessageBuilder()
    .archive()
    .badge(barkMessageCommonProperty.badge)
    .body(barkMessageCommonProperty.body)
    .category(barkMessageCommonProperty.category)
    .copy(barkMessageCommonProperty.copy)
    .deviceKey(barkMessageCommonProperty.device_Key)
    .group(barkMessageCommonProperty.group)
    .level(barkMessageCommonProperty.level)
    .sound(barkMessageCommonProperty.sound)
    .title(barkMessageCommonProperty.title)
    .build(),
])("Push $#", (barkMessage: BarkMessage) => {
  describe("Normal Push", () => {
    test("Device key is empty", async () => {
      delete barkMessage.device_key;

      mockAxios.onPost(BarkClientUrl.PUSH, barkMessage).reply(400, {
        code: 400,
        message: "device key is empty",
        timestamp: 0,
      });

      await expect(
        client.push(barkMessage),
      ).rejects.toThrowErrorMatchingSnapshot();
    });

    test("Device key is not registered", async () => {
      barkMessage.device_key = "I am not a device key";

      mockAxios.onPost(BarkClientUrl.PUSH, barkMessage).reply(400, {
        code: 400,
        message:
          "failed to get device token: failed to get [] devices token from database",
        timestamp: 0,
      });

      await expect(
        client.push(barkMessage),
      ).rejects.toThrowErrorMatchingSnapshot();
    });

    test("Request bind failed", async () => {
      mockAxios.onPost(BarkClientUrl.PUSH, barkMessage).reply(400, {
        code: 400,
        message: `request bind failed: invalid character '\\"' after object key:value pair`,
        timestamp: 0,
      });

      await expect(
        client.push(barkMessage),
      ).rejects.toThrowErrorMatchingSnapshot();
    });

    test("Push failed", async () => {
      mockAxios.onPost(BarkClientUrl.PUSH, barkMessage).reply(500, {
        code: 500,
        message: "push failed: ",
        timestamp: 0,
      });

      await expect(
        client.push(barkMessage),
      ).rejects.toThrowErrorMatchingSnapshot();
    });

    test("Succeed", async () => {
      mockAxios.onPost(BarkClientUrl.PUSH, barkMessage).reply(200, {
        code: 200,
        message: "success",
        timestamp: 0,
      });

      await expect(client.push(barkMessage)).resolves.not.toThrow();
    });
  });

  describe("Encrypted push", () => {
    delete barkMessage.device_key;

    const algorithm = BarkEncryptedPushAlgorithm.AES_128_CBC;
    const key = crypto.randomBytes(8).toString("hex");
    const iv = crypto.randomBytes(8).toString("hex");

    test.each([
      {
        algorithm: BarkEncryptedPushAlgorithm.AES_128_CBC,
        length: 16,
      },
      {
        algorithm: BarkEncryptedPushAlgorithm.AES_128_ECB,
        length: 16,
      },
      {
        algorithm: BarkEncryptedPushAlgorithm.AES_192_CBC,
        length: 24,
      },
      {
        algorithm: BarkEncryptedPushAlgorithm.AES_192_ECB,
        length: 24,
      },
      {
        algorithm: BarkEncryptedPushAlgorithm.AES_256_CBC,
        length: 32,
      },
      {
        algorithm: BarkEncryptedPushAlgorithm.AES_256_ECB,
        length: 32,
      },
    ])(
      "The length of key is not $length when algorithm is $algorithm",
      async ({ algorithm, length }) => {
        await expect(
          client.pushEncrypted(
            barkMessageCommonProperty.device_Key,
            barkMessage,
            algorithm,
            crypto.randomBytes(1).toString("hex"),
            iv,
          ),
        ).rejects.toThrowError(
          new BarkEncryptionError(
            BarkEncryptionErrorType.KEY_IS_NOT_CORRECT,
            `The length of key is not ${length}`,
          ),
        );
      },
    );

    test("The length of iv is not 16", async () => {
      await expect(
        client.pushEncrypted(
          barkMessageCommonProperty.device_Key,
          barkMessage,
          algorithm,
          key,
          crypto.randomBytes(1).toString("hex"),
        ),
      ).rejects.toThrowError(
        new BarkEncryptionError(
          BarkEncryptionErrorType.IV_IS_NOT_CORRECT,
          "The length of iv is not 16",
        ),
      );
    });
  });
});
