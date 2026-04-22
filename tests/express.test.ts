import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { getCtx } from "../src/context.js";
import { reqlocal } from "../src/middleware.js";

describe("Express middleware", () => {
  it("builds context from config and exposes it via getCtx()", async () => {
    const app = express();

    app.use(
      reqlocal({
        traceId: (req) => String(req.headers["x-trace-id"] ?? "none"),
      }),
    );

    app.get("/ping", (_req, res) => {
      const ctx = getCtx<{ traceId: string }>();
      res.status(200).send(ctx.traceId);
    });

    const res = await request(app)
      .get("/ping")
      .set("x-trace-id", "abc-123")
      .expect(200);

    expect(res.text).toBe("abc-123");
  });
});
