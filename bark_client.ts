import BarkClientUrl from "./internal/bark_client_url.ts";
import BarkEncryptedPushAlgorithm from "./enums/bark_encrypted_push_algorithm.ts";
import BarkEncryptionErrorType from "./enums/bark_encryption_error_type.ts";
import BarkResponseErrorType from "./enums/bark_response_error_type.ts";
import BarkEncryptionError from "./errors/bark_encryption_error.ts";
import BarkResponseError from "./errors/bark_response_error.ts";
import EncryptionKeySizeError from "./internal/errors/encryption_key_size_error.ts";
import EncryptionModeError from "./internal/errors/encryption_mode_error.ts";
import type BarkMessage from "./types/bark_message.ts";
import type BarkInfoResponse from "./types/bark_info_response.ts";
import type BarkResponse from "./types/bark_response.ts";

/**
 * A class to communicate with Bark server
 */
export default class BarkClient {
  /**
   * Base address of the target Bark server.
   */
  protected readonly serverAddress: string;

  /**
   * Create a Bark client instance.
   *
   * @param serverAddress Bark server base URL.
   */
  constructor(serverAddress: string = "https://api.day.app") {
    this.serverAddress = serverAddress;
  }

  /**
   * Check if the Bark server is healthy
   * @returns nothing if the Bark server is healthy
   * @see [Healthz](https://github.com/Finb/bark-server/blob/master/docs/API_V2.md#healthz)
   * @throws { @link BarkResponseError } if the Bark server is unhealthy
   */
  async health(): Promise<void> {
    try {
      await this.request(BarkClientUrl.HEALTHZ);
    } catch (error) {
      throw this.miscellaneousFunctionErrorProducer(error);
    }
  }

  /**
   * Get info of Bark server
   * @returns info of the Bark server
   * @see [Info](https://github.com/Finb/bark-server/blob/master/docs/API_V2.md#info)
   * @throws { BarkResponseError } if the Bark server does not respond normally
   */
  async info(): Promise<BarkInfoResponse> {
    try {
      const data = await this.requestJson<{
        arch?: string;
        build?: string;
        commit?: string;
        devices?: number;
        version?: string;
      }>(BarkClientUrl.INFO);

      return {
        arch: data.arch,
        build: data.build !== undefined
          ? new Date(Date.parse(data.build))
          : undefined,
        commit: data.commit,
        devices: data.devices,
        version: data.version,
      };
    } catch (error) {
      throw this.miscellaneousFunctionErrorProducer(error);
    }
  }

  /**
   * Check if the Bark server is running
   * @returns nothing if the Bark server is running
   * @see [Ping](https://github.com/Finb/bark-server/blob/master/docs/API_V2.md#ping)
   * @throws { BarkResponseError } if the Bark server is not running
   */
  async ping(): Promise<void> {
    try {
      await this.requestJson<BarkResponse>(BarkClientUrl.PING);
    } catch (e) {
      throw this.miscellaneousFunctionErrorProducer(e);
    }
  }

  /**
   * Push a message to Bark APP
   * @param message bark message
   * @returns nothing if message is sent successfully
   * @see [API V2](https://github.com/Finb/bark-server/blob/master/docs/API_V2.md#api-v2)
   * @throws { BarkResponseError } if message is sent unsuccessfully
   */
  async push(message: BarkMessage): Promise<void> {
    try {
      await this.requestJson<BarkResponse>(BarkClientUrl.PUSH, {
        body: JSON.stringify(message),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
    } catch (e) {
      throw this.pushErrorProducer(e);
    }
  }

  /**
   * Push a message to Bark APP with encryption
   *
   * When using encrypted push, you do not need set device key in { @link BarkMessage }
   *
   * @param deviceKey device key
   * @param message bark message, whose device key is unneeded
   * @param algorithm which algorithm to use
   * @param key key
   * @param iv iv
   * @returns nothing if message is sent successfully
   * @see [Encryption](https://bark.day.app/#/en-us/encryption)
   * @throws { BarkResponseError } If Web Crypto API is unavailable in runtime or message is sent unsuccessfully
   */
  async pushEncrypted(
    deviceKey: string,
    message: BarkMessage,
    algorithm: BarkEncryptedPushAlgorithm,
    key: string,
    iv: string,
  ): Promise<void> {
    this.checkKey(algorithm, key);
    this.checkIv(iv);

    const effectiveCrypto = globalThis.crypto;
    if (effectiveCrypto?.subtle == null) {
      throw new BarkResponseError(
        BarkResponseErrorType.UNKNOWN_ERROR,
        "Web Crypto API is unavailable in current runtime",
      );
    }
    const ciphertext = await this.encryptPayload(
      message,
      algorithm,
      key,
      iv,
      effectiveCrypto,
    );

    try {
      await this.requestJson<BarkResponse>(deviceKey, {
        body: new URLSearchParams({
          ciphertext,
        }).toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
      });
    } catch (e) {
      throw this.pushErrorProducer(e);
    }
  }

  /**
   * Produces the crypto mode and key size based on the provided algorithm.
   * @param algorithm - The BarkEncryptedPushAlgorithm to extract mode and key size from.
   * @returns An object containing the mode (CBC or ECB) and keySize (128, 192, or 256).
   * @throws { EncryptionModeError } if the algorithm does not have a valid key size or mode.
   */
  protected cryptoJsModeAndKeySizeProducer(
    algorithm: BarkEncryptedPushAlgorithm,
  ): {
    mode: "cbc" | "ecb";
    keySize: number;
  } {
    let keySize: number;
    let mode: "cbc" | "ecb";

    const array = algorithm.split("-", 3);

    switch (array[1]) {
      case "128":
        keySize = 128;
        break;
      case "192":
        keySize = 192;
        break;
      case "256":
        keySize = 256;
        break;
      default:
        throw new EncryptionKeySizeError(
          "The algorithm has not a valid key size",
        );
    }

    switch (array[2]) {
      case "cbc":
        mode = "cbc";
        break;
      case "ecb":
        mode = "ecb";
        break;
      default:
        throw new EncryptionModeError(
          "The algorithm has not a valid CryptoJS mode",
        );
    }

    return { mode, keySize };
  }

  /**
   * An error producing function used by miscellaneous function
   * @param error error
   * @returns { BarkResponseError }
   */
  protected miscellaneousFunctionErrorProducer(
    error: unknown,
  ): BarkResponseError {
    if (
      error instanceof TypeError ||
      (error instanceof Error &&
        "status" in error &&
        typeof (error as { status: unknown }).status === "number")
    ) {
      return new BarkResponseError(
        BarkResponseErrorType.SERVER_HAS_NOT_RESPONSE,
        "Server has not response",
        error,
      );
    } else if (error instanceof Error) {
      return new BarkResponseError(
        BarkResponseErrorType.UNKNOWN_ERROR,
        "Unknown error",
        error,
      );
    } else {
      return new BarkResponseError(
        BarkResponseErrorType.UNKNOWN_ERROR,
        "Unknown error",
      );
    }
  }

  /**
   * Check if key is legal when using encrypted push
   * @param algorithm which algorithm to use
   * @param key key
   * @throws { BarkEncryptionError } when key is illegal
   */
  protected checkKey(algorithm: BarkEncryptedPushAlgorithm, key: string): void {
    switch (algorithm) {
      case BarkEncryptedPushAlgorithm.AES_128_CBC:
      case BarkEncryptedPushAlgorithm.AES_128_ECB: {
        if (key.length !== 16) {
          throw new BarkEncryptionError(
            BarkEncryptionErrorType.KEY_IS_NOT_CORRECT,
            "The length of key is not 16",
          );
        }
        break;
      }
      case BarkEncryptedPushAlgorithm.AES_192_CBC:
      case BarkEncryptedPushAlgorithm.AES_192_ECB: {
        if (key.length !== 24) {
          throw new BarkEncryptionError(
            BarkEncryptionErrorType.KEY_IS_NOT_CORRECT,
            "The length of key is not 24",
          );
        }
        break;
      }
      case BarkEncryptedPushAlgorithm.AES_256_CBC:
      case BarkEncryptedPushAlgorithm.AES_256_ECB: {
        if (key.length !== 32) {
          throw new BarkEncryptionError(
            BarkEncryptionErrorType.KEY_IS_NOT_CORRECT,
            "The length of key is not 32",
          );
        }
        break;
      }
    }
  }

  /**
   * Check if iv is legal when using encrypted push
   * @param iv iv
   * @throws { BarkEncryptionError } when iv is illegal
   */
  protected checkIv(iv: string): void {
    if (iv.length !== 16) {
      throw new BarkEncryptionError(
        BarkEncryptionErrorType.IV_IS_NOT_CORRECT,
        "The length of iv is not 16",
      );
    }
  }

  /**
   * An error producing function used by push function
   * @param error error
   * @returns { BarkResponseError }
   */
  protected pushErrorProducer(error: unknown): BarkResponseError {
    if (
      error instanceof Error &&
      "status" in error &&
      typeof (error as { status: unknown }).status === "number"
    ) {
      const data = "data" in error
        ? (error as { data?: BarkResponse }).data
        : undefined;
      const status = (error as { status: number }).status;

      const failedToGetDeviceTokenRegularExpression =
        /failed to get device token: (.*)/;
      const requestBindFailedRegularExpression = /request bind failed: (.*)/;
      const pushFailedRegularExpression = /push failed: (.*)/;

      if (status === 400 && data?.message === "device key is empty") {
        return new BarkResponseError(
          BarkResponseErrorType.DEVICE_KEY_IS_EMPTY,
          "Device key is empty",
          error,
        );
      } else if (
        status === 400 &&
        data?.message !== undefined &&
        failedToGetDeviceTokenRegularExpression.test(data.message)
      ) {
        const regularExpressionExecArray =
          failedToGetDeviceTokenRegularExpression.exec(data.message);
        return new BarkResponseError(
          BarkResponseErrorType.FAILED_TO_GET_DEVICE_TOKEN,
          regularExpressionExecArray != null
            ? `Failed to get device token: ${regularExpressionExecArray[1]}`
            : "Failed to get device token",
          error,
        );
      } else if (
        status === 400 &&
        data?.message !== undefined &&
        requestBindFailedRegularExpression.test(data.message)
      ) {
        const regularExpressionExecArray = requestBindFailedRegularExpression
          .exec(data.message);
        return new BarkResponseError(
          BarkResponseErrorType.REQUEST_BIND_FAILED,
          regularExpressionExecArray != null
            ? `Request bind failed: ${regularExpressionExecArray[1]}`
            : "Request bind failed",
          error,
        );
      } else if (
        status === 500 &&
        data?.message !== undefined &&
        pushFailedRegularExpression.test(data.message)
      ) {
        const regularExpressionExecArray = pushFailedRegularExpression.exec(
          data.message,
        );
        return new BarkResponseError(
          BarkResponseErrorType.PUSH_FAILED,
          regularExpressionExecArray != null
            ? `Push failed: ${regularExpressionExecArray[1]}`
            : "Push failed",
          error,
        );
      }

      return new BarkResponseError(
        BarkResponseErrorType.UNKNOWN_ERROR,
        "Unknown error",
        error,
      );
    } else if (error instanceof Error) {
      return new BarkResponseError(
        BarkResponseErrorType.UNKNOWN_ERROR,
        "Unknown error",
        error,
      );
    } else {
      return new BarkResponseError(
        BarkResponseErrorType.UNKNOWN_ERROR,
        "Unknown error",
      );
    }
  }

  /**
   * Send an HTTP request to a Bark endpoint and ensure the response is successful.
   *
   * @param pathname Relative Bark endpoint path (for example `/push`) or device key path.
   * @param init Optional `fetch` request options.
   * @returns Successful `Response` object.
   * @throws { Error } If the HTTP status is not in the 2xx range.
   */
  protected async request(
    pathname: string,
    init?: RequestInit,
  ): Promise<Response> {
    const effectiveFetch = globalThis.fetch;
    if (effectiveFetch == null) {
      throw new BarkResponseError(
        BarkResponseErrorType.UNKNOWN_ERROR,
        "Fetch API is unavailable in current runtime",
      );
    }

    const response = await effectiveFetch(this.buildUrl(pathname), init);

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`) as Error & {
        status: number;
        data?: BarkResponse;
      };
      error.status = response.status;
      error.data = await this.tryParseBarkResponse(response.clone());
      throw error;
    }

    return response;
  }

  /**
   * Send an HTTP request and parse the successful JSON body.
   *
   * @typeParam T Expected JSON shape of the response body.
   * @param pathname Relative Bark endpoint path (for example `/info`).
   * @param init Optional `fetch` request options.
   * @returns Parsed JSON object typed as `T`.
   * @throws {Error} If the HTTP status is not in the 2xx range.
   */
  protected async requestJson<T>(
    pathname: string,
    init?: RequestInit,
  ): Promise<T> {
    const response = await this.request(pathname, init);
    return (await response.json()) as T;
  }

  /**
   * Build an absolute request URL from the configured server address and a
   * relative Bark endpoint path (or device key path).
   *
   * This keeps URL joining behavior consistent across all requests and avoids
   * malformed URLs when `serverAddress` may or may not end with `/`.
   *
   * @param pathname Relative Bark endpoint path or device key path.
   * @returns Absolute URL string for `fetch`.
   */
  protected buildUrl(pathname: string): string {
    return new URL(
      pathname,
      this.serverAddress.endsWith("/")
        ? this.serverAddress
        : `${this.serverAddress}/`,
    )
      .toString();
  }

  /**
   * Try to parse an error response body as Bark's JSON shape.
   *
   * Some non-2xx responses may not contain valid JSON (or may have empty body),
   * so parsing is intentionally best-effort and returns `undefined` on failure.
   * This allows upper-layer error mapping to still classify the HTTP error
   * without throwing a secondary JSON parse error.
   *
   * @param response HTTP response to parse.
   * @returns Parsed Bark response object, or `undefined` when parsing fails.
   */
  protected async tryParseBarkResponse(
    response: Response,
  ): Promise<BarkResponse | undefined> {
    try {
      return (await response.json()) as BarkResponse;
    } catch {
      return undefined;
    }
  }

  /**
   * Encrypt a Bark message payload and return Base64 ciphertext.
   *
   * This method centralizes the full encryption pipeline used by
   * `pushEncrypted`: UTF-8 encoding, PKCS#7 padding, algorithm/key-size
   * validation, mode-specific AES encryption, and Base64 conversion.
   *
   * Keeping this as a separate method avoids duplicating crypto steps in
   * request code and makes the encryption path easier to test in isolation.
   *
   * @param message Bark message payload to encrypt.
   * @param algorithm Encryption algorithm from `BarkEncryptedPushAlgorithm`.
   * @param key UTF-8 key string used for AES encryption.
   * @param iv UTF-8 initialization vector string.
   * @param cryptoImpl Web Crypto implementation used for encryption.
   * @returns Base64-encoded ciphertext string.
   * @throws { EncryptionKeySizeError } If key length does not match algorithm key size.
   */
  protected async encryptPayload(
    message: BarkMessage,
    algorithm: BarkEncryptedPushAlgorithm,
    key: string,
    iv: string,
    cryptoImpl: Crypto,
  ): Promise<string> {
    const { keySize, mode } = this.cryptoJsModeAndKeySizeProducer(algorithm);
    const textEncoder = new TextEncoder();
    const keyBytes = textEncoder.encode(key);
    const ivBytes = textEncoder.encode(iv);
    const plaintext = textEncoder.encode(JSON.stringify(message));
    const padded = this.padToAesBlockSize(plaintext);

    if (keyBytes.length !== keySize / 8) {
      throw new EncryptionKeySizeError(
        "The algorithm has not a valid key size",
      );
    }

    const encrypted = mode === "cbc"
      ? await this.encryptCbc(padded, keyBytes, ivBytes, cryptoImpl)
      : await this.encryptEcb(padded, keyBytes, cryptoImpl);

    return this.base64Encode(encrypted);
  }

  /**
   * Apply PKCS#7 padding to plaintext so its length is a multiple of AES block
   * size (16 bytes).
   *
   * @param data Plaintext bytes.
   * @returns Padded bytes with PKCS#7 padding.
   */
  protected padToAesBlockSize(data: Uint8Array): Uint8Array {
    const blockSize = 16;
    const remainder = data.length % blockSize;
    const paddingLength = remainder === 0 ? blockSize : blockSize - remainder;
    const result = new Uint8Array(data.length + paddingLength);
    result.set(data);
    result.fill(paddingLength, data.length);
    return result;
  }

  /**
   * Encrypt bytes using AES-CBC via Web Crypto.
   *
   * @param data Plaintext bytes (already padded to AES block size).
   * @param keyBytes Raw AES key bytes.
   * @param ivBytes Raw initialization vector bytes.
   * @returns Encrypted ciphertext bytes.
   */
  protected async encryptCbc(
    data: Uint8Array,
    keyBytes: Uint8Array,
    ivBytes: Uint8Array,
    cryptoImpl: Crypto,
  ): Promise<Uint8Array> {
    const keyMaterial = this.toArrayBuffer(keyBytes);
    const iv = this.toArrayBuffer(ivBytes);
    const payload = this.toArrayBuffer(data);
    const key = await cryptoImpl.subtle.importKey(
      "raw",
      keyMaterial,
      { name: "AES-CBC" },
      false,
      ["encrypt"],
    );
    const encrypted = await cryptoImpl.subtle.encrypt(
      { name: "AES-CBC", iv },
      key,
      payload,
    );
    return new Uint8Array(encrypted);
  }

  /**
   * Encrypt bytes in ECB-compatible mode.
   *
   * Web Crypto has no native AES-ECB, so this encrypts each 16-byte block
   * independently using AES-CBC with a zero IV and concatenates block outputs.
   *
   * @param data Plaintext bytes (already padded to AES block size).
   * @param keyBytes Raw AES key bytes.
   * @returns Encrypted ciphertext bytes.
   */
  protected async encryptEcb(
    data: Uint8Array,
    keyBytes: Uint8Array,
    cryptoImpl: Crypto,
  ): Promise<Uint8Array> {
    const keyMaterial = this.toArrayBuffer(keyBytes);
    const key = await cryptoImpl.subtle.importKey(
      "raw",
      keyMaterial,
      { name: "AES-CBC" },
      false,
      ["encrypt"],
    );
    const zeroIv = this.toArrayBuffer(new Uint8Array(16));
    const encrypted = new Uint8Array(data.length);

    for (let offset = 0; offset < data.length; offset += 16) {
      const block = data.slice(offset, offset + 16);
      const encryptedBlock = await cryptoImpl.subtle.encrypt(
        { name: "AES-CBC", iv: zeroIv },
        key,
        this.toArrayBuffer(block),
      );
      encrypted.set(new Uint8Array(encryptedBlock).slice(0, 16), offset);
    }

    return encrypted;
  }

  /**
   * Normalize Uint8Array into a standalone ArrayBuffer for Web Crypto APIs.
   *
   * @param data Source byte array.
   * @returns A copied ArrayBuffer containing the same bytes.
   */
  protected toArrayBuffer(data: Uint8Array): ArrayBuffer {
    const copy = new Uint8Array(new ArrayBuffer(data.byteLength));
    copy.set(data);
    return copy.buffer;
  }

  /**
   * Encode raw bytes into Base64 text.
   *
   * @param data Raw bytes to encode.
   * @returns Base64-encoded string.
   */
  protected base64Encode(data: Uint8Array): string {
    let binary = "";
    for (const byte of data) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }
}
