# Lesson 001-003 — Prompt → Response

**Course:** Learn AI Agents  
**Publisher:** Thunkx  
**Section:** 001 — LLMs  
**Lesson:** 001-003 — Prompt → Response  
**Philosophy:** Learn by building.

---

## 1. What We Are Building

In the previous lesson, **001-002 — Connect OpenAI**, we proved that our Next.js server could successfully communicate with OpenAI.

Our API route looked conceptually like this:

```text
GET /api/openai
      ↓
hard-coded prompt
      ↓
OpenAI
      ↓
response.output_text
      ↓
JSON
```

That was enough to prove that:

- the OpenAI SDK was installed correctly,
- `OPENAI_API_KEY` was available to the server,
- our reusable OpenAI client worked,
- our Next.js Route Handler could call OpenAI,
- and OpenAI could return a response.

But there was an important limitation.

The prompt was written directly inside `route.ts`:

```ts
const response = await openai.responses.create({
  model: "gpt-5.6-luna",
  input: "Reply with exactly: OpenAI connection successful.",
});
```

The caller had no control over the prompt.

In this lesson, we change that.

By the end of **001-003**, our application will support:

```text
Caller
  ↓
POST /api/openai
  ↓
JSON request body
  ↓
prompt
  ↓
OpenAI
  ↓
generated response
  ↓
Caller
```

This gives us the fundamental interaction behind an LLM application:

```text
Prompt → Model → Response
```

---

# 2. Where We Are in the Course

Our first three lessons form a deliberate progression.

## 001-001 — Project Setup

We built the application foundation:

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
Course shell
Lesson routes
```

There was no OpenAI integration yet.

## 001-002 — Connect OpenAI

We added:

```text
OpenAI SDK
OPENAI_API_KEY
server-only OpenAI client
GET /api/openai
hard-coded test prompt
```

We proved:

```text
Next.js server → OpenAI → response
```

## 001-003 — Prompt → Response

Now we make the prompt dynamic:

```text
Caller → Prompt → Model → Response
```

The important change is that **the caller now chooses the prompt**.

---

# 3. Before and After

The architectural difference between `001-002` and `001-003` is small in code but very important conceptually.

## Before — 001-002

```text
Caller
  │
  │ GET /api/openai
  ▼
route.ts
  │
  │ hard-coded prompt
  ▼
OpenAI
  │
  ▼
response
```

The route decided what OpenAI would receive.

For example:

```ts
input: "Reply with exactly: OpenAI connection successful.";
```

Every request sent the same input.

---

## Now — 001-003

```text
Caller
  │
  │ POST /api/openai
  │
  │ {"prompt":"What is 2 + 2?"}
  ▼
route.ts
  │
  ▼
request.json()
  │
  ▼
body.prompt
  │
  ▼
runtime validation
  │
  ▼
OpenAI
  │
  ▼
response.output_text
  │
  ▼
JSON response
  │
  ▼
Caller
```

Now the route does not decide the question.

The caller does.

That is the key idea of this lesson.

---

# 4. Why Change GET to POST?

In `001-002`, we used:

```ts
export async function GET() {
```

That made sense because the route was simply performing a fixed connectivity test.

There was no caller-provided request body.

In `001-003`, however, the caller needs to send data:

```json
{
  "prompt": "Explain what an LLM is in one sentence."
}
```

For this lesson, we send that data in an HTTP request body.

Therefore our Route Handler becomes:

```ts
export async function POST(request: Request) {
```

This gives us access to the incoming request.

---

# 5. The Request Object

Our handler now receives:

```ts
request: Request;
```

So:

```ts
export async function POST(request: Request) {
```

means:

```text
POST request arrives
        ↓
Next.js calls POST()
        ↓
request represents the incoming HTTP request
```

The caller may send information such as:

```text
HTTP method
headers
body
```

For this lesson, the important part is the body.

---

# 6. The JSON Request Body

Our caller sends:

```json
{
  "prompt": "What is 2 + 2?"
}
```

We read it with:

```ts
await request.json();
```

So this:

```ts
const body = (await request.json()) as PromptRequest;
```

turns the incoming JSON body into a JavaScript value we can work with.

Conceptually:

```text
HTTP request body

{"prompt":"What is 2 + 2?"}

          ↓

request.json()

          ↓

JavaScript object

{
  prompt: "What is 2 + 2?"
}
```

Because parsing the request body is asynchronous, we use:

```ts
await;
```

---

# 7. Defining the Expected Request Shape

At the top of `route.ts`, we added:

```ts
type PromptRequest = {
  prompt: string;
};
```

This describes the shape we expect:

```text
PromptRequest
└── prompt
    └── string
```

For example:

```ts
const requestBody: PromptRequest = {
  prompt: "What is an LLM?",
};
```

TypeScript understands that:

```ts
requestBody.prompt;
```

should be a string.

This gives us useful development-time type information.

---

# 8. Why We Don't Need `as string`

After parsing the request, we write:

```ts
const body = (await request.json()) as PromptRequest;
const prompt = body.prompt;
```

We do **not** need:

```ts
const prompt = body.prompt as string;
```

Why?

Because we already told TypeScript that `body` has the type:

```ts
PromptRequest;
```

and `PromptRequest` defines:

```ts
prompt: string;
```

Therefore TypeScript already infers:

```ts
const prompt: string;
```

Conceptually:

```text
body
 ↓
PromptRequest
 ↓
body.prompt
 ↓
string
```

Adding another:

```ts
as string
```

would be redundant.

---

# 9. An Important Distinction: TypeScript Is Not Runtime Validation

This is one of the most important concepts in this lesson.

Consider:

```ts
const body = (await request.json()) as PromptRequest;
```

It may look like we have guaranteed that the request contains:

```json
{
  "prompt": "some string"
}
```

But we have not.

The phrase:

```ts
as PromptRequest
```

is a **TypeScript assertion**.

It tells TypeScript:

> Treat this value as a `PromptRequest`.

It does not inspect the incoming HTTP request and force the caller to obey that type.

---

# 10. The Caller Can Still Send Bad Data

A real HTTP caller can send:

```json
{
  "prompt": 123
}
```

even though our TypeScript type says:

```ts
type PromptRequest = {
  prompt: string;
};
```

The caller could also send:

```json
{
  "prompt": ""
}
```

or:

```json
{
  "prompt": "   "
}
```

TypeScript cannot prevent those HTTP requests from reaching our server.

Why?

Because TypeScript primarily helps us while developing and compiling our own code.

The HTTP request arrives at **runtime**.

This gives us an important distinction:

```text
TypeScript type
      ↓
development / compile-time expectation


Runtime validation
      ↓
checks the actual incoming value
```

---

# 11. Runtime Validation

We therefore added:

```ts
if (typeof prompt !== "string" || !prompt.trim()) {
  return Response.json({ error: "Prompt is required." }, { status: 400 });
}
```

Let's examine this carefully.

---

# 12. Checking the Type

The first condition is:

```ts
typeof prompt !== "string";
```

Suppose the caller sends:

```json
{
  "prompt": 123
}
```

At runtime:

```ts
typeof prompt;
```

is:

```text
"number"
```

Therefore:

```ts
typeof prompt !== "string";
```

becomes:

```text
true
```

and the request is rejected.

---

# 13. Checking for Empty Input

The second condition is:

```ts
!prompt.trim();
```

Consider:

```json
{
  "prompt": ""
}
```

Calling:

```ts
prompt.trim();
```

produces:

```text
""
```

An empty string is falsy.

Therefore:

```ts
!prompt.trim();
```

becomes:

```text
true
```

and the request is rejected.

---

# 14. Why Use `trim()`?

Without `trim()`, this request contains characters:

```json
{
  "prompt": "   "
}
```

But those characters are only spaces.

Calling:

```ts
"   ".trim();
```

produces:

```text
""
```

So:

```ts
!prompt.trim();
```

also rejects whitespace-only prompts.

Our validation therefore catches:

```text
missing/non-string prompt
empty prompt
whitespace-only prompt
```

before making an OpenAI request.

---

# 15. Why the Order of the Condition Matters

Our condition is:

```ts
if (typeof prompt !== "string" || !prompt.trim()) {
```

JavaScript evaluates `||` from left to right and short-circuits when the first condition is true.

Suppose:

```ts
prompt = 123;
```

The first condition:

```ts
typeof prompt !== "string";
```

is true.

JavaScript does not need to evaluate:

```ts
prompt.trim();
```

That matters because a number does not have the string method:

```ts
trim();
```

So this ordering is useful:

```text
First:
Is it a string?
      ↓
No → reject immediately

Yes
 ↓
Then:
Does it contain meaningful text?
```

---

# 16. Returning HTTP 400

For invalid input, we return:

```ts
return Response.json({ error: "Prompt is required." }, { status: 400 });
```

The response body is:

```json
{
  "error": "Prompt is required."
}
```

and the HTTP status is:

```text
400 Bad Request
```

The important idea is that the caller sent an invalid request.

Therefore we reject it before contacting OpenAI.

Conceptually:

```text
Invalid prompt
     ↓
Validation
     ↓
400 Bad Request
     ✕
No OpenAI request
```

This is better than spending time and API usage sending obviously invalid input to the model.

---

# 17. Sending the Caller's Prompt to OpenAI

Once validation passes, we call OpenAI:

```ts
const response = await openai.responses.create({
  model: "gpt-5.6-luna",
  input: prompt,
});
```

Compare this with `001-002`.

## 001-002

```ts
input: "Reply with exactly: OpenAI connection successful.",
```

## 001-003

```ts
input: prompt,
```

That one change is central to this lesson.

Previously:

```text
route.ts decides input
```

Now:

```text
caller decides input
```

---

# 18. Where Does `prompt` Come From?

Trace the variable backward:

```ts
input: prompt;
```

Where did `prompt` come from?

```ts
const prompt = body.prompt;
```

Where did `body` come from?

```ts
const body = (await request.json()) as PromptRequest;
```

Where did `request` come from?

```ts
export async function POST(request: Request) {
```

And where did that request come from?

The caller.

Therefore:

```text
Caller
  ↓
HTTP request body
  ↓
request
  ↓
request.json()
  ↓
body
  ↓
body.prompt
  ↓
prompt
  ↓
input: prompt
  ↓
OpenAI
```

This is the complete input path.

---

# 19. Receiving the Model's Response

OpenAI returns a response object:

```ts
const response = await openai.responses.create(...)
```

For this lesson, we retrieve its generated text through:

```ts
response.output_text;
```

Then we return:

```ts
return Response.json({
  message: response.output_text,
});
```

So if OpenAI generates:

```text
2 + 2 = 4
```

our API returns:

```json
{
  "message": "2 + 2 = 4"
}
```

---

# 20. The Complete Round Trip

We can now trace the entire request.

The caller sends:

```json
{
  "prompt": "What is 2 + 2?"
}
```

The request travels through:

```text
Caller
  │
  │ POST /api/openai
  ▼
Next.js Route Handler
  │
  ▼
request.json()
  │
  ▼
{
  prompt: "What is 2 + 2?"
}
  │
  ▼
body.prompt
  │
  ▼
"What is 2 + 2?"
  │
  ▼
runtime validation
  │
  ▼
openai.responses.create()
  │
  │ input: prompt
  ▼
OpenAI
  │
  ▼
response.output_text
  │
  ▼
"2 + 2 = 4"
  │
  ▼
Response.json()
  │
  ▼
{
  "message": "2 + 2 = 4"
}
  │
  ▼
Caller
```

This is our first true:

```text
Prompt → Model → Response
```

flow.

---

# 21. The Complete `route.ts`

Our route for this lesson is:

```ts
import { openai } from "@/lib/openai/client";

type PromptRequest = {
  prompt: string;
};

/**
 * Lesson 001-003 — Prompt → Response
 *
 * PAST — 001-002 Connect OpenAI
 * --------------------------------
 * We installed the OpenAI SDK, configured OPENAI_API_KEY, created
 * a reusable server-only OpenAI client, and proved that our Next.js
 * server could successfully communicate with OpenAI.
 *
 * The previous route used:
 *
 *   GET /api/openai
 *
 * and sent a hard-coded input:
 *
 *   "Reply with exactly: OpenAI connection successful."
 *
 * That proved the connection worked, but callers could not provide
 * their own prompts yet.
 *
 * NOW — 001-003 Prompt → Response
 * --------------------------------
 * We changed the route from GET to POST so the caller can provide
 * a prompt in the JSON request body.
 *
 * The request body has this shape:
 *
 *   {
 *     "prompt": "Explain what an LLM is in one sentence."
 *   }
 *
 * The route now:
 *
 *   1. Receives the POST request.
 *   2. Reads the JSON request body.
 *   3. Extracts the caller's prompt.
 *   4. Validates that the prompt is a non-empty string.
 *   5. Sends that prompt to OpenAI.
 *   6. Reads response.output_text.
 *   7. Returns the generated response as JSON.
 *
 * This gives us the fundamental LLM interaction:
 *
 *   Prompt → Model → Response
 *
 * The important change from 001-002 is:
 *
 *   BEFORE
 *
 *   route.ts
 *     → hard-coded input
 *     → OpenAI
 *
 *   NOW
 *
 *   caller
 *     → prompt
 *     → route.ts
 *     → OpenAI
 *     → response
 *     → caller
 *
 * NEXT — 001-004 Responses API Deep Dive
 * --------------------------------
 * Once Prompt → Response works, we will examine the Responses API
 * more deeply and understand the response object and related API
 * concepts.
 *
 * Streaming, chat UI, tools, and agents still belong to later
 * lessons.
 *
 * TEST CASES
 * --------------------------------
 *
 * Prerequisite:
 *
 *   pnpm dev
 *
 * Test 1 — Send a simple prompt:
 *
 *   curl -X POST http://localhost:3000/api/openai \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Explain what an LLM is in one sentence."}'
 *
 * Expected:
 *
 *   JSON containing an answer to the prompt.
 *
 *   Example shape:
 *
 *   {"message":"An LLM is ..."}
 *
 *
 * Test 2 — Send a different prompt:
 *
 *   curl -X POST http://localhost:3000/api/openai \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"What is 2 + 2?"}'
 *
 * Expected:
 *
 *   JSON containing an answer to the new prompt.
 *
 *   Example shape:
 *
 *   {"message":"4"}
 *
 * The important observation is that changing the request prompt
 * changes what OpenAI is asked to answer. route.ts no longer
 * decides the prompt; the caller does.
 *
 *
 * Test 3 — Reject an empty prompt:
 *
 *   curl -i -X POST http://localhost:3000/api/openai \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":""}'
 *
 * Expected HTTP status:
 *
 *   400 Bad Request
 *
 * Expected JSON:
 *
 *   {"error":"Prompt is required."}
 *
 *
 * Test 4 — Reject a whitespace-only prompt:
 *
 *   curl -i -X POST http://localhost:3000/api/openai \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"   "}'
 *
 * Expected HTTP status:
 *
 *   400 Bad Request
 *
 * Expected JSON:
 *
 *   {"error":"Prompt is required."}
 *
 *
 * Test 5 — Reject a non-string prompt:
 *
 *   curl -i -X POST http://localhost:3000/api/openai \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":123}'
 *
 * Expected HTTP status:
 *
 *   400 Bad Request
 *
 * Expected JSON:
 *
 *   {"error":"Prompt is required."}
 *
 *
 * Together these tests verify:
 *
 *   caller prompt
 *     → POST /api/openai
 *     → request.json()
 *     → runtime validation
 *     → prompt
 *     → OpenAI Responses API
 *     → response.output_text
 *     → JSON returned to the caller
 *
 * They also verify that invalid prompts are rejected before an
 * unnecessary OpenAI API request is made.
 */

export async function POST(request: Request) {
  // Read the JSON body sent by the caller.
  //
  // `PromptRequest` helps TypeScript understand the shape we expect
  // while developing, but a TypeScript type does not validate data
  // arriving over HTTP at runtime.
  const body = (await request.json()) as PromptRequest;

  const prompt = body.prompt;

  // Validate the actual runtime value before calling OpenAI.
  //
  // This rejects:
  //   - missing prompt values
  //   - non-string prompt values
  //   - empty strings
  //   - whitespace-only strings
  if (typeof prompt !== "string" || !prompt.trim()) {
    return Response.json({ error: "Prompt is required." }, { status: 400 });
  }

  // In 001-002, `input` was hard-coded inside route.ts.
  //
  // In 001-003, `input` comes from the caller:
  //
  //   request
  //     → request.json()
  //     → body.prompt
  //     → prompt
  //     → OpenAI
  //
  // This is the key change that gives us Prompt → Response.
  const response = await openai.responses.create({
    model: "gpt-5.6-luna",
    input: prompt,
  });

  // `output_text` gives us the generated text returned by the model.
  //
  // We send that text back to the caller as JSON, completing:
  //
  //   caller prompt
  //     → model
  //     → generated response
  //     → caller
  return Response.json({
    message: response.output_text,
  });
}
```

---

# 22. Test 1 — A Simple Prompt

With the development server running:

```bash
pnpm dev
```

we tested:

```bash
curl -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Explain what an LLM is in one sentence."}'
```

The server returned:

```json
{
  "message": "A large language model (LLM) is an AI system trained on vast amounts of text to understand and generate human-like language."
}
```

This proved that caller-provided input successfully reached the model.

---

# 23. Test 2 — Change the Prompt

Next we sent:

```bash
curl -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is 2 + 2?"}'
```

The response was:

```json
{
  "message": "2 + 2 = 4"
}
```

This is an important test.

We changed only the caller's request.

The route remained the same.

Yet the model answered a completely different question.

That proves:

```text
route.ts no longer owns the prompt
              ↓
        the caller does
```

---

# 24. Test 3 — Empty Prompt

We tested:

```bash
curl -i -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt":""}'
```

The server returned:

```text
HTTP/1.1 400 Bad Request
```

with:

```json
{
  "error": "Prompt is required."
}
```

This verifies the empty-string validation path.

---

# 25. Test 4 — Whitespace-Only Prompt

We tested:

```bash
curl -i -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt":"   "}'
```

Again:

```text
HTTP/1.1 400 Bad Request
```

with:

```json
{
  "error": "Prompt is required."
}
```

This proves that:

```ts
prompt.trim();
```

correctly treats whitespace-only input as empty.

---

# 26. Test 5 — Wrong Runtime Type

Finally, we deliberately violated our TypeScript expectation:

```bash
curl -i -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt":123}'
```

Even though our source code says:

```ts
type PromptRequest = {
  prompt: string;
};
```

the HTTP caller successfully sent:

```json
{
  "prompt": 123
}
```

Our server then returned:

```text
HTTP/1.1 400 Bad Request
```

with:

```json
{
  "error": "Prompt is required."
}
```

This is direct evidence of the distinction between:

```text
TypeScript expectation
        vs.
runtime reality
```

---

# 27. Why This Test Is Especially Important

It is tempting to see:

```ts
as PromptRequest
```

and think:

```text
"The request is now guaranteed to be a PromptRequest."
```

It is not.

A better mental model is:

```text
as PromptRequest

means

"TypeScript, treat this value as PromptRequest."
```

It does not mean:

```text
"JavaScript, verify that this HTTP request really is a PromptRequest."
```

Our runtime condition performs the actual check:

```ts
typeof prompt !== "string";
```

This distinction becomes increasingly important as applications accept more complex external input.

---

# 28. Why Validate Before Calling OpenAI?

Consider this flow:

```text
bad request
   ↓
OpenAI API call
   ↓
model processing
   ↓
error handling
```

There is no reason to involve the model if we already know the request is invalid.

Instead:

```text
bad request
   ↓
local validation
   ↓
400 Bad Request
```

This is simpler and avoids an unnecessary model request.

Our successful path remains:

```text
valid request
   ↓
local validation
   ↓
OpenAI
   ↓
response
```

---

# 29. The OpenAI Client Is Still Server-Only

Nothing in this lesson changes the security boundary established in `001-002`.

Our reusable client remains in:

```text
src/lib/openai/client.ts
```

and is imported with:

```ts
import { openai } from "@/lib/openai/client";
```

The OpenAI API key remains in:

```text
.env.local
```

The caller sends only:

```json
{
  "prompt": "..."
}
```

The caller does **not** receive the API key.

Conceptually:

```text
Caller
  │
  │ prompt
  ▼
Next.js server
  │
  ├── OPENAI_API_KEY
  │
  ▼
OpenAI
```

The secret stays on the server.

---

# 30. Why We Still Use a Route Handler

We could imagine calling an AI API directly from browser code.

But then we would have to think very carefully about secrets and trust boundaries.

Our architecture keeps the OpenAI call on the server:

```text
Browser / curl / future UI
          ↓
      our API route
          ↓
    server-only client
          ↓
        OpenAI
```

This gives our application a server boundary where we can perform tasks such as:

```text
validation
authentication
authorization
rate limiting
logging
tool execution
agent orchestration
```

Some of those belong to much later lessons.

For now, we only need validation and the OpenAI request.

---

# 31. Why We Are Still Using `curl`

At this point, we do not need a chat interface.

Using `curl` lets us focus entirely on the server-side concept:

```text
Prompt → Response
```

without introducing:

```text
forms
React state
event handlers
loading states
streaming UI
chat history
```

Those concepts would distract from the purpose of this lesson.

The course intentionally adds complexity one layer at a time.

---

# 32. What `curl` Is Acting As

In these tests, `curl` is simply our caller.

For example:

```bash
curl -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is 2 + 2?"}'
```

Conceptually:

```text
curl
 ↓
caller
 ↓
HTTP POST request
 ↓
our Next.js API
```

Later, a browser UI can become the caller.

The server-side Prompt → Response pipeline can remain conceptually similar.

---

# 33. Understanding the `curl` Command

Let's break it down.

## `curl`

```bash
curl
```

makes an HTTP request.

## `-X POST`

```bash
-X POST
```

specifies the HTTP method.

## URL

```text
http://localhost:3000/api/openai
```

targets our Next.js Route Handler.

## Content-Type

```bash
-H "Content-Type: application/json"
```

tells the server that the request body contains JSON.

## Data

```bash
-d '{"prompt":"What is 2 + 2?"}'
```

sends the JSON body.

Together:

```text
curl
  ↓
POST
  ↓
/api/openai
  ↓
JSON body
  ↓
prompt
```

---

# 34. What Was the `%` After Our Responses?

Our terminal displayed output such as:

```text
{"message":"2 + 2 = 4"}%
```

The `%` was not part of the JSON returned by our API.

It was the shell indicating that the output did not end with a newline.

The actual response was:

```json
{
  "message": "2 + 2 = 4"
}
```

This distinction is useful when reading command-line HTTP responses.

---

# 35. Validation Path vs Model Path

Our route now has two major execution paths.

## Invalid prompt

```text
POST request
    ↓
request.json()
    ↓
prompt
    ↓
validation
    ↓
INVALID
    ↓
400 Bad Request
```

OpenAI is never called.

## Valid prompt

```text
POST request
    ↓
request.json()
    ↓
prompt
    ↓
validation
    ↓
VALID
    ↓
OpenAI
    ↓
output_text
    ↓
200 JSON response
```

This is our first meaningful branch in the OpenAI request pipeline.

---

# 36. What Happens at `return`?

Consider:

```ts
if (typeof prompt !== "string" || !prompt.trim()) {
  return Response.json({ error: "Prompt is required." }, { status: 400 });
}
```

The keyword:

```ts
return;
```

ends execution of the handler for that request.

So when validation fails, execution does not continue to:

```ts
openai.responses.create(...)
```

Conceptually:

```text
invalid prompt
     ↓
return 400
     ↓
function ends
     ✕
OpenAI call never reached
```

That is why the validation protects the model call.

---

# 37. Why `await` Appears Twice

Our handler contains two important asynchronous operations.

First:

```ts
await request.json();
```

We wait for the request body to be read and parsed.

Second:

```ts
await openai.responses.create(...)
```

We wait for OpenAI to return a response.

So:

```text
POST request
    ↓
await request.json()
    ↓
prompt
    ↓
await OpenAI
    ↓
response
```

Both operations require waiting for work that is not completed immediately.

---

# 38. What We Are Not Building Yet

This lesson intentionally does **not** add:

```text
streaming
chat UI
conversation history
tool calling
agent loops
RAG
LangGraph
MCP
evaluation
```

Those concepts belong to later lessons.

We are also not turning this route into a large abstraction layer.

The goal of `001-003` is narrow:

> Accept a caller-provided prompt and return the model's response.

That is enough.

---

# 39. Why This Small Step Matters

At first glance, replacing:

```ts
input: "hard-coded text";
```

with:

```ts
input: prompt;
```

may look trivial.

Architecturally, however, it changes the application from:

```text
fixed OpenAI connectivity test
```

into:

```text
general prompt-processing endpoint
```

The caller can now ask:

```text
Explain an LLM.
```

or:

```text
What is 2 + 2?
```

or another valid prompt without modifying `route.ts`.

That is the beginning of an actual LLM application.

---

# 40. The Mental Model to Remember

If you remember only one diagram from this lesson, remember:

```text
CALLER
  │
  │ prompt
  ▼
POST /api/openai
  │
  ▼
request.json()
  │
  ▼
body.prompt
  │
  ▼
runtime validation
  │
  ├── invalid → 400
  │
  └── valid
        ↓
      OpenAI
        ↓
 response.output_text
        ↓
   JSON response
        ↓
      CALLER
```

Or even more simply:

```text
Prompt → Model → Response
```

---

# 41. What We Learned

In this lesson, we learned how to:

- change our OpenAI endpoint from `GET` to `POST`,
- receive an incoming `Request`,
- read JSON with `request.json()`,
- define an expected request shape with TypeScript,
- extract `body.prompt`,
- understand why `as PromptRequest` is not runtime validation,
- validate that the real prompt is a non-empty string,
- reject invalid input with HTTP `400`,
- pass caller-provided input to OpenAI,
- retrieve generated text with `response.output_text`,
- and return the generated response as JSON.

Most importantly, we moved from:

```text
hard-coded OpenAI test
```

to:

```text
caller-controlled Prompt → Response
```

---

# 42. Verification

We verified the lesson with five functional tests:

```text
Test 1 — Simple prompt             PASS
Test 2 — Different prompt          PASS
Test 3 — Empty prompt              PASS
Test 4 — Whitespace-only prompt    PASS
Test 5 — Non-string prompt         PASS
```

We also verified the project with:

```bash
pnpm lint
```

which passed.

And:

```bash
pnpm build
```

which completed successfully.

The production build identified:

```text
ƒ /api/openai
```

as a dynamic server-rendered route.

---

# 43. Lesson Infographic

The visual companion for this lesson is:

```text
resources/infographics/001-llms/001-003-prompt-response.png
```

It summarizes the evolution from the fixed connectivity test in `001-002` to the caller-controlled Prompt → Response pipeline in `001-003`.

---

# 44. Final Architecture

At the end of `001-003`, our relevant architecture is:

```text
learn-ai-agents/
│
├── .env.local
│      └── OPENAI_API_KEY
│
├── src/
│   ├── app/
│   │   └── api/
│   │       └── openai/
│   │           └── route.ts
│   │
│   └── lib/
│       └── openai/
│           └── client.ts
│
└── resources/
    ├── infographics/
    │   └── 001-llms/
    │       └── 001-003-prompt-response.png
    │
    └── lessons/
        └── 001-llms/
            └── 001-003-prompt-response.md
```

And the runtime architecture is:

```text
Caller
  ↓
POST /api/openai
  ↓
Prompt validation
  ↓
server-only OpenAI client
  ↓
OpenAI Responses API
  ↓
response.output_text
  ↓
JSON
  ↓
Caller
```

---

# 45. Next Lesson

Next:

```text
001-004 — Responses API Deep Dive
```

We now know that this works:

```ts
const response = await openai.responses.create({
  model: "gpt-5.6-luna",
  input: prompt,
});
```

and:

```ts
response.output_text;
```

gives us the text we need.

But what exactly is:

```ts
response;
```

What else does the Responses API return?

How is the response structured?

Those questions belong to the next lesson.

For now, our goal is complete:

```text
Prompt → Model → Response
```

**Lesson 001-003 complete.**
