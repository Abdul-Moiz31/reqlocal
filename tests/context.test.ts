import { describe, expect, it } from "vitest";
import { getCtx, getCtxOrNull, runWithCtx } from "../src/context.js";

const EXPECTED_ERROR =
  "[reqlocal] getCtx() called outside a request context. Make sure reqlocal middleware runs before your route handlers.";

describe("context", () => {
  it("getCtx() outside a request throws with the expected message", () => {
    expect(() => getCtx()).toThrowError(EXPECTED_ERROR);
  });

  it("getCtxOrNull() outside a request returns null", () => {
    expect(getCtxOrNull()).toBeNull();
  });

  it("runWithCtx() makes getCtx() available inside the callback", async () => {
    await runWithCtx({ job: "x", n: 42 }, async () => {
      expect(getCtx()).toEqual({ job: "x", n: 42 });
    });
  });

  it("nested runWithCtx() calls scope correctly", async () => {
    await runWithCtx({ outer: true, id: "a" }, async () => {
      expect(getCtx()).toEqual({ outer: true, id: "a" });

      await runWithCtx({ inner: true, id: "b" }, async () => {
        expect(getCtx()).toEqual({ inner: true, id: "b" });
      });

      expect(getCtx()).toEqual({ outer: true, id: "a" });
    });
  });
});
