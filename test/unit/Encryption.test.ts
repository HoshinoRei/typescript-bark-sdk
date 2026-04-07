/// <reference lib="deno.ns" />

import { assertEquals } from "@std/assert";

import BarkClient from "../../src/lib/BarkClient.ts";
import BarkEncryptedPushAlgorithm from "../../src/model/enumeration/BarkEncryptedPushAlgorithm.ts";
import BarkMessageSound from "../../src/model/enumeration/BarkMessageSound.ts";
import type BarkMessage from "../../src/model/request/BarkMessage.ts";

class TestableBarkClient extends BarkClient {
  encrypt(
    message: BarkMessage,
    algorithm: BarkEncryptedPushAlgorithm,
    key: string,
    iv: string,
  ): Promise<string> {
    return this.encryptPayload(
      message,
      algorithm,
      key,
      iv,
      globalThis.crypto,
    );
  }
}

Deno.test("Encryption: Encrypt message with AES-128-CBC", async () => {
  const client = new TestableBarkClient();

  const ciphertext = await client.encrypt(
    {
      body: "test",
      sound: BarkMessageSound.BIRDSONG,
    },
    BarkEncryptedPushAlgorithm.AES_128_CBC,
    "1234567890123456",
    "1111111111111111",
  );

  assertEquals(
    ciphertext,
    "PyyK7dW6sTXP2TzjVOYOC+JApqNGkWH9Sj3+tnBs2feSO0etk2Qw1A+6SfdZ5KZ1W79p3RsakkRqU9ucC4CxRA==",
  );
});
