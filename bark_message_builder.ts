import BarkMessageErrorType from "./enums/bark_message_error_type.ts";
import type BarkMessageLevel from "./enums/bark_message_level.ts";
import type BarkMessageSound from "./enums/bark_message_sound.ts";
import BarkMessageError from "./errors/bark_message_error.ts";
import type BarkMessage from "./types/bark_message.ts";

/**
 * A class to help build Bark message properly
 * @property barkMessage The Bark message which will be built
 */
export default class BarkMessageBuilder {
  /**
   * Mutable Bark message object under construction.
   */
  protected barkMessage: BarkMessage;

  /**
   * Create an empty Bark message builder.
   */
  constructor() {
    this.barkMessage = {};
  }

  /**
   * Set the message as archived
   * @returns The builder
   */
  archive(): BarkMessageBuilder {
    this.barkMessage.isArchive = "1";
    return this;
  }

  /**
   * Set the badge property of the message
   * @param badge
   * @returns The builder
   */
  badge(badge: number): BarkMessageBuilder {
    this.barkMessage.badge = badge;
    return this;
  }

  /**
   * When all the properties is set, use this function to build the message
   * @returns Bark message
   */
  build(): BarkMessage {
    return this.barkMessage;
  }

  /**
   * Set the body property of the message
   * @param body
   * @returns The builder
   */
  body(body: string): BarkMessageBuilder {
    this.barkMessage.body = body;
    return this;
  }

  /**
   * Set the category of the message
   * @param category
   * @returns The builder
   */
  category(category: string): BarkMessageBuilder {
    this.barkMessage.category = category;
    return this;
  }

  /**
   * Set the copy property of the message
   * @param copy
   * @returns The builder
   */
  copy(copy: string): BarkMessageBuilder {
    this.barkMessage.copy = copy;
    return this;
  }

  /**
   * Set the device key property of the message
   * @param deviceKey
   * @returns The builder
   */
  deviceKey(deviceKey: string): BarkMessageBuilder {
    this.barkMessage.device_key = deviceKey;
    return this;
  }

  /**
   * Set the group property of the message
   * @param group
   * @returns The builder
   */
  group(group: string): BarkMessageBuilder {
    this.barkMessage.group = group;
    return this;
  }

  /**
   * Set the icon property of the message
   * @param icon
   * @returns The builder
   * @throws { BarkMessageError } if the argument is not a URL
   */
  icon(icon: string): BarkMessageBuilder {
    if (this.isHttpUrl(icon)) {
      this.barkMessage.icon = icon;
      return this;
    } else {
      throw this.isNotUrlErrorProducer("icon");
    }
  }

  /**
   * Set the level property of the message
   * @param level
   * @returns The builder
   */
  level(level: BarkMessageLevel): BarkMessageBuilder {
    this.barkMessage.level = level;
    return this;
  }

  /**
   * Set the sound property of the message
   * @param sound
   * @returns The builder
   */
  sound(sound: BarkMessageSound): BarkMessageBuilder {
    this.barkMessage.sound = sound;
    return this;
  }

  /**
   * Set the title property of the message
   * @param title
   * @returns The builder
   */
  title(title: string): BarkMessageBuilder {
    this.barkMessage.title = title;
    return this;
  }

  /**
   * Set the URL property of the message
   * @param url
   * @returns The builder
   * @throws { BarkMessageError } if the argument is not a URL
   */
  url(url: string): BarkMessageBuilder {
    if (this.isHttpUrl(url)) {
      this.barkMessage.url = url;
      return this;
    } else {
      throw this.isNotUrlErrorProducer("url");
    }
  }

  /**
   * An error producing function
   * @param argumentName The name of the argument which is not a URL
   * @returns Bark message error
   */
  protected isNotUrlErrorProducer(argumentName: string): BarkMessageError {
    return new BarkMessageError(
      BarkMessageErrorType.IS_NOT_URL,
      `The argument ${argumentName} is not a URL`,
    );
  }

  /**
   * Check whether a string is a valid HTTP/HTTPS URL.
   *
   * @param url URL string to validate.
   * @returns `true` when the string is a valid HTTP/HTTPS URL.
   */
  protected isHttpUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }
}
