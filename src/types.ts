import type { IncomingMessage, ServerResponse } from "node:http";

export type ContextConfig = {
  readonly [K: string]: (req: IncomingMessage) => unknown;
};

export type InferContext<C extends ContextConfig> = {
  [K in keyof C]: C[K] extends (req: IncomingMessage) => infer R ? R : never;
};

export type ReqlocalMiddleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
) => void;
