import { describe, expect, test } from "vitest"

import BarkMessageBuilder from "../../src/lib/BarkMessageBuilder"
import BarkMessageErrorType from "../../src/model/enumeration/BarkMessageErrorType"
import BarkMessageError from "../../src/model/error/BarkMessageError"

describe("Build message", () => {
  const notUrl: string = "I am not a URL"
  const url: string = "https://i.am/a.url"

  test("icon property is a URL", () => {
    expect(() => new BarkMessageBuilder().icon(url)).not.toThrowError()
  })

  test("icon property is not a URL", () => {
    expect(() => new BarkMessageBuilder().icon(notUrl)).toThrowError(
      new BarkMessageError(
        BarkMessageErrorType.IS_NOT_URL,
        "The argument icon is not a URL",
      ),
    )
  })

  test("url property is a URL", () => {
    expect(() => new BarkMessageBuilder().url(url)).not.toThrowError()
  })

  test("url property is not a URL", () => {
    expect(() => new BarkMessageBuilder().url(notUrl)).toThrowError(
      new BarkMessageError(
        BarkMessageErrorType.IS_NOT_URL,
        "The argument url is not a URL",
      ),
    )
  })
})
