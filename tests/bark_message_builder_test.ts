/// <reference lib="deno.ns" />

import { assertEquals, assertThrows } from "@std/assert";

import BarkMessageBuilder from "../bark_message_builder.ts";
import BarkMessageLevel from "../enums/bark_message_level.ts";
import BarkMessageErrorType from "../enums/bark_message_error_type.ts";
import BarkMessageSound from "../enums/bark_message_sound.ts";
import BarkMessageError from "../errors/bark_message_error.ts";

Deno.test("Build message: icon property is a URL", () => {
  new BarkMessageBuilder().icon("https://i.am/a.url");
});

Deno.test("Build message: icon property is not a URL", () => {
  const error = assertThrows(
    () => new BarkMessageBuilder().icon("I am not a URL"),
    BarkMessageError,
  );

  assertEquals(error.type, BarkMessageErrorType.IS_NOT_URL);
  assertEquals(error.message, "The argument icon is not a URL");
});

Deno.test("Build message: url property is a URL", () => {
  new BarkMessageBuilder().url("https://i.am/a.url");
});

Deno.test("Build message: url property is not a URL", () => {
  const error = assertThrows(
    () => new BarkMessageBuilder().url("I am not a URL"),
    BarkMessageError,
  );

  assertEquals(error.type, BarkMessageErrorType.IS_NOT_URL);
  assertEquals(error.message, "The argument url is not a URL");
});

Deno.test("Build message: icon property uses unsupported protocol", () => {
  const error = assertThrows(
    () => new BarkMessageBuilder().icon("ftp://i.am/a.url"),
    BarkMessageError,
  );

  assertEquals(error.type, BarkMessageErrorType.IS_NOT_URL);
  assertEquals(error.message, "The argument icon is not a URL");
});

Deno.test("Build message: url property uses unsupported protocol", () => {
  const error = assertThrows(
    () => new BarkMessageBuilder().url("mailto:test@example.com"),
    BarkMessageError,
  );

  assertEquals(error.type, BarkMessageErrorType.IS_NOT_URL);
  assertEquals(error.message, "The argument url is not a URL");
});

Deno.test("Build message: fluent builder sets all fields", () => {
  const message = new BarkMessageBuilder()
    .archive()
    .badge(1)
    .body("Test body")
    .category("Test category")
    .copy("Test copy")
    .deviceKey("device-key")
    .group("Test group")
    .icon("https://example.com/icon.png")
    .level(BarkMessageLevel.ACTIVE)
    .sound(BarkMessageSound.ALARM)
    .title("Test title")
    .url("https://example.com")
    .build();

  assertEquals(message, {
    badge: 1,
    body: "Test body",
    category: "Test category",
    copy: "Test copy",
    device_key: "device-key",
    group: "Test group",
    icon: "https://example.com/icon.png",
    isArchive: "1",
    level: BarkMessageLevel.ACTIVE,
    sound: BarkMessageSound.ALARM,
    title: "Test title",
    url: "https://example.com",
  });
});

Deno.test("Build message: built object reflects later mutations", () => {
  const builder = new BarkMessageBuilder().body("A");
  const built = builder.build();

  builder.title("B");

  assertEquals(built.title, "B");
});
