/**
 * The info response from Bark server
 * @property arch The architecture of the Bark server
 * @property build The build time of the Bark server
 * @property commit The hash of commit when Bark server is built
 * @property devices The number of devices registered on the Bark server
 * @property version The version of the Bark server
 */
export default interface BarkInfoResponse {
  /**
   * Bark server architecture string.
   */
  arch?: string;

  /**
   * Bark server build time.
   */
  build?: Date;

  /**
   * Commit hash used to build Bark server.
   */
  commit?: string;

  /**
   * Number of devices registered on Bark server.
   */
  devices?: number;

  /**
   * Bark server version string.
   */
  version?: string;
}
