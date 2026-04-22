import type { IncomingMessage, ServerResponse } from "node:http";
import { runInStore } from "./store.js";
import type { ContextConfig, InferContext } from "./types.js";

export function reqlocal<C extends ContextConfig>(
  config: C,
): (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
) => void {
  return (req, res, next) => {
    const context = {} as InferContext<C>;
    for (const key of Object.keys(config) as Array<keyof C>) {
      (context as Record<string, unknown>)[key as string] = config[key](req);
    }
    runInStore(context as Record<string, unknown>, () => next());
  };
}
