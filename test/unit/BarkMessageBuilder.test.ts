/// <reference lib="deno.ns" />

import { assertEquals, assertThrows } from "@std/assert";

import BarkMessageBuilder from "../../src/lib/BarkMessageBuilder.ts";
import BarkMessageErrorType from "../../src/model/enumeration/BarkMessageErrorType.ts";
import BarkMessageError from "../../src/model/error/BarkMessageError.ts";

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
