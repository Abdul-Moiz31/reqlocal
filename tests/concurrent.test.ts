import type { Server } from "node:http";
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { getCtx } from "../src/context.js";
import { reqlocal } from "../src/middleware.js";

function listen(app: express.Application): Promise<{ server: Server; port: number }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        resolve({ server, port: addr.port });
      } else {
        reject(new Error("Could not read server address"));
      }
    });
    server.on("error", reject);
  });
}

function randomDelayMs(): number {
  return 10 + Math.floor(Math.random() * 91);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("concurrent requests", () => {
  it("does not bleed context across 50 concurrent Express requests", async () => {
    const app = express();

    app.use(
      reqlocal({
        userId: (req) => String(req.headers["x-user-id"] ?? ""),
      }),
    );

    app.get("/test", async (_req, res) => {
      await delay(randomDelayMs());
      const ctx = getCtx<{ userId: string }>();
      res.json({ userId: ctx.userId });
    });

    const { server, port } = await listen(app);
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      const promises = Array.from({ length: 50 }, async (_, i) => {
        const userId = `user-${i}`;
        const res = await request(baseUrl)
          .get("/test")
          .set("x-user-id", userId)
          .expect(200)
          .expect("Content-Type", /json/);

        expect(res.body).toEqual({ userId });
      });

      await Promise.all(promises);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });
});
