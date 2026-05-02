export function withMockFetch(
  handler: (
    input: string | URL | Request,
    init?: RequestInit,
  ) => Promise<Response> | Response,
): () => void {
  return withGlobalProperty(
    "fetch",
    ((input: string | URL | Request, init?: RequestInit) =>
      Promise.resolve(handler(input, init))) as typeof fetch,
  );
}

export function withMockRegexExecSecondCallNull(
  targetSource: string,
): () => void {
  const originalExec = RegExp.prototype.exec;
  const callCount = new Map<RegExp, number>();

  RegExp.prototype.exec = function (
    this: RegExp,
    value: string,
  ): RegExpExecArray | null {
    if (this.source === targetSource) {
      const count = (callCount.get(this) ?? 0) + 1;
      callCount.set(this, count);
      if (count === 2) {
        return null;
      }
    }

    return originalExec.call(this, value);
  };

  return () => {
    RegExp.prototype.exec = originalExec;
  };
}

export function withGlobalProperty(
  key: keyof typeof globalThis,
  value: unknown,
): () => void {
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, key);

  Object.defineProperty(globalThis, key, {
    configurable: true,
    value,
    writable: true,
  });

  return () => {
    if (originalDescriptor) {
      Object.defineProperty(globalThis, key, originalDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, key);
    }
  };
}
