<div align="center">

<br />

<img src="../Website/public/logo-mark.svg" alt="reqlocal" width="72" height="72" />

# reqlocal

### Stop threading context. One middleware.

[![npm](https://img.shields.io/npm/v/reqlocal?style=flat-square&color=2dd4bf&label=npm)](https://www.npmjs.com/package/reqlocal)
[![downloads](https://img.shields.io/npm/dm/reqlocal?style=flat-square&color=34d399&label=downloads)](https://www.npmjs.com/package/reqlocal)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/reqlocal?style=flat-square&color=059669&label=minzipped%20size)](https://bundlephobia.com/package/reqlocal)
[![license](https://img.shields.io/badge/license-MIT-34d399?style=flat-square)](./LICENSE)

<br />

Open-source **request-scoped context** for Node.js with **`AsyncLocalStorage`** — typed **`getCtx()`** for every layer of your handler stack.  
**Zero runtime dependencies.** TypeScript-native. **Express** and **Fastify** ready.

<br />

[Website](../Website) · [Docs](../Website/README.md#docs) · [API Reference](#api-reference) · [Pricing](../Website/README.md#routes)

<br />

---

</div>

## Install

```bash
npm install reqlocal
```

```bash
pnpm add reqlocal
```

```bash
yarn add reqlocal
```

For **`reqlocalPlugin`** (Fastify), add the optional peer:

```bash
npm install reqlocal fastify
```

## Usage

```ts
import express from 'express';
import { reqlocal, getCtx } from 'reqlocal';

const app = express();

app.use(
  reqlocal({
    userId: (req) => String(req.headers['x-user-id'] ?? ''),
  }),
);

app.get('/me', (_req, res) => {
  const { userId } = getCtx<{ userId: string }>();
  res.json({ userId });
});
```

Typed context for the whole request — including after `await` — without passing arguments through every helper.

## Before / after

**Manual threading**

```ts
async function loadProfile(userId: string, traceId: string) {
  return db.profiles.find({ userId, traceId });
}

app.get('/me', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const traceId = req.headers['x-trace-id'] as string;
  const profile = await loadProfile(userId, traceId);
  res.json(profile);
});
```

**reqlocal**

```ts
async function loadProfile() {
  const { userId, traceId } = getCtx<{ userId: string; traceId: string }>();
  return db.profiles.find({ userId, traceId });
}

app.get('/me', async (_req, res) => {
  const profile = await loadProfile();
  res.json(profile);
});
```

## TypeScript

```ts
import type { InferContext } from 'reqlocal';

const contextConfig = {
  userId: (req) => String(req.headers['x-user-id'] ?? ''),
  traceId: (req) => String(req.headers['x-trace-id'] ?? ''),
  requestStartedAt: () => Date.now(),
} as const;

type AppContext = InferContext<typeof contextConfig>;

function audit(): AppContext {
  return getCtx<AppContext>();
}
```

## Background jobs

```ts
import { runWithCtx, getCtx } from 'reqlocal';

await runWithCtx({ jobId: '42', source: 'nightly' }, async () => {
  const ctx = getCtx<{ jobId: string; source: string }>();
  await doWork(ctx.jobId);
});
```

Nested **`runWithCtx`** calls stack correctly with HTTP-bound context.

## Framework integrations

### Express — middleware

```ts
import express from 'express';
import { reqlocal, getCtx } from 'reqlocal';

const app = express();

app.use(
  reqlocal({
    userId: (req) => String(req.headers['x-user-id'] ?? ''),
    traceId: (req) => String(req.headers['x-trace-id'] ?? ''),
  }),
);

app.get('/api/hello', (_req, res) => {
  res.json(getCtx<{ userId: string; traceId: string }>());
});
```

Mount **`reqlocal`** **before** any route or middleware that calls **`getCtx()`**.

### Fastify — plugin

```ts
import Fastify from 'fastify';
import { reqlocalPlugin, getCtx } from 'reqlocal';

const app = Fastify();

await app.register(reqlocalPlugin, {
  config: {
    userId: (req) => String(req.headers['x-user-id'] ?? ''),
  },
});

app.get('/api/me', async () => getCtx<{ userId: string }>());
```

Config callbacks receive the Node **`IncomingMessage`** (`request.raw`).

### Next.js — route handler (Node runtime)

Use the **Node.js** runtime (not Edge). Establish context with **`runWithCtx`** when you are not behind Express:

```ts
import { NextResponse } from 'next/server';
import { runWithCtx, getCtx } from 'reqlocal';

export async function GET(request: Request) {
  const userId = request.headers.get('x-user-id') ?? '';

  return runWithCtx({ userId }, async () => {
    const ctx = getCtx<{ userId: string }>();
    return NextResponse.json({ ok: true, userId: ctx.userId });
  });
}
```

## How it works

```
HTTP request
    │
    ▼
┌──────────────────┐     ┌────────────────────────────┐
│ reqlocal         │────▶│ Build context object        │
│ middleware       │     │ (headers, auth, traceId…)   │
└────────┬─────────┘     └────────────────────────────┘
         │
         ▼
┌──────────────────┐     ┌────────────────────────────┐
│ AsyncLocalStorage │────▶│ One store per request       │
│ .run(store, …)   │     │ Survives await / microtasks │
└────────┬─────────┘     └────────────────────────────┘
         │
         ▼
┌──────────────────┐     ┌────────────────────────────┐
│ Route + services │────▶│ getCtx() / getCtxOrNull()   │
└──────────────────┘     └────────────────────────────┘
```

**No globals:** each concurrent request keeps an isolated store. No `cls-hooked` and no extra npm runtime dependencies — only Node’s built-in ALS.

## Comparison

| | reqlocal | Manual threading | Implicit globals |
|---|:---:|:---:|:---:|
| **Typed context** | ✅ | ✅ (verbose) | ❌ |
| **Works after `await`** | ✅ | ✅ | ⚠️ error-prone |
| **Zero extra runtime deps** | ✅ | ✅ | ✅ |
| **Concurrent requests safe** | ✅ | ✅ | ❌ |
| **Express / Fastify** | ✅ | ✅ | ⚠️ ad hoc |
| **`fastify-plugin` wrapper** | ✅ | — | — |

## API Reference

### `getCtx<T>(): T`

Returns the current context object. **Throws** if called outside an active store:

```txt
[reqlocal] getCtx() called outside a request context. Make sure reqlocal middleware runs before your route handlers.
```

### `getCtxOrNull<T>(): T | null`

Same as **`getCtx`**, but returns **`null`** when no store is active.

### `runWithCtx(ctx, fn): Promise`

Runs **`fn`** (must return a **`Promise`**) inside a new store. Use for workers, queues, and tests.

### `reqlocal(config): Middleware`

Express / Connect middleware. **`config`** maps string keys to **`(req: IncomingMessage) => value`**.

### `reqlocalPlugin`

Fastify plugin (via **`fastify-plugin`**). Register with **`{ config }`** in the same shape as Express.

### Exported types

| Type | Description |
|------|-------------|
| `ContextConfig` | Keys → `(req: IncomingMessage) => unknown` |
| `InferContext<C>` | Inferred context shape from **`C`** |
| `ReqlocalMiddleware` | Connect-compatible middleware type |
| `ReqlocalFastifyOptions` | `{ config: ContextConfig }` |

## Package exports

Dual **ESM** (`.mjs`) and **CommonJS** (`.js`) with shared **`.d.ts`**:

```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.mjs",
    "require": "./dist/index.js"
  }
}
```

## Requirements

- **Node.js ≥ 16.0.0** (`AsyncLocalStorage`)

## Developing

```bash
npm install
npm test
npm run build
```

Tests: **Vitest** (`tests/context`, `concurrent`, `express`, `fastify`). Source: **`src/`** (tsup → **`dist/`**).

## Publishing

1. Set **`repository`**, **`author`**, and **`version`** in **`package.json`**
2. **`npm test`** && **`npm run build`**
3. **`npm publish`**

Badges may show “package not found” until the first npm publish.

## Contributing

Issues and PRs welcome. Please run **`npm test`** before submitting.

## Marketing site

Next.js app in **[`../Website`](../Website)** — landing page, **`/docs`**, **`/pricing`**.

```bash
cd ../Website && npm install && npm run dev
```

Open **http://localhost:3000/docs** for the full docs UI.

## License

MIT — use it in any project, commercial or open-source. See [`LICENSE`](./LICENSE).

---

<div align="center">

<br />

Documentation hub inspired by projects like [**@isdisposable/js**](https://github.com/isdisposable/js).

<br />

</div>
