import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { getCtx } from "../src/context.js";
import { reqlocalPlugin } from "../src/fastify.js";

describe("Fastify plugin", () => {
  it("decorates the request lifecycle with context from config", async () => {
    const fastify = Fastify();

    await fastify.register(reqlocalPlugin, {
      config: {
        userId: (req) => String(req.headers["x-user-id"] ?? ""),
      },
    });

    fastify.get("/hello", async (_request, reply) => {
      const ctx = getCtx<{ userId: string }>();
      return { ok: true, userId: ctx.userId };
    });

    const res = await fastify.inject({
      method: "GET",
      url: "/hello",
      headers: { "x-user-id": "fastify-user" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, userId: "fastify-user" });

    await fastify.close();
  });
});
