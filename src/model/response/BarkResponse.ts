/**
 * The response from Bark server
 * @property code code
 * @property message message
 * @property timestamp The timestamp of the Bark server when it responds
 */
export default interface BarkResponse {
  code?: number
  message?: string
  timestamp?: number
}
