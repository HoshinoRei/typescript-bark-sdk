import { afterEach, describe, expect, test } from "@jest/globals";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import crypto from "crypto";

import BarkClient from "../../lib/BarkClient";
import BarkMessageBuilder from "../../lib/BarkMessageBuilder";
import BarkClientUrl from "../../model/enumeration/BarkClientUrl";
import BarkEncryptedPushAlgorithm from "../../model/enumeration/BarkEncryptedPushAlgorithm";
import BarkEncryptionErrorType from "../../model/enumeration/BarkEncryptionErrorType";
import BarkMessageLevel from "../../model/enumeration/BarkMessageLevel";
import BarkMessageSound from "../../model/enumeration/BarkMessageSound";
import BarkEncryptionError from "../../model/error/BarkEncryptionError";
import type BarkMessage from "../../model/request/BarkMessage";

const client = new BarkClient();

const mockAxios = new MockAdapter(axios);

afterEach(() => {
  mockAxios.reset();
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
    const key = "1234567890123456";
    const iv = "1234567890123456";

    test("Push failed", async () => {
      const cipher = crypto.createCipheriv(algorithm, key, iv);

      mockAxios
        .onPost(barkMessageCommonProperty.device_Key, {
          ciphertext: `${cipher.update(
            JSON.stringify(barkMessage),
            "utf-8",
            "base64",
          )}${cipher.final("base64")}`,
        })
        .reply(500, {
          code: 500,
          message: "push failed: ",
          timestamp: 0,
        });

      await expect(
        client.pushEncrypted(
          barkMessageCommonProperty.device_Key,
          barkMessage,
          algorithm,
          key,
          iv,
        ),
      ).rejects.toThrowErrorMatchingSnapshot();
    });

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
            "1",
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
          "1",
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
