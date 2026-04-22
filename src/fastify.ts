import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { runInStore } from "./store.js";
import type { ContextConfig } from "./types.js";

export type ReqlocalFastifyOptions = {
  config: ContextConfig;
};

const reqlocalPluginImpl: FastifyPluginAsync<ReqlocalFastifyOptions> = async (
  fastify,
  opts,
) => {
  const { config } = opts;
  fastify.addHook("onRequest", (request, reply, done) => {
    const context: Record<string, unknown> = {};
    for (const key of Object.keys(config)) {
      context[key] = config[key](request.raw);
    }
    runInStore(context, () => done());
  });
};

export const reqlocalPlugin = fp(reqlocalPluginImpl, {
  fastify: "4.x",
  name: "reqlocal",
});
