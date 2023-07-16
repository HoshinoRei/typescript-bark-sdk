import type BarkMessageErrorType from "../enumeration/BarkMessageErrorType";

/**
 * Bark message error
 * @property type
 * @property message
 * @property cause
 */
export default class BarkMessageError extends Error {
  type: BarkMessageErrorType;
  message: string;
  cause?: Error;

  constructor(type: BarkMessageErrorType, message: string, cause?: Error) {
    super(message);
    this.type = type;
    this.message = message;
    this.cause = cause;
  }
}
