import { afterEach, describe, expect, test } from "@jest/globals";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

import BarkClient from "../../lib/BarkClient";
import BarkMessageBuilder from "../../lib/BarkMessageBuilder";
import BarkClientUrl from "../../model/enumeration/BarkClientUrl";
import BarkMessageLevel from "../../model/enumeration/BarkMessageLevel";
import BarkMessageSound from "../../model/enumeration/BarkMessageSound";
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
});
