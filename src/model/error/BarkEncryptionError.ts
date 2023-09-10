import type BarkEncryptionErrorType from "../enumeration/BarkEncryptionErrorType";

/**
 * Bark encryption error
 * @property type
 * @property message
 * @property cause
 */
export default class BarkEncryptionError extends Error {
  type: BarkEncryptionErrorType;
  message: string;
  cause?: Error;

  constructor(type: BarkEncryptionErrorType, message: string, cause?: Error) {
    super(message);
    this.type = type;
    this.message = message;
    this.cause = cause;
  }
}
