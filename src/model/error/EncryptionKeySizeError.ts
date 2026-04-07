/**
 * Encryption key size error.
 *
 * Raised when the key length does not match the selected encryption algorithm.
 */
export default class EncryptionKeySizeError extends Error {
  /**
   * Human-readable error message.
   */
  override message: string;

  /**
   * Optional underlying cause.
   */
  override cause?: Error;

  /**
   * Create an encryption key size error.
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
