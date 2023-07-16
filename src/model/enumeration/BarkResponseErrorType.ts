/**
 * The types of Bark response error
 */
enum BarkResponseErrorType {
  DEVICE_KEY_IS_EMPTY,
  FAILED_TO_GET_DEVICE_TOKEN,
  PUSH_FAILED,
  REQUEST_BIND_FAILED,
  UNKNOWN_ERROR,
}

export default BarkResponseErrorType;
