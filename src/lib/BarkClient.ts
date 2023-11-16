import axios, { AxiosError } from "axios";
import crypto from "crypto";

import BarkClientUrl from "../model/enumeration/BarkClientUrl";
import BarkEncryptedPushAlgorithm from "../model/enumeration/BarkEncryptedPushAlgorithm";
import BarkEncryptionErrorType from "../model/enumeration/BarkEncryptionErrorType";
import BarkResponseErrorType from "../model/enumeration/BarkResponseErrorType";
import BarkEncryptionError from "../model/error/BarkEncryptionError";
import BarkResponseError from "../model/error/BarkResponseError";
import type BarkMessage from "../model/request/BarkMessage";
import type BarkInfoResponse from "../model/response/BarkInfoResponse";
import type BarkResponse from "../model/response/BarkResponse";

/**
 * A class to communicate with Bark server
 */
export default class BarkClient {
  constructor(serverAddress: string = "https://api.day.app") {
    axios.defaults.baseURL = serverAddress;
  }

  /**
   * Check if the Bark server is healthy
   * @returns nothing if the Bark server is healthy
   * @see [Healthz](https://github.com/Finb/bark-server/blob/master/docs/API_V2.md#healthz)
   * @throws { @link BarkResponseError } if the Bark server is unhealthy
   */
  async health(): Promise<void> {
    try {
      await axios.get<string>(BarkClientUrl.HEALTHZ);
    } catch (e) {
      throw this.miscellaneousFunctionErrorProducer(e);
    }
  }

  /**
   * Get info of Bark server
   * @returns { @link BarkInfoResponse } info of the Bark server
   * @see [Info](https://github.com/Finb/bark-server/blob/master/docs/API_V2.md#info)
   * @throws { @link BarkResponseError } if the Bark server does not respond normally
   */
  async info(): Promise<BarkInfoResponse> {
    try {
      const { data } = await axios.get<{
        arch?: string;
        build?: string;
        commit?: string;
        devices?: number;
        version?: string;
      }>(BarkClientUrl.INFO);
      return {
        arch: data.arch,
        build:
          data.build !== undefined
            ? new Date(Date.parse(data.build))
            : undefined,
        commit: data.commit,
        devices: data.devices,
        version: data.version,
      };
    } catch (e) {
      throw this.miscellaneousFunctionErrorProducer(e);
    }
  }

  /**
   * Push a message to Bark APP
   * @param message bark message
   * @returns nothing if message is sent successfully
   * @see [API V2](https://github.com/Finb/bark-server/blob/master/docs/API_V2.md#api-v2)
   * @throws { @link BarkResponseError } if message is sent unsuccessfully
   */
  async push(message: BarkMessage): Promise<void> {
    try {
      await axios.post<BarkResponse>(BarkClientUrl.PUSH, message);
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
   * @throws { @link BarkResponseError } if message is sent unsuccessfully
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

    const cipher = crypto.createCipheriv(algorithm, key, iv);

    try {
      await axios.post(
        deviceKey,
        {
          ciphertext: `${cipher.update(
            JSON.stringify(message),
            "utf-8",
            "base64",
          )}${cipher.final("base64")}`,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );
    } catch (e) {
      throw this.pushErrorProducer(e);
    }
  }

  /**
   * An error producing function used by miscellaneous function
   * @param e error
   * @returns { @link BarkResponseError }
   */
  protected miscellaneousFunctionErrorProducer(e: unknown): BarkResponseError {
    if (e instanceof AxiosError) {
      return new BarkResponseError(
        BarkResponseErrorType.SERVER_HAS_NO_RESPONSE,
        "Server has no response",
        e,
      );
    } else if (e instanceof Error) {
      return new BarkResponseError(
        BarkResponseErrorType.UNKNOWN_ERROR,
        "Unknown error",
        e,
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
   * @throws { @link BarkEncryptionError } when key is illegal
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
   * @throws { @link BarkEncryptionError } when iv is illegal
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
   * @param e error
   * @returns { @link BarkResponseError }
   */
  protected pushErrorProducer(e: unknown): BarkResponseError {
    if (e instanceof AxiosError) {
      const data: BarkResponse = e.response?.data;

      const failedToGetDeviceTokenRegularExpression =
        /failed to get device token: (.*)/;
      const requestBindFailedRegularExpression = /request bind failed: (.*)/;
      const pushFailedRegularExpression = /push failed: (.*)/;

      if (
        e.response?.status === 400 &&
        data.message === "device key is empty"
      ) {
        return new BarkResponseError(
          BarkResponseErrorType.DEVICE_KEY_IS_EMPTY,
          "Device key is empty",
          e,
        );
      } else if (
        e.response?.status === 400 &&
        data.message !== undefined &&
        failedToGetDeviceTokenRegularExpression.test(data.message)
      ) {
        const regularExpressionExecArray =
          failedToGetDeviceTokenRegularExpression.exec(data.message);
        return new BarkResponseError(
          BarkResponseErrorType.FAILED_TO_GET_DEVICE_TOKEN,
          regularExpressionExecArray != null
            ? `Failed to get device token: ${regularExpressionExecArray[1]}`
            : "Failed to get device token",
          e,
        );
      } else if (
        e.response?.status === 400 &&
        data.message !== undefined &&
        requestBindFailedRegularExpression.test(data.message)
      ) {
        const regularExpressionExecArray =
          requestBindFailedRegularExpression.exec(data.message);
        return new BarkResponseError(
          BarkResponseErrorType.REQUEST_BIND_FAILED,
          regularExpressionExecArray != null
            ? `Request bind failed: ${regularExpressionExecArray[1]}`
            : "Request bind failed",
          e,
        );
      } else if (
        e.response?.status === 500 &&
        data.message !== undefined &&
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
          e,
        );
      } else {
        return new BarkResponseError(
          BarkResponseErrorType.UNKNOWN_ERROR,
          "Unknown error",
          e,
        );
      }
    } else if (e instanceof Error) {
      return new BarkResponseError(
        BarkResponseErrorType.UNKNOWN_ERROR,
        "Unknown error",
        e,
      );
    } else {
      return new BarkResponseError(
        BarkResponseErrorType.UNKNOWN_ERROR,
        "Unknown error",
      );
    }
  }
}
