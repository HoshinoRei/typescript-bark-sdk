/**
 * The response from Bark server
 * @property code code
 * @property message message
 * @property timestamp The timestamp of the Bark server when it responds
 */
export default interface BarkResponse {
  /**
   * Response status code from Bark API.
   */
  code?: number;

  /**
   * Response message from Bark API.
   */
  message?: string;

  /**
   * Response timestamp from Bark API.
   */
  timestamp?: number;
}
