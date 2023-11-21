/**
 * CryptoJS mode error
 * @property message
 * @property cause
 */
export default class CryptoJsModeError extends Error {
  message: string;
  cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.message = message;
    this.cause = cause;
  }
}
