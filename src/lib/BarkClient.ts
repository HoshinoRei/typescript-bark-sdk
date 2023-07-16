import axios, { AxiosError } from "axios";

import BarkClientUrl from "../model/enumeration/BarkClientUrl";
import BarkResponseErrorType from "../model/enumeration/BarkResponseErrorType";
import BarkResponseError from "../model/error/BarkResponseError";
import type BarkMessage from "../model/request/BarkMessage";
import type BarkResponse from "../model/response/BarkResponse";

/**
 * A class to communicate with Bark server
 */
export default class BarkClient {
  constructor(serverAddress: string = "https://api.day.app") {
    axios.defaults.baseURL = serverAddress;
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
