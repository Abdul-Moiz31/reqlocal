import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  // Inlined so published code has zero npm runtime dependencies.
  noExternal: ["fastify-plugin"],
  outExtension({ format }) {
    return { js: format === "esm" ? ".mjs" : ".js" };
  },
});
