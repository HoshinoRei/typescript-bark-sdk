import type BarkResponseErrorType from "../enumeration/BarkResponseErrorType"

/**
 * Bark response error
 * @property type
 * @property message
 * @property cause
 */
export default class BarkResponseError extends Error {
  type: BarkResponseErrorType
  message: string
  cause?: Error

  constructor(type: BarkResponseErrorType, message: string, cause?: Error) {
    super(message)
    this.type = type
    this.message = message
    this.cause = cause
  }
}
