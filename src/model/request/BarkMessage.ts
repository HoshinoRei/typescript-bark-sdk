import type BarkMessageLevel from "../enumeration/BarkMessageLevel.ts";
import type BarkMessageSound from "../enumeration/BarkMessageSound.ts";

/**
 * Bark message
 * @property badge badge
 * @property body body
 * @property category category
 * @property copy copy
 * @property device_key device key
 * @property group group
 * @property icon icon
 * @property isArchive is message archived
 * @property level level
 * @property sound sound
 * @property title title
 * @property url URL
 */
export default interface BarkMessage {
  /**
   * Badge number shown on app icon.
   */
  badge?: number;

  /**
   * Notification body text.
   */
  body?: string;

  /**
   * Notification category value.
   */
  category?: string;

  /**
   * Content copied to clipboard.
   */
  copy?: string;

  /**
   * Target Bark device key.
   */
  device_key?: string;

  /**
   * Notification group name.
   */
  group?: string;

  /**
   * Icon URL.
   */
  icon?: string;

  /**
   * Archive flag (`"1"` to archive).
   */
  isArchive?: string;

  /**
   * Notification interruption level.
   */
  level?: BarkMessageLevel;

  /**
   * Notification sound.
   */
  sound?: BarkMessageSound;

  /**
   * Notification title text.
   */
  title?: string;

  /**
   * URL opened when notification is tapped.
   */
  url?: string;
}
