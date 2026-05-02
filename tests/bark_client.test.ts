import { test } from "@cross/test";
import { assertEquals, assertRejects } from "@std/assert";

import BarkClient from "../bark_client.ts";
import BarkMessageBuilder from "../bark_message_builder.ts";
import BarkEncryptedPushAlgorithm from "../enums/bark_encrypted_push_algorithm.ts";
import BarkEncryptionErrorType from "../enums/bark_encryption_error_type.ts";
import BarkMessageLevel from "../enums/bark_message_level.ts";
import BarkMessageSound from "../enums/bark_message_sound.ts";
import BarkResponseErrorType from "../enums/bark_response_error_type.ts";
import BarkEncryptionError from "../errors/bark_encryption_error.ts";
import BarkResponseError from "../errors/bark_response_error.ts";
import BarkClientUrl from "../internal/bark_client_url.ts";
import type BarkMessage from "../types/bark_message.ts";
import {
  withGlobalProperty,
  withMockFetch,
  withMockRegexExecSecondCallNull,
} from "./test_helpers.ts";

const client = new BarkClient();

test("Health: Server is healthy", async () => {
  const restore = withMockFetch(() => new Response("ok", { status: 200 }));

  try {
    await client.health();
  } finally {
    restore();
  }
});

test("Health: Server is unhealthy", async () => {
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

test("Info: Server respond info", async () => {
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

test("Info: Server don't respond info", async () => {
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

test("Info: Server respond info without build", async () => {
  const restore = withMockFetch(
    () =>
      new Response(
        JSON.stringify({
          arch: "linux/arm64",
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
      build: undefined,
      commit: "dc8de8416c9c2c6c8cd6b95a85ff09c5653dfd11",
      devices: 1,
      version: "v2.1.5",
    });
  } finally {
    restore();
  }
});

test("Ping: Server is running", async () => {
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

test("Ping: Server is not running", async () => {
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
  test(`Push #${index} normal: Device key is empty`, async () => {
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

  test(`Push #${index} normal: Device key is not registered`, async () => {
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

  test(`Push #${index} normal: Request bind failed`, async () => {
    const barkMessage = structuredClone(message);

    const restore = withMockFetch(() =>
      new Response(
        JSON.stringify({
          code: 400,
          message:
            `request bind failed: invalid character '\"' after object key:value pair`,
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
        `Request bind failed: invalid character '\"' after object key:value pair`,
      );
    } finally {
      restore();
    }
  });

  test(`Push #${index} normal: Push failed`, async () => {
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

  test(`Push #${index} normal: Succeed`, async () => {
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

  test(`Push #${index} encrypted: The length of iv is not 16`, async () => {
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
    test(
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

test("Health: Fetch API is unavailable", async () => {
  const restore = withGlobalProperty("fetch", undefined);

  try {
    const error = await assertRejects(() => client.health(), BarkResponseError);
    assertEquals(error.type, BarkResponseErrorType.UNKNOWN_ERROR);
    assertEquals(error.message, "Unknown error");
  } finally {
    restore();
  }
});

test("Info: Non-TypeError maps to unknown error", async () => {
  const restore = withMockFetch(() => {
    throw new Error("unexpected");
  });

  try {
    const error = await assertRejects(() => client.info(), BarkResponseError);
    assertEquals(error.type, BarkResponseErrorType.UNKNOWN_ERROR);
    assertEquals(error.message, "Unknown error");
  } finally {
    restore();
  }
});

test("Info: Error with status maps to server has not response", async () => {
  const restore = withMockFetch(() => {
    const error = new Error("http");
    (error as Error & { status: number }).status = 503;
    throw error;
  });

  try {
    const error = await assertRejects(() => client.info(), BarkResponseError);
    assertEquals(error.type, BarkResponseErrorType.SERVER_HAS_NOT_RESPONSE);
    assertEquals(error.message, "Server has not response");
  } finally {
    restore();
  }
});

test("Info: Non-Error throw maps to unknown error", async () => {
  const restore = withMockFetch(() => {
    throw "boom";
  });

  try {
    const error = await assertRejects(() => client.info(), BarkResponseError);
    assertEquals(error.type, BarkResponseErrorType.UNKNOWN_ERROR);
    assertEquals(error.message, "Unknown error");
  } finally {
    restore();
  }
});

test("Push: Non-JSON error response maps to unknown error", async () => {
  const restore = withMockFetch(() =>
    new Response("I am not JSON", {
      headers: { "Content-Type": "text/plain" },
      status: 400,
    })
  );

  try {
    const error = await assertRejects(
      () => client.push({ body: "Test" }),
      BarkResponseError,
    );
    assertEquals(error.type, BarkResponseErrorType.UNKNOWN_ERROR);
    assertEquals(error.message, "Unknown error");
  } finally {
    restore();
  }
});

test("Push: Unknown 400 message maps to unknown error", async () => {
  const restore = withMockFetch(() =>
    new Response(
      JSON.stringify({
        code: 400,
        message: "another 400 error",
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
      () => client.push({ body: "Test" }),
      BarkResponseError,
    );
    assertEquals(error.type, BarkResponseErrorType.UNKNOWN_ERROR);
    assertEquals(error.message, "Unknown error");
  } finally {
    restore();
  }
});

test("Push: Non-Error throw maps to unknown error", async () => {
  const restore = withMockFetch(() => {
    throw "boom";
  });

  try {
    const error = await assertRejects(
      () => client.push({ body: "Test" }),
      BarkResponseError,
    );
    assertEquals(error.type, BarkResponseErrorType.UNKNOWN_ERROR);
    assertEquals(error.message, "Unknown error");
  } finally {
    restore();
  }
});

test("Push: Error without status maps to unknown error", async () => {
  const restore = withMockFetch(() => {
    throw new Error("network error");
  });

  try {
    const error = await assertRejects(
      () => client.push({ body: "Test" }),
      BarkResponseError,
    );
    assertEquals(error.type, BarkResponseErrorType.UNKNOWN_ERROR);
    assertEquals(error.message, "Unknown error");
  } finally {
    restore();
  }
});

test("Push: Error with status and no data maps to unknown error", async () => {
  const restore = withMockFetch(() => {
    const error = new Error("http");
    (error as Error & { status: number }).status = 500;
    throw error;
  });

  try {
    const error = await assertRejects(
      () => client.push({ body: "Test" }),
      BarkResponseError,
    );
    assertEquals(error.type, BarkResponseErrorType.UNKNOWN_ERROR);
    assertEquals(error.message, "Unknown error");
  } finally {
    restore();
  }
});

test("Push: Device token regex exec null fallback", async () => {
  const restoreRegex = withMockRegexExecSecondCallNull(
    "failed to get device token: (.*)",
  );
  const restoreFetch = withMockFetch(() =>
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
      () => client.push({ body: "Test" }),
      BarkResponseError,
    );
    assertEquals(error.type, BarkResponseErrorType.FAILED_TO_GET_DEVICE_TOKEN);
    assertEquals(error.message, "Failed to get device token");
  } finally {
    restoreFetch();
    restoreRegex();
  }
});

test("Push: Request bind regex exec null fallback", async () => {
  const restoreRegex = withMockRegexExecSecondCallNull(
    "request bind failed: (.*)",
  );
  const restoreFetch = withMockFetch(() =>
    new Response(
      JSON.stringify({
        code: 400,
        message:
          "request bind failed: invalid character '\"' after object key:value pair",
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
      () => client.push({ body: "Test" }),
      BarkResponseError,
    );
    assertEquals(error.type, BarkResponseErrorType.REQUEST_BIND_FAILED);
    assertEquals(error.message, "Request bind failed");
  } finally {
    restoreFetch();
    restoreRegex();
  }
});

test("Push: Push failed regex exec null fallback", async () => {
  const restoreRegex = withMockRegexExecSecondCallNull("push failed: (.*)");
  const restoreFetch = withMockFetch(() =>
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
      () => client.push({ body: "Test" }),
      BarkResponseError,
    );
    assertEquals(error.type, BarkResponseErrorType.PUSH_FAILED);
    assertEquals(error.message, "Push failed");
  } finally {
    restoreFetch();
    restoreRegex();
  }
});

test("Push encrypted: Succeed with ciphertext payload", async () => {
  const restore = withMockFetch((input, init) => {
    assertEquals(String(input), "https://api.day.app/device-key");
    assertEquals(init?.method, "POST");
    assertEquals(
      (init?.headers as Record<string, string>)?.["Content-Type"],
      "application/x-www-form-urlencoded",
    );

    const body = String(init?.body ?? "");
    const params = new URLSearchParams(body);
    assertEquals(params.has("ciphertext"), true);
    assertEquals((params.get("ciphertext") ?? "").length > 0, true);

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
    await client.pushEncrypted(
      "device-key",
      {
        body: "Test encrypted",
      },
      BarkEncryptedPushAlgorithm.AES_128_CBC,
      "1234567890123456",
      "1111111111111111",
    );
  } finally {
    restore();
  }
});

test("Push encrypted: Push failed maps to push failed error", async () => {
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
      () =>
        client.pushEncrypted(
          "device-key",
          {
            body: "Test encrypted",
          },
          BarkEncryptedPushAlgorithm.AES_128_CBC,
          "1234567890123456",
          "1111111111111111",
        ),
      BarkResponseError,
    );
    assertEquals(error.type, BarkResponseErrorType.PUSH_FAILED);
    assertEquals(error.message, "Push failed: ");
  } finally {
    restore();
  }
});

test("Push encrypted: Web Crypto unavailable maps to unknown error", async () => {
  const restore = withGlobalProperty("crypto", undefined);

  try {
    const error = await assertRejects(
      () =>
        client.pushEncrypted(
          "device-key",
          { body: "Test encrypted" },
          BarkEncryptedPushAlgorithm.AES_128_CBC,
          "1234567890123456",
          "1111111111111111",
        ),
      BarkResponseError,
    );
    assertEquals(error.type, BarkResponseErrorType.UNKNOWN_ERROR);
    assertEquals(
      error.message,
      "Web Crypto API is unavailable in current runtime",
    );
  } finally {
    restore();
  }
});

test("Push encrypted: Succeed with AES-192-CBC", async () => {
  const restore = withMockFetch(() =>
    new Response(
      JSON.stringify({
        code: 200,
        message: "success",
        timestamp: 0,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    )
  );

  try {
    await client.pushEncrypted(
      "device-key",
      { body: "Test encrypted" },
      BarkEncryptedPushAlgorithm.AES_192_CBC,
      "123456789012345678901234",
      "1111111111111111",
    );
  } finally {
    restore();
  }
});

test("Push encrypted: Succeed with AES-256-CBC", async () => {
  const restore = withMockFetch(() =>
    new Response(
      JSON.stringify({
        code: 200,
        message: "success",
        timestamp: 0,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    )
  );

  try {
    await client.pushEncrypted(
      "device-key",
      { body: "Test encrypted" },
      BarkEncryptedPushAlgorithm.AES_256_CBC,
      "12345678901234567890123456789012",
      "1111111111111111",
    );
  } finally {
    restore();
  }
});

test("Health: Build URL is stable with trailing slash", async () => {
  const requestedUrls: string[] = [];
  const restore = withMockFetch((input) => {
    requestedUrls.push(String(input));
    return new Response("ok", { status: 200 });
  });

  try {
    await new BarkClient("https://example.com").health();
    await new BarkClient("https://example.com/").health();
  } finally {
    restore();
  }

  assertEquals(requestedUrls, [
    `https://example.com${BarkClientUrl.HEALTHZ}`,
    `https://example.com${BarkClientUrl.HEALTHZ}`,
  ]);
});
