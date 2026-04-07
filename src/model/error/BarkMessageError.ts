import type BarkMessageErrorType from "../enumeration/BarkMessageErrorType.ts";

/**
 * Bark message error
 * @property type
 * @property message
 * @property cause
 */
export default class BarkMessageError extends Error {
  /**
   * Domain-level message validation error classification.
   */
  type: BarkMessageErrorType;

  /**
   * Human-readable error message.
   */
  override message: string;

  /**
   * Optional underlying cause.
   */
  override cause?: Error;

  /**
   * Create a Bark message error.
   *
   * @param type Domain-level message validation error classification.
   * @param message Human-readable error message.
   * @param cause Optional underlying cause.
   */
  constructor(type: BarkMessageErrorType, message: string, cause?: Error) {
    super(message);
    this.type = type;
    this.message = message;
    this.cause = cause;
  }
}
