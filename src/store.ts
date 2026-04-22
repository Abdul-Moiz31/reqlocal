import { AsyncLocalStorage } from "node:async_hooks";

const storage = new AsyncLocalStorage<Record<string, unknown>>();

export function runInStore<T>(store: Record<string, unknown>, fn: () => T): T {
  return storage.run(store, fn);
}

export function getStore<
  T extends Record<string, unknown> = Record<string, unknown>,
>(): T | undefined {
  return storage.getStore() as T | undefined;
}
