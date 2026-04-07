/// <reference lib="deno.ns" />

import { assertEquals, assertRejects } from "@std/assert";

import BarkClient from "../../src/lib/BarkClient.ts";
import BarkMessageBuilder from "../../src/lib/BarkMessageBuilder.ts";
import BarkClientUrl from "../../src/model/enumeration/BarkClientUrl.ts";
import BarkEncryptedPushAlgorithm from "../../src/model/enumeration/BarkEncryptedPushAlgorithm.ts";
import BarkEncryptionErrorType from "../../src/model/enumeration/BarkEncryptionErrorType.ts";
import BarkMessageLevel from "../../src/model/enumeration/BarkMessageLevel.ts";
import BarkMessageSound from "../../src/model/enumeration/BarkMessageSound.ts";
import BarkResponseErrorType from "../../src/model/enumeration/BarkResponseErrorType.ts";
import BarkEncryptionError from "../../src/model/error/BarkEncryptionError.ts";
import BarkResponseError from "../../src/model/error/BarkResponseError.ts";
import type BarkMessage from "../../src/model/request/BarkMessage.ts";

function withMockFetch(
  handler: (
    input: string | URL | Request,
    init?: RequestInit,
  ) => Promise<Response> | Response,
): () => void {
  const originalFetch = globalThis.fetch;
  globalThis.fetch =
    ((input: string | URL | Request, init?: RequestInit) =>
      Promise.resolve(handler(input, init))) as typeof fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

const client = new BarkClient();

Deno.test("Health: Server is healthy", async () => {
  const restore = withMockFetch(() => new Response("ok", { status: 200 }));

  try {
    await client.health();
  } finally {
    restore();
  }
});

Deno.test("Health: Server is unhealthy", async () => {
  const restore = withMockFetch(() => {
    throw new TypeError("network error");
  });

  try {
    const error = await assertRejects(() => client.health(), BarkResponseError);
    assertEquals(error.type, BarkResponseErrorType.SERVER_HAS_NOT_RESPONSE);
    assertEquals(error.message, "Server has not response");
  } finally {
    restore();
  }
});

Deno.test("Info: Server respond info", async () => {
  const restore = withMockFetch(
    () =>
      new Response(
        JSON.stringify({
          arch: "linux/arm64",
          build: "2023-04-10 08:13:23",
          commit: "dc8de8416c9c2c6c8cd6b95a85ff09c5653dfd11",
          devices: 1,
          version: "v2.1.5",
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      ),
  );

  try {
    const result = await client.info();
    assertEquals(result, {
      arch: "linux/arm64",
      build: new Date(Date.parse("2023-04-10 08:13:23")),
      commit: "dc8de8416c9c2c6c8cd6b95a85ff09c5653dfd11",
      devices: 1,
      version: "v2.1.5",
    });
  } finally {
    restore();
  }
});

Deno.test("Info: Server don't respond info", async () => {
  const restore = withMockFetch(() => {
    throw new TypeError("network error");
  });

  try {
    const error = await assertRejects(() => client.info(), BarkResponseError);
    assertEquals(error.type, BarkResponseErrorType.SERVER_HAS_NOT_RESPONSE);
    assertEquals(error.message, "Server has not response");
  } finally {
    restore();
  }
});

Deno.test("Ping: Server is running", async () => {
  const restore = withMockFetch(
    () =>
      new Response(
        JSON.stringify({
          code: 200,
          message: "pong",
          timestamp: Date.parse(new Date().toString()),
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      ),
  );

  try {
    await client.ping();
  } finally {
    restore();
  }
});

Deno.test("Ping: Server is not running", async () => {
  const restore = withMockFetch(() => {
    throw new TypeError("network error");
  });

  try {
    const error = await assertRejects(() => client.ping(), BarkResponseError);
    assertEquals(error.type, BarkResponseErrorType.SERVER_HAS_NOT_RESPONSE);
    assertEquals(error.message, "Server has not response");
  } finally {
    restore();
  }
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

const pushMessages: BarkMessage[] = [
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
];

for (const [index, message] of pushMessages.entries()) {
  Deno.test(`Push #${index} normal: Device key is empty`, async () => {
    const barkMessage = structuredClone(message);
    delete barkMessage.device_key;

    const restore = withMockFetch((_input, init) => {
      if (
        !(init?.body && JSON.parse(String(init.body)).device_key === undefined)
      ) {
        throw new Error("unexpected request body");
      }

      return new Response(
        JSON.stringify({
          code: 400,
          message: "device key is empty",
          timestamp: 0,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 400,
        },
      );
    });

    try {
      const error = await assertRejects(
        () => client.push(barkMessage),
        BarkResponseError,
      );
      assertEquals(error.type, BarkResponseErrorType.DEVICE_KEY_IS_EMPTY);
      assertEquals(error.message, "Device key is empty");
    } finally {
      restore();
    }
  });

  Deno.test(`Push #${index} normal: Device key is not registered`, async () => {
    const barkMessage = structuredClone(message);
    barkMessage.device_key = "I am not a device key";

    const restore = withMockFetch(() =>
      new Response(
        JSON.stringify({
          code: 400,
          message:
            "failed to get device token: failed to get [] devices token from database",
          timestamp: 0,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 400,
        },
      )
    );

    try {
      const error = await assertRejects(
        () => client.push(barkMessage),
        BarkResponseError,
      );
      assertEquals(
        error.type,
        BarkResponseErrorType.FAILED_TO_GET_DEVICE_TOKEN,
      );
      assertEquals(
        error.message,
        "Failed to get device token: failed to get [] devices token from database",
      );
    } finally {
      restore();
    }
  });

  Deno.test(`Push #${index} normal: Request bind failed`, async () => {
    const barkMessage = structuredClone(message);

    const restore = withMockFetch(() =>
      new Response(
        JSON.stringify({
          code: 400,
          message:
            "request bind failed: invalid character '\\\"' after object key:value pair",
          timestamp: 0,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 400,
        },
      )
    );

    try {
      const error = await assertRejects(
        () => client.push(barkMessage),
        BarkResponseError,
      );
      assertEquals(error.type, BarkResponseErrorType.REQUEST_BIND_FAILED);
      assertEquals(
        error.message,
        "Request bind failed: invalid character '\\\"' after object key:value pair",
      );
    } finally {
      restore();
    }
  });

  Deno.test(`Push #${index} normal: Push failed`, async () => {
    const barkMessage = structuredClone(message);

    const restore = withMockFetch(() =>
      new Response(
        JSON.stringify({
          code: 500,
          message: "push failed: ",
          timestamp: 0,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 500,
        },
      )
    );

    try {
      const error = await assertRejects(
        () => client.push(barkMessage),
        BarkResponseError,
      );
      assertEquals(error.type, BarkResponseErrorType.PUSH_FAILED);
      assertEquals(error.message, "Push failed: ");
    } finally {
      restore();
    }
  });

  Deno.test(`Push #${index} normal: Succeed`, async () => {
    const barkMessage = structuredClone(message);

    const restore = withMockFetch((input) => {
      assertEquals(String(input), `https://api.day.app${BarkClientUrl.PUSH}`);
      return new Response(
        JSON.stringify({
          code: 200,
          message: "success",
          timestamp: 0,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      );
    });

    try {
      await client.push(barkMessage);
    } finally {
      restore();
    }
  });

  Deno.test(`Push #${index} encrypted: The length of iv is not 16`, async () => {
    const barkMessage = structuredClone(message);
    delete barkMessage.device_key;

    const error = await assertRejects(
      () =>
        client.pushEncrypted(
          barkMessageCommonProperty.device_Key,
          barkMessage,
          BarkEncryptedPushAlgorithm.AES_128_CBC,
          "1234567890123456",
          "1",
        ),
      BarkEncryptionError,
    );

    assertEquals(error.type, BarkEncryptionErrorType.IV_IS_NOT_CORRECT);
    assertEquals(error.message, "The length of iv is not 16");
  });

  for (
    const { algorithm, length } of [
      { algorithm: BarkEncryptedPushAlgorithm.AES_128_CBC, length: 16 },
      { algorithm: BarkEncryptedPushAlgorithm.AES_128_ECB, length: 16 },
      { algorithm: BarkEncryptedPushAlgorithm.AES_192_CBC, length: 24 },
      { algorithm: BarkEncryptedPushAlgorithm.AES_192_ECB, length: 24 },
      { algorithm: BarkEncryptedPushAlgorithm.AES_256_CBC, length: 32 },
      { algorithm: BarkEncryptedPushAlgorithm.AES_256_ECB, length: 32 },
    ]
  ) {
    Deno.test(
      `Push #${index} encrypted: key length is not ${length} when algorithm is ${algorithm}`,
      async () => {
        const barkMessage = structuredClone(message);
        delete barkMessage.device_key;

        const error = await assertRejects(
          () =>
            client.pushEncrypted(
              barkMessageCommonProperty.device_Key,
              barkMessage,
              algorithm,
              "1",
              "1234567890123456",
            ),
          BarkEncryptionError,
        );

        assertEquals(error.type, BarkEncryptionErrorType.KEY_IS_NOT_CORRECT);
        assertEquals(error.message, `The length of key is not ${length}`);
      },
    );
  }
}
