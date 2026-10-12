import { expect } from "bun:test"

type ErrorConstructor<T extends Error> = abstract new (...args: never[]) => T

export function assertEquals<T>(actual: T, expected: T): void {
  expect(actual).toEqual(expected)
}

export function assertThrows<T extends Error>(
  operation: () => unknown,
  expectedError: ErrorConstructor<T>,
  expectedMessage?: string,
): T {
  try {
    operation()
  } catch (error) {
    expect(error).toBeInstanceOf(expectedError)
    if (expectedMessage !== undefined) {
      expect(error).toHaveProperty("message", expectedMessage)
    }
    return error as T
  }

  throw new Error("Expected operation to throw")
}

export async function assertRejects<T extends Error>(
  operation: () => unknown | PromiseLike<unknown>,
  expectedError: ErrorConstructor<T>,
  expectedMessage?: string,
): Promise<T> {
  try {
    await operation()
  } catch (error) {
    expect(error).toBeInstanceOf(expectedError)
    if (expectedMessage !== undefined) {
      expect(error).toHaveProperty("message", expectedMessage)
    }
    return error as T
  }

  throw new Error("Expected operation to reject")
}
