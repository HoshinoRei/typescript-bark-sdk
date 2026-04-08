/**
 * Encryption mode error.
 *
 * Raised when an unsupported encryption mode is provided.
 */
export default class EncryptionModeError extends Error {
  /**
   * Human-readable error message.
   */
  override message: string;

  /**
   * Optional underlying cause.
   */
  override cause?: Error;

  /**
   * Create an encryption mode error.
   *
   * @param message Human-readable error message.
   * @param cause Optional underlying cause.
   */
  constructor(message: string, cause?: Error) {
    super(message);
    this.message = message;
    this.cause = cause;
  }
}
