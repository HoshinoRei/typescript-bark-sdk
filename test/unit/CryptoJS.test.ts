import { describe, expect, test } from "@jest/globals";
import CryptoJS from "crypto-js";

describe("CryptoJS", () => {
  test("Encrypt message", () => {
    const key = CryptoJS.enc.Utf8.parse("1234567890123456");
    const iv = CryptoJS.enc.Utf8.parse("1111111111111111");
    const cipher = CryptoJS.AES.encrypt(
      '{"body": "test", "sound": "birdsong"}',
      key,
      {
        mode: CryptoJS.mode.CBC,
        iv,
        keySize: 128,
      },
    );
    expect(CryptoJS.enc.Base64.stringify(cipher.ciphertext)).toBe(
      "d3QhjQjP5majvNt5CjsvFWwqqj2gKl96RFj5OO+u6ynTt7lkyigDYNA3abnnCLpr",
    );
  });
});
