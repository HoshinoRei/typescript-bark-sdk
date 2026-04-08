/// <reference lib="deno.ns" />

import { assertEquals, assertRejects, assertThrows } from "@std/assert";

import BarkClient from "../bark_client.ts";
import BarkEncryptedPushAlgorithm from "../enums/bark_encrypted_push_algorithm.ts";
import BarkMessageSound from "../enums/bark_message_sound.ts";
import EncryptionKeySizeError from "../internal/errors/encryption_key_size_error.ts";
import EncryptionModeError from "../internal/errors/encryption_mode_error.ts";
import type BarkMessage from "../types/bark_message.ts";

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

  pad(data: Uint8Array): Uint8Array {
    return this.padToAesBlockSize(data);
  }

  modeAndKeySize(algorithm: BarkEncryptedPushAlgorithm): {
    mode: "cbc" | "ecb";
    keySize: number;
  } {
    return this.cryptoJsModeAndKeySizeProducer(algorithm);
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

Deno.test("Encryption: Encrypt message with AES-128-ECB", async () => {
  const client = new TestableBarkClient();

  const ciphertext = await client.encrypt(
    {
      body: "test",
      sound: BarkMessageSound.BIRDSONG,
    },
    BarkEncryptedPushAlgorithm.AES_128_ECB,
    "1234567890123456",
    "1111111111111111",
  );

  assertEquals(
    ciphertext,
    "HoJPTeVBKoM8RtzYWztjEX9onEiiVgvmM8cSrMMTIGpb75SJeclntup12UhBVOgX",
  );
});

Deno.test("Encryption: PKCS#7 padding adds a full block for aligned input", () => {
  const client = new TestableBarkClient();
  const data = new TextEncoder().encode("1234567890abcdef");

  const padded = client.pad(data);

  assertEquals(padded.length, 32);
  assertEquals(Array.from(padded.slice(16)), new Array(16).fill(16));
});

Deno.test("Encryption: PKCS#7 padding fills remaining bytes", () => {
  const client = new TestableBarkClient();
  const data = new TextEncoder().encode("12345");

  const padded = client.pad(data);

  assertEquals(padded.length, 16);
  assertEquals(Array.from(padded.slice(5)), new Array(11).fill(11));
});

Deno.test("Encryption: Parse mode and key size from algorithm", () => {
  const client = new TestableBarkClient();

  assertEquals(client.modeAndKeySize(BarkEncryptedPushAlgorithm.AES_128_CBC), {
    keySize: 128,
    mode: "cbc",
  });
  assertEquals(client.modeAndKeySize(BarkEncryptedPushAlgorithm.AES_192_ECB), {
    keySize: 192,
    mode: "ecb",
  });
  assertEquals(client.modeAndKeySize(BarkEncryptedPushAlgorithm.AES_256_CBC), {
    keySize: 256,
    mode: "cbc",
  });
});

Deno.test("Encryption: Invalid key size in algorithm throws", () => {
  const client = new TestableBarkClient();

  assertThrows(
    () =>
      client.modeAndKeySize(
        "aes-512-cbc" as unknown as BarkEncryptedPushAlgorithm,
      ),
    EncryptionKeySizeError,
    "The algorithm has not a valid key size",
  );
});

Deno.test("Encryption: Invalid mode in algorithm throws", () => {
  const client = new TestableBarkClient();

  assertThrows(
    () =>
      client.modeAndKeySize(
        "aes-128-gcm" as unknown as BarkEncryptedPushAlgorithm,
      ),
    EncryptionModeError,
    "The algorithm has not a valid CryptoJS mode",
  );
});

Deno.test("Encryption: Encrypt payload key length mismatch throws", async () => {
  const client = new TestableBarkClient();

  await assertRejects(
    () =>
      client.encrypt(
        {
          body: "test",
        },
        BarkEncryptedPushAlgorithm.AES_128_CBC,
        "123",
        "1111111111111111",
      ),
    EncryptionKeySizeError,
    "The algorithm has not a valid key size",
  );
});
