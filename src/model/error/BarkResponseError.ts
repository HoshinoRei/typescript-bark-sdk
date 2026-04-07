import type BarkResponseErrorType from "../enumeration/BarkResponseErrorType.ts";

/**
 * Bark response error
 * @property type
 * @property message
 * @property cause
 */
export default class BarkResponseError extends Error {
  /**
   * Domain-level response error classification.
   */
  type: BarkResponseErrorType;

  /**
   * Human-readable error message.
   */
  override message: string;

  /**
   * Optional underlying cause.
   */
  override cause?: Error;

  /**
   * Create a Bark response error.
   *
   * @param type Domain-level response error classification.
   * @param message Human-readable error message.
   * @param cause Optional underlying cause.
   */
  constructor(type: BarkResponseErrorType, message: string, cause?: Error) {
    super(message);
    this.type = type;
    this.message = message;
    this.cause = cause;
  }
}
