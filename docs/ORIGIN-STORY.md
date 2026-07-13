# Why reqlocal exists (the adminIde-stack story)

This is the version I tell when someone asks *why* the package is real, not just another utility dump. It maps to work on **adminIde-stack**: a multi-tenant admin product with GraphQL, auth, billing, org and project context, and subscriptions.

---

## The issue I was in the middle of

I was deep in **request identity and tenant safety**: making sure the right user, org, and tenant were attached before resolvers ran, that permissions matched the current page URI, and that special paths (normal HTTP, WebSocket subscriptions, secret API style calls) did not drift or skip checks.

That is not one function. It is middleware, GraphQL plugins, context augmentation, and services that all need the same facts about *this* request.

---

## The problem that kept showing up

**Everything wanted the same slice of the request, but there was no small, stable way to get it deep in the stack.**

In adminIde-stack that shows up as:

- A **`ServerContext` that keeps growing**, because packages merge more fields onto one shared type. The context is powerful, but it becomes the only door into “who is this caller.”
- **GraphQL middleware** that has to treat HTTP, WebSocket, and token-based flows differently. When subscriptions do not have a normal `req`, you end up building request-shaped objects so downstream code can still run. That is a symptom of the same issue: *call path* determines how you access caller facts.
- **Tenant and permissions** that depend on headers, URI segments, and `userContext` together. Helpers like permission resolution are written against the full context object because that is where everything was hung.

So the pain was not “I forgot a variable once.” The pain was **structural**: caller-scoped data only moved by threading a large context (or overloading `req`), and every new feature had to plug into that same pattern.

---

## What I wished I had at that moment

I wished I could **define a narrow, typed “this request” object once at the edge** and then, anywhere in async code for that request, **read it without passing it through every function**.

Node already supports that idea: **`AsyncLocalStorage`** keeps a value scoped to the current async chain and concurrent requests do not collide.

**reqlocal** is that idea packaged for day-to-day HTTP work: one middleware (or Fastify hook), **`getCtx()`** where you need it, plus **`runWithCtx`** for jobs and tests.

---

## If we used reqlocal inside adminIde-stack, would it solve anything?

**Yes, for the class of problem above, where it fits architecturally.** It does not erase Apollo or your existing `ServerContext` in one commit. It gives you a **second, minimal layer** that solves “threading” for the pieces you choose.

Concrete ways it could help:

1. **Express (or Fastify) in front of GraphQL**  
   You can establish ALS-backed context in the same process before the request hits Apollo. Things that only need `tenantId`, `userId`, `traceId`, or org slug can read **`getCtx()`** instead of reaching for the full GraphQL context or a stuffed `req`.

2. **Shared services called from many places**  
   If a service is used from a REST handler, a GraphQL resolver, and a background job, today you often pass bags of ids. With **`runWithCtx`** in jobs and middleware on HTTP, the **same service code** can call **`getCtx()`** when the active store is set, and stay explicit where it is not.

3. **Logging, auditing, tracing**  
   Anything that only needs a stable request id or tenant for log lines can stop taking extra parameters through five layers.

4. **Mental model for new endpoints**  
   New small APIs can stay thin: edge defines scope, internals stay clean, without growing the god context type again.

What it **does not** do by itself:

- Replace dataloaders, schema-specific resolver needs, or every field on **`ServerContext`**. GraphQL will still want its context object for many resolvers until you deliberately narrow that surface.
- Fix Edge runtimes without Node’s **`AsyncLocalStorage`**.

So: **using reqlocal in adminIde-stack solves real friction** wherever you commit to “request scope lives in ALS for this path.” It is the tool for the problem I kept hitting there: **caller scope should be established once and readable anywhere in the async tree**, not re-wired through every new middleware and helper.

---

## One line for marketing

I was working on **tenant and user context across HTTP and GraphQL** in adminIde-stack and kept hitting **context threading and overloaded request objects**. I built **reqlocal** so Node apps can **set request scope once and read it with `getCtx()`**, using **`AsyncLocalStorage`**, without extra runtime dependencies.

---

*This doc is the story behind the package. For install and API details, see the main [README](../README.md).*
