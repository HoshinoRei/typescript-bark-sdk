import type BarkMessageLevel from "../enumeration/BarkMessageLevel";
import type BarkMessageSound from "../enumeration/BarkMessageSound";

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
  badge?: number;
  body?: string;
  category?: string;
  copy?: string;
  device_key?: string;
  group?: string;
  icon?: string;
  isArchive?: string;
  level?: BarkMessageLevel;
  sound?: BarkMessageSound;
  title?: string;
  url?: string;
}
