# 001-002 — Connect OpenAI

## Learning Path

**Section:** 001 — LLMs  
**Lesson:** 001-002 — Connect OpenAI  
**Previous:** 001-001 — Project Setup  
**Next:** 001-003 — Prompt → Response

---

## Goal

In the previous lesson, we built the foundation of the Learn AI Agents application.

The application had:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- the course dashboard
- the course navigation
- the seven learning sections

But it could not communicate with an AI model yet.

In this lesson, we make our **first real connection to OpenAI**.

By the end of the lesson, this request:

```bash
curl http://localhost:3000/api/openai
```

should return:

```json
{ "message": "OpenAI connection successful." }
```

That small response proves an important architectural milestone:

```text
Our machine
    ↓
Next.js server
    ↓
OpenAI SDK
    ↓
OpenAI API
    ↓
Model
    ↓
Next.js server
    ↓
Our machine
```

We now have a working path between our application and an LLM.

---

# 1. Where We Are in the Course

Our progression is:

```text
001-001
Project Setup
    ↓
001-002
Connect OpenAI        ← WE ARE HERE
    ↓
001-003
Prompt → Response
    ↓
001-004
Responses API Deep Dive
    ↓
001-005
Streaming
    ↓
001-006
Simple LLM Chat UI
```

The distinction between `001-002` and `001-003` is important.

In this lesson, we are **not building a general prompt system**.

We are only proving:

> Can our Next.js server securely connect to OpenAI and receive a model response?

Therefore, our prompt is intentionally hard-coded.

---

# 2. What Changed in This Lesson

The important additions are:

```text
learn-ai-agents/
│
├── .env.local
│
├── package.json
├── pnpm-lock.yaml
│
└── src/
    │
    ├── app/
    │   └── api/
    │       └── openai/
    │           └── route.ts
    │
    └── lib/
        └── openai/
            └── client.ts
```

Each piece has a specific responsibility.

```text
.env.local
    ↓
stores OPENAI_API_KEY

src/lib/openai/client.ts
    ↓
creates the server-only OpenAI client

src/app/api/openai/route.ts
    ↓
makes the OpenAI request

package.json
    ↓
contains the OpenAI SDK dependency
```

---

# 3. Install the OpenAI SDK

We installed the official OpenAI JavaScript/TypeScript SDK with:

```bash
pnpm add openai
```

At the time this lesson was built, the installed version was:

```text
openai 7.9.0
```

This modified:

```text
package.json
pnpm-lock.yaml
```

The application can now import:

```ts
import OpenAI from "openai";
```

---

# 4. Configure the API Key

We created:

```text
.env.local
```

with:

```dotenv
OPENAI_API_KEY=your_actual_openai_api_key_here
```

The real API key must never be committed to the repository.

Our `.gitignore` already ignores `.env*`, so:

```bash
git status --short
```

does not show:

```text
.env.local
```

This is an important security boundary.

The key belongs on the server.

It should never be placed inside browser code.

---

# 5. Why `.env.local`?

Next.js automatically loads environment variables from environment files such as:

```text
.env.local
```

That allows server-side code to access:

```ts
process.env.OPENAI_API_KEY;
```

Conceptually:

```text
.env.local

OPENAI_API_KEY=...
        │
        ▼
Next.js server environment
        │
        ▼
process.env.OPENAI_API_KEY
```

There is an important Next.js distinction here.

Variables prefixed with:

```text
NEXT_PUBLIC_
```

can be exposed to browser-side code.

For example:

```text
NEXT_PUBLIC_SOMETHING
```

Our OpenAI API key must **not** be public.

Therefore we use:

```text
OPENAI_API_KEY
```

not:

```text
NEXT_PUBLIC_OPENAI_API_KEY
```

---

# 6. Create a Server-Only OpenAI Client

We created:

```text
src/lib/openai/client.ts
```

with:

```ts
import "server-only";

import OpenAI from "openai";

export const openai = new OpenAI();
```

This is intentionally a very small module.

Let's examine each part.

---

## 6.1 `server-only`

```ts
import "server-only";
```

This declares an important architectural rule:

> This module belongs on the server.

Our OpenAI client has access to server credentials.

We do not want a future Client Component accidentally importing this module.

Conceptually:

```text
Browser
   ✕
   │
   │ must not directly use
   ▼
OpenAI client
   │
   ▼
OPENAI_API_KEY
```

Instead:

```text
Browser
   │
   ▼
Next.js server
   │
   ▼
OpenAI client
   │
   ▼
OPENAI_API_KEY
```

That server boundary becomes increasingly important as our AI application grows.

---

# 7. Import the OpenAI SDK

The next line is:

```ts
import OpenAI from "openai";
```

This imports the SDK installed earlier with:

```bash
pnpm add openai
```

We can then create an OpenAI client.

---

# 8. Create the Client

Our client is:

```ts
export const openai = new OpenAI();
```

Notice that we did not write:

```ts
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

The SDK can read the standard:

```text
OPENAI_API_KEY
```

environment variable automatically.

Therefore:

```ts
new OpenAI();
```

is sufficient.

The complete flow is:

```text
.env.local
    │
    │ OPENAI_API_KEY
    ▼
Next.js server environment
    │
    ▼
new OpenAI()
    │
    ▼
OpenAI client
```

---

# 9. Why Create a Shared Client?

We could instantiate OpenAI directly inside the route:

```ts
import OpenAI from "openai";

const openai = new OpenAI();
```

But instead we created:

```text
src/lib/openai/client.ts
```

and exported:

```ts
export const openai = new OpenAI();
```

Then other server-side code can import:

```ts
import { openai } from "@/lib/openai/client";
```

This gives us one clear place responsible for constructing the OpenAI client.

As the project grows, routes and server-side features can reuse it.

We are not adding more abstraction than we need.

For now:

```text
src/lib/openai/client.ts
```

has exactly one job:

> Create our server-only OpenAI client.

---

# 10. Create the API Route

Next we created:

```text
src/app/api/openai/route.ts
```

In the Next.js App Router, a `route.ts` file can define HTTP route handlers.

Our file exports:

```ts
export async function GET() {
  // ...
}
```

That means Next.js exposes:

```text
GET /api/openai
```

The mapping is:

```text
src/
└── app/
    └── api/
        └── openai/
            └── route.ts
```

becomes:

```text
/api/openai
```

---

# 11. The Complete Route

Our route is:

```ts
import { openai } from "@/lib/openai/client";

/**
 * Lesson 001-002 — Connect OpenAI
 *
 * PAST — 001-001 Project Setup
 * --------------------------------
 * We created the Next.js application and the shared course UI.
 * There was no OpenAI SDK, API key, or model request yet.
 *
 * NOW — 001-002 Connect OpenAI
 * --------------------------------
 * We installed the OpenAI SDK, configured OPENAI_API_KEY in
 * .env.local, and created a reusable server-only OpenAI client.
 *
 * This route makes our first real request to OpenAI.
 *
 * For now, the input is intentionally hard-coded. The goal of this
 * lesson is only to prove that our server can successfully connect
 * to OpenAI and receive a response.
 *
 * NEXT — 001-003 Prompt → Response
 * --------------------------------
 * We will stop using a fixed test message and learn how to send a
 * prompt through our application and return the model's response.
 *
 * Later lessons will add streaming, a chat UI, tools, agent loops,
 * safety guards, RAG, and other agent capabilities.
 *
 * TEST CASES
 * --------------------------------
 *
 * Prerequisite:
 *
 *   pnpm dev
 *
 * Test 1 — Verify the OpenAI connection:
 *
 *   curl http://localhost:3000/api/openai
 *
 * Expected response:
 *
 *   {"message":"OpenAI connection successful."}
 *
 * This verifies the complete path:
 *
 *   curl
 *     → Next.js GET /api/openai
 *     → server-only OpenAI client
 *     → OPENAI_API_KEY
 *     → OpenAI Responses API
 *     → model response
 *     → JSON returned to the caller
 *
 * If this request succeeds, Lesson 001-002 has proven that the
 * application can communicate with OpenAI from the server.
 */

export async function GET() {
  // Send a minimal request through the OpenAI Responses API.
  //
  // The `openai` client is created in src/lib/openai/client.ts.
  // It reads OPENAI_API_KEY from the server environment, so the API
  // key never needs to be sent to the browser.
  const response = await openai.responses.create({
    model: "gpt-5.6-luna",
    input: "Reply with exactly: OpenAI connection successful.",
  });

  // `output_text` is the SDK's convenient way to retrieve the
  // combined text output from the model response.
  //
  // In this lesson we simply return that text as JSON so we can
  // verify that the OpenAI connection works end-to-end.
  return Response.json({
    message: response.output_text,
  });
}
```

The comments are intentionally part of the teaching material.

Throughout this course, important evolving files can use four sections:

```text
PAST
NOW
NEXT
TEST CASES
```

This lets someone switch to a maintained lesson branch and understand not only what the code currently does, but how it fits into the curriculum.

---

# 12. Import the Shared Client

At the top of `route.ts`:

```ts
import { openai } from "@/lib/openai/client";
```

The `@/*` alias was configured during project setup.

Therefore:

```ts
@/lib/openai/client
```

points to:

```text
src/lib/openai/client.ts
```

The route doesn't need to know how the OpenAI client is constructed.

It simply uses it.

---

# 13. The Route Handler

The handler begins:

```ts
export async function GET() {
```

This means the route responds to HTTP `GET` requests.

When we execute:

```bash
curl http://localhost:3000/api/openai
```

the request reaches this function.

Conceptually:

```text
curl
  │
  │ HTTP GET
  ▼
http://localhost:3000/api/openai
  │
  ▼
export async function GET()
```

---

# 14. Make the OpenAI Request

Inside the route we call:

```ts
const response = await openai.responses.create({
  model: "gpt-5.6-luna",
  input: "Reply with exactly: OpenAI connection successful.",
});
```

This is our first real model request.

There are several pieces worth understanding.

---

## 14.1 `openai`

```ts
openai;
```

is the shared client created in:

```text
src/lib/openai/client.ts
```

---

## 14.2 `responses`

```ts
openai.responses;
```

accesses the Responses API through the SDK.

---

## 14.3 `create()`

```ts
openai.responses.create(...)
```

creates a new model response.

At a high level:

```text
Our code
   │
   ▼
OpenAI SDK
   │
   ▼
Responses API
   │
   ▼
Model
```

---

# 15. The Model

Our request specifies:

```ts
model: "gpt-5.6-luna",
```

This tells OpenAI which model should process the request.

For this lesson, the exact intelligence of the model is not the main subject.

Our goal is simply to prove that the complete API connection works.

Later lessons will give us more opportunities to discuss model selection and model behavior.

---

# 16. Why Is the Input Hard-Coded?

Our input is:

```ts
input: "Reply with exactly: OpenAI connection successful.",
```

You might immediately wonder:

> Why don't we let the user send a prompt?

Because that belongs to the next lesson.

Our curriculum boundary is intentional.

### 001-002

```text
fixed input
    ↓
OpenAI
    ↓
fixed-style response
```

Goal:

```text
prove the connection
```

### 001-003

```text
user/application prompt
    ↓
OpenAI
    ↓
model response
```

Goal:

```text
understand Prompt → Response
```

Separating these concepts lets us understand one architectural layer at a time.

---

# 17. Why Use `await`?

The call is:

```ts
const response = await openai.responses.create(...);
```

An API request takes time.

Our server sends a request across the network and waits for OpenAI to respond.

Conceptually:

```text
Next.js
   │
   │ request
   ▼
OpenAI
   │
   │ processing
   │
   │ response
   ▼
Next.js
```

`await` pauses this async function until that request resolves.

In this lesson, we wait for the **complete response**.

Later, in:

```text
001-005 — Streaming
```

we will learn how to start receiving output incrementally rather than waiting for the complete response.

---

# 18. Read `output_text`

After the request completes, we have:

```ts
response;
```

The OpenAI response contains structured output.

For this simple lesson, we use:

```ts
response.output_text;
```

This gives us a convenient text representation of the model's generated output.

For our request, we expect:

```text
OpenAI connection successful.
```

So:

```ts
response.output_text;
```

should contain approximately:

```text
OpenAI connection successful.
```

We will explore the Responses API in more detail in:

```text
001-004 — Responses API Deep Dive
```

For now, we deliberately use the simplest useful output.

---

# 19. Return JSON from Next.js

Finally:

```ts
return Response.json({
  message: response.output_text,
});
```

This converts our JavaScript object:

```ts
{
  message: response.output_text,
}
```

into an HTTP JSON response.

The caller receives:

```json
{ "message": "OpenAI connection successful." }
```

The complete return path is:

```text
OpenAI model
     │
     ▼
response
     │
     ▼
response.output_text
     │
     ▼
Response.json(...)
     │
     ▼
HTTP response
     │
     ▼
curl
```

---

# 20. Complete Request Lifecycle

Now let's put everything together.

```text
1. Developer runs curl

   curl http://localhost:3000/api/openai

                 │
                 ▼

2. Next.js receives

   GET /api/openai

                 │
                 ▼

3. route.ts executes

   export async function GET()

                 │
                 ▼

4. Route uses shared client

   openai

                 │
                 ▼

5. OpenAI SDK reads server credentials

   OPENAI_API_KEY

                 │
                 ▼

6. Route creates a response

   openai.responses.create(...)

                 │
                 ▼

7. OpenAI Responses API receives request

                 │
                 ▼

8. Model generates

   OpenAI connection successful.

                 │
                 ▼

9. SDK exposes generated text

   response.output_text

                 │
                 ▼

10. Next.js returns JSON

   {"message":"OpenAI connection successful."}

                 │
                 ▼

11. curl displays the response
```

This is our first complete LLM request lifecycle.

---

# 21. Test the Connection

Start the development server:

```bash
pnpm dev
```

Then, from another terminal:

```bash
curl http://localhost:3000/api/openai
```

Our actual test produced:

```json
{ "message": "OpenAI connection successful." }
```

Therefore:

```text
TEST 1 — OpenAI connection

RESULT: PASS
```

---

# 22. What Does This Test Actually Prove?

A successful response proves several things simultaneously.

```text
✓ Next.js route is reachable

✓ route.ts executes server-side

✓ OpenAI SDK is installed correctly

✓ OpenAI client can be constructed

✓ OPENAI_API_KEY is available to the server

✓ credentials are accepted by OpenAI

✓ the application can reach the OpenAI API

✓ the Responses API request succeeds

✓ the model can generate output

✓ the SDK returns the generated text

✓ Next.js can return that text as JSON
```

That is why a tiny connectivity test is valuable.

It verifies the entire path before we introduce more moving pieces.

---

# 23. Why Not Call OpenAI Directly from the Browser?

It might seem simpler to write browser code like:

```text
Browser
   ↓
OpenAI
```

But then the browser would need access to our API credential.

That would be unsafe.

Instead our architecture is:

```text
Browser / caller
       │
       ▼
Next.js server
       │
       │ secret stays here
       ▼
OpenAI
```

The server acts as the trusted boundary.

This architecture will remain important throughout the course.

---

# 24. Development Environment

When we ran:

```bash
pnpm build
```

Next.js reported:

```text
Environments: .env.local
```

That confirms Next.js recognized our local environment configuration.

The production build also showed:

```text
ƒ /api/openai
```

while the course pages remained:

```text
○ /
○ /learn/01-llms
○ /learn/02-agents
...
```

The symbols mean:

```text
○  Static
ƒ  Dynamic
```

Our OpenAI route is dynamic because it executes server-side when requested.

That is exactly what we want for an API call.

---

# 25. Validation

We validated the lesson in several ways.

## Lint

```bash
pnpm lint
```

Result:

```text
PASS
```

## Functional Test

```bash
curl http://localhost:3000/api/openai
```

Result:

```json
{ "message": "OpenAI connection successful." }
```

Status:

```text
PASS
```

## Production Build

```bash
pnpm build
```

Result:

```text
Compiled successfully
Finished TypeScript
```

and:

```text
ƒ /api/openai
```

Status:

```text
PASS
```

---

# 26. Security Check

We also ran:

```bash
git status --short
```

and saw:

```text
 M package.json
 M pnpm-lock.yaml
?? src/app/api/
?? src/lib/openai/
```

We did **not** see:

```text
.env.local
```

Therefore our API key file remains ignored by Git.

This check is worth performing whenever credentials are introduced into a project.

---

# 27. What We Intentionally Did Not Build

At the end of this lesson, we have **not** built:

```text
✗ user-provided prompts
✗ POST prompt endpoint
✗ prompt form
✗ streaming
✗ chat history
✗ chat UI
✗ tool calling
✗ calculator tools
✗ agent loops
✗ safety guards
✗ RAG
✗ LangGraph
✗ MCP
✗ evaluation
```

This is intentional.

Our application currently knows only how to prove:

```text
Next.js server
       ↓
OpenAI
       ↓
response
```

That is enough for `001-002`.

---

# 28. PAST / NOW / NEXT

The comments in `route.ts` establish a convention we can evolve throughout the course.

```text
PAST
────
What had already been built?

NOW
───
What is this lesson changing?

NEXT
────
What is intentionally deferred?

TEST CASES
──────────
How can we prove the lesson works?
```

For this lesson:

```text
PAST
001-001 Project Setup

No OpenAI connection.


NOW
001-002 Connect OpenAI

SDK
API key
server-only client
Responses API request
successful response


NEXT
001-003 Prompt → Response

Replace the fixed connectivity input
with actual prompt handling.
```

This means the source code itself helps tell the story of the course.

---

# 29. Mental Model

The most important mental model from this lesson is:

```text
                 SERVER BOUNDARY
                       │
                       │
Caller                 │              OpenAI
  │                    │                 │
  │ GET /api/openai    │                 │
  ├───────────────────►│ route.ts        │
  │                    │                 │
  │                    │ openai client   │
  │                    │      │          │
  │                    │      │ API key  │
  │                    │      ▼          │
  │                    │ Responses API ─►│
  │                    │                 │
  │                    │◄────────────────│
  │                    │ model response  │
  │                    │                 │
  │◄───────────────────│                 │
  │ JSON               │                 │
```

The secret stays inside the server boundary.

The caller only sees the result.

---

# 30. Exercise

Before continuing, make sure you can answer these questions:

1. Why is `OPENAI_API_KEY` stored in `.env.local`?

2. Why do we use:

   ```ts
   import "server-only";
   ```

   in the OpenAI client module?

3. What does:

   ```ts
   new OpenAI();
   ```

   create?

4. Where does the SDK obtain the API key?

5. Why does:

   ```text
   src/app/api/openai/route.ts
   ```

   correspond to:

   ```text
   /api/openai
   ```

6. What does:

   ```ts
   openai.responses.create(...)
   ```

   do?

7. Why is the input hard-coded in this lesson?

8. What is:

   ```ts
   response.output_text;
   ```

   used for?

9. Why should the browser not call OpenAI using our secret API key directly?

10. What does this command test?

    ```bash
    curl http://localhost:3000/api/openai
    ```

If those ideas are clear, then the OpenAI connection architecture is clear.

---

# 31. Common Misunderstandings

## "We already sent a prompt. Isn't this Prompt → Response?"

Technically, the API request contains an input.

But the input is fixed inside the server code:

```ts
input: "Reply with exactly: OpenAI connection successful.",
```

We are using it only as a connectivity probe.

The application does not yet accept a prompt from a caller.

That distinction is what separates this lesson from `001-003`.

---

## "Does `.env.local` get sent to the browser?"

No.

Server environment variables remain server-side unless you deliberately expose values to client code.

Our OpenAI client is also explicitly marked:

```ts
import "server-only";
```

---

## "Why don't we put the API key directly in `client.ts`?"

Because then the secret would exist in source code and could accidentally be committed.

Bad:

```ts
const openai = new OpenAI({
  apiKey: "sk-...",
});
```

Correct:

```text
.env.local
    ↓
OPENAI_API_KEY
    ↓
OpenAI SDK
```

---

## "Why don't we build the chat UI now?"

Because we would be learning several concepts simultaneously.

Our course intentionally progresses:

```text
connection
    ↓
prompt → response
    ↓
Responses API
    ↓
streaming
    ↓
chat UI
```

Each lesson adds one conceptual layer.

---

# 32. Lesson Summary

Before this lesson:

```text
Learn AI Agents
      │
      ▼
Next.js application

No LLM connection
```

After this lesson:

```text
Learn AI Agents
      │
      ▼
Next.js API Route
      │
      ▼
Server-only OpenAI Client
      │
      ▼
OpenAI Responses API
      │
      ▼
gpt-5.6-luna
      │
      ▼
response.output_text
      │
      ▼
JSON response
```

We successfully received:

```json
{ "message": "OpenAI connection successful." }
```

So our application can now communicate with an LLM.

That is the foundation we need for everything that follows.

---

# 33. Infographic

The visual summary for this lesson is:

```text
resources/infographics/001-llms/001-002-connect-openai.png
```

It summarizes:

```text
OPENAI_API_KEY
      ↓
server-only client
      ↓
GET /api/openai
      ↓
Responses API
      ↓
model
      ↓
output_text
      ↓
JSON
```

---

# Next Lesson

## 001-003 — Prompt → Response

Our current route decides the input itself:

```ts
input: "Reply with exactly: OpenAI connection successful.",
```

That is useful for proving connectivity, but it is not yet an interactive LLM application.

In the next lesson, we will cross the next architectural boundary:

```text
CURRENT

Application
    ↓
hard-coded input
    ↓
OpenAI


NEXT

Caller
    ↓
prompt
    ↓
Application
    ↓
OpenAI
    ↓
response
    ↓
Caller
```

That will give us the fundamental interaction behind nearly every LLM application:

> **Prompt → Model → Response**

But we will still resist jumping ahead to streaming, chat, tools, or agents.

One layer at a time.
