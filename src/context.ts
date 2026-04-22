import { getStore, runInStore } from "./store.js";

const GET_CTX_ERROR =
  "[reqlocal] getCtx() called outside a request context. Make sure reqlocal middleware runs before your route handlers.";

export function getCtx<
  T extends Record<string, unknown> = Record<string, unknown>,
>(): T {
  const store = getStore<T>();
  if (store === undefined) {
    throw new Error(GET_CTX_ERROR);
  }
  return store;
}

export function getCtxOrNull<
  T extends Record<string, unknown> = Record<string, unknown>,
>(): T | null {
  const store = getStore<T>();
  return store ?? null;
}

export function runWithCtx<TCtx extends Record<string, unknown>, TResult>(
  ctx: TCtx,
  fn: () => Promise<TResult>,
): Promise<TResult> {
  return runInStore(ctx, () => fn());
}
