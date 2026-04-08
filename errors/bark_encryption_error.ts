import type BarkEncryptionErrorType from "../enums/bark_encryption_error_type.ts";

/**
 * Bark encryption error
 * @property type
 * @property message
 * @property cause
 */
export default class BarkEncryptionError extends Error {
  /**
   * Domain-level encryption error classification.
   */
  type: BarkEncryptionErrorType;

  /**
   * Human-readable error message.
   */
  override message: string;

  /**
   * Optional underlying cause.
   */
  override cause?: Error;

  /**
   * Create a Bark encryption error.
   *
   * @param type Domain-level encryption error classification.
   * @param message Human-readable error message.
   * @param cause Optional underlying cause.
   */
  constructor(type: BarkEncryptionErrorType, message: string, cause?: Error) {
    super(message);
    this.type = type;
    this.message = message;
    this.cause = cause;
  }
}
