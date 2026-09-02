# Lesson 001-005 — Streaming

> **Section:** 001 — LLMs
>
> **Project:** Learn AI Agents
>
> **Publisher:** Thunkx
>
> **Tagline:** Learn by building.

---

## What We Are Building

In the previous lesson, our application sent a prompt to the OpenAI Responses API and waited for the complete response before returning anything to the caller.

In this lesson, we change that behavior.

Instead of waiting for the entire model response, we will stream generated text progressively as OpenAI produces it.

By the end of this lesson, our request flow will be:

```text
Caller
  ↓
POST /api/openai
  ↓
Runtime validation
  ↓
OpenAI Responses API
  ↓
stream: true
  ↓
OpenAI event stream
  ↓
response.output_text.delta
  ↓
event.delta
  ↓
TextEncoder
  ↓
controller.enqueue(...)
  ↓
ReadableStream
  ↓
HTTP response
  ↓
Caller receives text progressively
```

This lesson introduces an important foundation for the chat UI we will build in Lesson 001-006.

---

# 1. Where We Left Off

In Lesson 001-004, we called:

```ts
const response = await openai.responses.create({
  model: "gpt-5.6-luna",
  input: prompt,
});
```

OpenAI generated the entire response before our application returned the result.

We could then inspect properties such as:

```text
response.id
response.status
response.model
response.output
response.output_text
response.usage
```

Our application eventually returned JSON containing selected information from the completed Response.

Conceptually:

```text
Caller
  ↓
POST /api/openai
  ↓
OpenAI
  ↓
wait...
  ↓
wait...
  ↓
wait...
  ↓
Complete Response
  ↓
Return JSON
```

This works, but it means the caller sees nothing while the model is generating its answer.

For a short response, that may not feel significant.

For a longer response, however, the user may wait several seconds before seeing anything.

Streaming changes that experience.

---

# 2. What Is Streaming?

Streaming means we do not wait for the entire generated answer before sending data to the caller.

Instead, pieces of generated text can be forwarded as they become available.

Conceptually, instead of:

```text
wait
wait
wait

"An AI agent is a software system..."
```

we can receive:

```text
"An"
" AI"
" agent"
" is"
" a"
" software"
" system"
...
```

and send those pieces onward immediately.

The caller can therefore begin processing or displaying the response before generation has completely finished.

---

# 3. Enable Streaming in the Responses API

The important change to our OpenAI request is:

```ts
stream: true;
```

Our request becomes:

```ts
const stream = await openai.responses.create({
  model: "gpt-5.6-luna",
  input: prompt,
  stream: true,
});
```

Compare the two versions.

## Before

```ts
const response = await openai.responses.create({
  model: "gpt-5.6-luna",
  input: prompt,
});
```

Conceptually:

```text
OpenAI
  ↓
complete Response object
```

## Now

```ts
const stream = await openai.responses.create({
  model: "gpt-5.6-luna",
  input: prompt,
  stream: true,
});
```

Conceptually:

```text
OpenAI
  ↓
stream of events
  ↓
event
event
event
event
...
```

This is our first major change in Lesson 001-005.

---

# 4. Inspect the OpenAI Stream First

Before building our own HTTP stream, we temporarily inspected the events OpenAI was sending.

We used:

```ts
for await (const event of stream) {
  console.log(event);
}
```

This was an important learning step.

Rather than assuming what OpenAI sends during streaming, we observed the actual event sequence.

For our test request:

```text
Explain what an AI agent is in one short sentence.
```

we observed events including:

```text
response.created

response.in_progress

response.output_item.added

response.content_part.added

response.output_text.delta

response.output_text.delta

response.output_text.delta

...

response.output_text.done

response.content_part.done

response.output_item.done

response.completed
```

This shows that an OpenAI stream contains more than just generated text.

It contains structured events describing the lifecycle of the Response.

---

# 5. The Important Event: `response.output_text.delta`

For this lesson, the event we care about most is:

```text
response.output_text.delta
```

A delta event contains another piece of generated text.

For example, we observed events similar to:

```ts
{
    type: "response.output_text.delta",
    delta: "An",
}
```

followed by:

```ts
{
    type: "response.output_text.delta",
    delta: " AI",
}
```

then:

```ts
{
    type: "response.output_text.delta",
    delta: " agent",
}
```

and so on.

Conceptually:

```text
OpenAI stream

response.output_text.delta
        ↓
      "An"

response.output_text.delta
        ↓
      " AI"

response.output_text.delta
        ↓
      " agent"

response.output_text.delta
        ↓
      " is"
```

If those pieces are appended together:

```text
"An"
+ " AI"
+ " agent"
+ " is"
```

we get:

```text
"An AI agent is"
```

---

# 6. Critical Concept: A Delta Is NOT Necessarily a Word

This is one of the most important observations in this lesson.

We must never assume:

```text
one streaming event = one word
```

A delta is simply a chunk of text.

During our actual stream inspection, OpenAI produced:

```text
Event 1
delta: " perce"
```

followed by:

```text
Event 2
delta: "ives"
```

Those two chunks combine into:

```text
" perce" + "ives"
```

which gives:

```text
" perceives"
```

So this assumption would be wrong:

```text
❌ 1 event = 1 word
```

The correct mental model is:

```text
✅ 1 event = another chunk of text
```

A chunk could contain:

```text
"An"
```

or:

```text
" AI"
```

or:

```text
" perce"
```

or:

```text
"ives"
```

or even punctuation:

```text
","
```

or:

```text
"."
```

The application should not try to guess where word boundaries are.

It should append the chunks exactly as they arrive.

---

# 7. Why This Matters for Our Future Chat UI

This detail will become extremely important in Lesson 001-006.

Our future chat UI will consume the HTTP stream and progressively render the model's answer.

Imagine the browser receives:

```text
"An"
" AI"
" agent"
" perce"
"ives"
```

The UI should effectively do:

```text
"An"
    +
" AI"
    +
" agent"
    +
" perce"
    +
"ives"
```

producing:

```text
"An AI agent perceives"
```

The UI should **not** assume each chunk represents one word.

Conceptually, our future UI will behave like:

```ts
answer += chunk;
```

The important rule is:

> Append what arrives. Do not infer word boundaries from stream events.

---

# 8. We Do Not Forward Every OpenAI Event

The OpenAI stream contains many event types.

For example:

```text
response.created
response.in_progress
response.output_item.added
response.content_part.added
response.output_text.delta
response.output_text.done
response.content_part.done
response.output_item.done
response.completed
```

But our caller does not need to understand all of these events yet.

Our Route Handler acts as an adapter.

It receives the rich OpenAI event stream and forwards only generated text.

We filter with:

```ts
if (event.type === "response.output_text.delta") {
  // forward the text
}
```

Conceptually:

```text
OpenAI event stream

response.created                  → ignore

response.in_progress              → ignore

response.output_item.added        → ignore

response.content_part.added       → ignore

response.output_text.delta        → FORWARD

response.output_text.delta        → FORWARD

response.output_text.delta        → FORWARD

response.output_text.done         → don't forward as text

response.content_part.done        → don't forward as text

response.output_item.done         → don't forward as text

response.completed                → don't forward as text
```

Our public endpoint therefore stays simple.

The caller receives plain generated text rather than OpenAI's internal event structure.

---

# 9. There Are Actually Two Streams

Another important concept is that there are **two different streams** involved.

They are not the same thing.

## Stream 1 — OpenAI Event Stream

OpenAI gives our server a sequence of structured events:

```text
OpenAI
  ↓
response.created
  ↓
response.in_progress
  ↓
response.output_text.delta
  ↓
response.output_text.delta
  ↓
...
  ↓
response.completed
```

## Stream 2 — Our HTTP Text Stream

Our Next.js Route Handler creates another stream:

```text
Next.js
  ↓
"An"
  ↓
" AI"
  ↓
" agent"
  ↓
...
  ↓
caller
```

Our Route Handler sits between them:

```text
OPENAI EVENT STREAM
        ↓
Next.js Route Handler
        ↓
HTTP TEXT STREAM
        ↓
CALLER
```

This distinction is fundamental.

OpenAI streaming does not automatically mean our caller receives streaming text.

Our server must bridge the OpenAI stream into the HTTP response stream.

---

# 10. Create a `ReadableStream`

To create our outgoing HTTP stream, we use the Web Streams API:

```ts
const textStream = new ReadableStream({
  async start(controller) {
    // streaming logic
  },
});
```

`ReadableStream` represents data that can be read progressively.

Instead of constructing the complete response body first, we can place additional chunks into the stream over time.

Conceptually:

```text
ReadableStream

empty
  ↓
enqueue chunk
  ↓
enqueue chunk
  ↓
enqueue chunk
  ↓
...
  ↓
close
```

---

# 11. Who Calls `start(controller)`?

This is an important detail.

Consider:

```ts
const textStream = new ReadableStream({
    async start(controller) {
        ...
    },
});
```

We never write:

```ts
start(controller);
```

ourselves.

So who calls it?

The **Web Streams runtime** does.

When we create:

```ts
new ReadableStream({
    async start(controller) {
        ...
    },
});
```

the Web Streams implementation initializes the stream and invokes the `start()` method.

Conceptually:

```text
Our code

new ReadableStream(...)
        ↓
Web Streams runtime
        ↓
calls start(controller)
        ↓
our streaming logic runs
```

The runtime also gives us the `controller`.

That controller becomes our handle for placing data into the stream.

---

# 12. What Is `controller`?

The controller lets our code interact with the outgoing stream.

For this lesson, the two important methods are:

```ts
controller.enqueue(...)
```

and:

```ts
controller.close();
```

Think of the controller as our way of saying:

```text
put this data into the stream
```

and eventually:

```text
the stream is finished
```

---

# 13. Why Do We Need `TextEncoder`?

OpenAI gives us:

```ts
event.delta;
```

which is a JavaScript string.

For example:

```text
" AI"
```

or:

```text
" perce"
```

Our outgoing stream needs bytes.

So we create:

```ts
const encoder = new TextEncoder();
```

and then:

```ts
encoder.encode(event.delta);
```

Conceptually:

```text
JavaScript string

" agent"
    ↓
TextEncoder
    ↓
Uint8Array / bytes
```

Those bytes can then be placed into our outgoing stream.

---

# 14. `controller.enqueue(...)`

This is the operation that sends another chunk into our outgoing stream.

Our code is:

```ts
controller.enqueue(encoder.encode(event.delta));
```

In our final implementation, it is written on one line:

```ts
controller.enqueue(encoder.encode(event.delta));
```

Suppose OpenAI sends:

```text
delta: "An"
```

We encode it:

```text
"An"
 ↓
TextEncoder
 ↓
bytes
```

and enqueue those bytes:

```text
bytes
 ↓
controller.enqueue(...)
 ↓
ReadableStream
 ↓
caller
```

Then OpenAI might send:

```text
delta: " AI"
```

and we immediately repeat the process.

Conceptually:

```text
OpenAI                    Caller

"An"
  ↓
encode
  ↓
enqueue ────────────────→ "An"


" AI"
  ↓
encode
  ↓
enqueue ────────────────→ " AI"


" agent"
  ↓
encode
  ↓
enqueue ────────────────→ " agent"
```

We are not doing this:

```ts
let answer = "";

for await (...) {
    answer += event.delta;
}

// wait until everything finishes

return answer;
```

That would defeat the purpose of streaming.

Instead, we forward each delta as soon as it arrives.

---

# 15. Consume the OpenAI Stream with `for await`

Our OpenAI stream is consumed using:

```ts
for await (const event of stream) {
    ...
}
```

This lets us asynchronously process events as OpenAI produces them.

The loop does not require all events to exist before it begins.

Conceptually:

```text
OpenAI sends event
        ↓
for await receives it
        ↓
process event
        ↓

OpenAI sends next event
        ↓
for await receives it
        ↓
process event
        ↓

...
```

Inside that loop, we filter for text deltas:

```ts
for await (const event of stream) {
  if (event.type === "response.output_text.delta") {
    controller.enqueue(encoder.encode(event.delta));
  }
}
```

This is the central bridge between the two streams.

---

# 16. Finally: `controller.close()`

Eventually OpenAI finishes generating the response.

During our inspection, we observed the final lifecycle events:

```text
response.output_text.done
        ↓
response.content_part.done
        ↓
response.output_item.done
        ↓
response.completed
```

After the OpenAI event stream finishes, our:

```ts
for await (const event of stream)
```

loop ends.

At that point, we call:

```ts
controller.close();
```

This tells the consumer:

> No more data will arrive through this stream.

Conceptually:

```text
OpenAI

response.output_text.done
        ↓
response.content_part.done
        ↓
response.output_item.done
        ↓
response.completed
        ↓
OpenAI stream ends
        ↓
for await loop ends
        ↓
controller.close()
        ↓
HTTP stream ends
        ↓
caller knows there is no more data
```

This is different from:

```ts
controller.enqueue(...)
```

`enqueue()` means:

```text
Here is another chunk.
```

`close()` means:

```text
There are no more chunks.
```

---

# 17. Return the Stream as the HTTP Response

Once we have created:

```ts
const textStream = new ReadableStream(...)
```

we return it as the body of a normal Web `Response`:

```ts
return new Response(textStream, {
  headers: {
    "Content-Type": "text/plain; charset=utf-8",
  },
});
```

Notice that we are no longer doing:

```ts
return Response.json(...)
```

for successful model responses.

That was appropriate in Lesson 001-004 because we returned a completed JSON object.

Now our successful response body is the stream itself.

Conceptually:

```text
new Response(
    textStream
)
```

means:

```text
HTTP response body
        ↓
ReadableStream
        ↓
data can arrive progressively
```

---

# 18. The Complete Streaming Bridge

We can now see the complete architecture:

```text
Caller sends prompt
        ↓
POST /api/openai
        ↓
request.json()
        ↓
runtime validation
        ↓
openai.responses.create({
    stream: true
})
        ↓
OpenAI event stream
        ↓
for await (const event of stream)
        ↓
Is this response.output_text.delta?
        │
        ├── NO
        │    ↓
        │  ignore
        │
        └── YES
             ↓
         event.delta
             ↓
         TextEncoder
             ↓
         bytes
             ↓
    controller.enqueue(...)
             ↓
       ReadableStream
             ↓
       HTTP Response
             ↓
           caller

Eventually:

OpenAI stream ends
        ↓
for await ends
        ↓
controller.close()
        ↓
HTTP stream ends
```

---

# 19. Final Route Handler

Our completed Lesson 001-005 implementation is:

```ts
import { openai } from "@/lib/openai/client";

type PromptRequest = {
  prompt: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as PromptRequest;

  const prompt = body.prompt;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return Response.json({ error: "Prompt is required." }, { status: 400 });
  }

  const stream = await openai.responses.create({
    model: "gpt-5.6-luna",
    input: prompt,
    stream: true,
  });

  const textStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      for await (const event of stream) {
        if (event.type === "response.output_text.delta") {
          controller.enqueue(encoder.encode(event.delta));
        }
      }

      controller.close();
    },
  });

  return new Response(textStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
```

The actual source file also contains the detailed `PAST`, `NOW`, `NEXT`, and `TEST CASES` teaching comments used throughout this course.

---

# 20. Test Streaming with `curl -N`

Run the development server:

```bash
pnpm dev
```

Then, in another terminal:

```bash
curl -N -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Explain what an AI agent is in three short sentences."}'
```

We observed a response similar to:

```text
An AI agent is a software system that perceives its environment and makes decisions to achieve a goal.
It can reason, use tools, and take actions with varying degrees of autonomy.
Examples include virtual assistants, recommendation systems, and robots.
```

The important part of this test is not the exact wording.

The important behavior is that text can arrive progressively instead of requiring the entire generated answer to be available first.

---

# 21. Why `curl -N`?

The `-N` option tells curl not to buffer the output.

Without it, curl may buffer incoming data before displaying it, which can make a correctly streaming server appear as though it is returning everything at once.

For this lesson:

```bash
curl -N
```

makes it easier to observe the progressive response.

Conceptually:

```text
Server sends chunk
       ↓
curl -N
       ↓
display it now
```

rather than potentially waiting for additional buffered output.

---

# 22. Test Runtime Validation

Streaming changed the successful response path, but our existing validation should continue working.

We verified several invalid inputs.

---

## Test — Empty Prompt

```bash
curl -i -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt":""}'
```

Expected:

```text
HTTP/1.1 400 Bad Request
```

with:

```json
{ "error": "Prompt is required." }
```

This passed.

---

## Test — Whitespace-Only Prompt

```bash
curl -i -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt":"   "}'
```

Expected:

```text
HTTP/1.1 400 Bad Request
```

with:

```json
{ "error": "Prompt is required." }
```

This passed.

---

## Test — Non-String Prompt

```bash
curl -i -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt":123}'
```

Expected:

```text
HTTP/1.1 400 Bad Request
```

with:

```json
{ "error": "Prompt is required." }
```

This passed.

---

# 23. Why Validation Still Happens Before OpenAI

Our validation remains:

```ts
if (typeof prompt !== "string" || !prompt.trim()) {
  return Response.json({ error: "Prompt is required." }, { status: 400 });
}
```

Only after validation do we call:

```ts
openai.responses.create(...)
```

This ordering matters.

Conceptually:

```text
incoming request
      ↓
validate
      │
      ├── invalid
      │      ↓
      │   HTTP 400
      │
      └── valid
             ↓
          OpenAI
```

We do not want to make unnecessary OpenAI requests for obviously invalid input.

---

# 24. Successful and Invalid Requests Now Have Different Response Types

There is an interesting consequence of our design.

A successful request returns:

```text
Content-Type: text/plain; charset=utf-8
```

with a streaming body.

An invalid request returns:

```text
Content-Type: application/json
```

with:

```json
{ "error": "Prompt is required." }
```

That is intentional.

Conceptually:

```text
POST /api/openai
      ↓
validation
      │
      ├── invalid
      │      ↓
      │   JSON error
      │   HTTP 400
      │
      └── valid
             ↓
        text stream
        HTTP 200
```

Our future chat UI will need to distinguish successful streaming responses from errors.

We will address that when we build the UI.

---

# 25. What Streaming Does NOT Mean

It is useful to clarify several things that streaming does not mean.

## Streaming Does Not Mean One Event Per Word

Wrong:

```text
event 1 = word 1
event 2 = word 2
event 3 = word 3
```

Actual behavior may look like:

```text
event 1 = " perce"
event 2 = "ives"
```

Again:

> A streaming delta is a chunk of text, not a word.

---

## Streaming Does Not Mean We Cache the Model Response

Our project has:

```ts
cacheComponents: true;
```

enabled as part of the Next.js foundation.

That does not mean our live model generation should be cached.

The OpenAI request depends on user input and generates a dynamic response.

For this lesson, it remains dynamic.

---

## Streaming Does Not Mean Suspense Is Producing the Tokens

React Suspense and LLM streaming solve different problems.

Our streaming mechanism in this lesson is:

```text
OpenAI stream
   ↓
ReadableStream
   ↓
HTTP
```

It is not:

```text
Suspense
   ↓
LLM tokens
```

We will discuss these concepts more carefully when we build the UI.

---

# 26. What About Loading Skeletons?

There is no chat UI in Lesson 001-005.

Therefore, adding a loading skeleton here would be artificial.

In Lesson 001-006, the browser will submit a prompt and consume this stream.

That gives us a natural place for UI states such as:

```text
user submits prompt
        ↓
show generating/loading state
        ↓
first streamed text arrives
        ↓
render text progressively
        ↓
stream finishes
```

A loading skeleton or generating indicator belongs to that UI lesson.

---

# 27. Cache Components, Suspense, and LLM Streaming

These concepts are related to modern Next.js applications, but they are not interchangeable.

A useful mental model is:

```text
Cache Components
    ↓
cacheable rendering/data boundaries


Suspense
    ↓
React async rendering boundaries


Loading / skeleton UI
    ↓
user experience while waiting


OpenAI streaming
    ↓
progressive model generation


ReadableStream
    ↓
transport generated data progressively


Client chat state
    ↓
display those chunks as they arrive
```

Our project already has:

```ts
cacheComponents: true;
```

enabled.

But we intentionally do not cache live user-specific model generation.

And we do not introduce Suspense merely to make the AI stream work.

Lesson 001-006 will give us an actual browser UI where we can discuss which of these mechanisms belongs where.

---

# 28. Why This Lesson Matters for the Chat UI

Before this lesson, our browser would have had to behave like:

```text
Submit prompt
    ↓
wait
    ↓
wait
    ↓
wait
    ↓
receive complete answer
    ↓
display answer
```

After Lesson 001-005, the server can support:

```text
Submit prompt
    ↓
OpenAI begins generating
    ↓
first chunk
    ↓
display
    ↓
next chunk
    ↓
append
    ↓
next chunk
    ↓
append
    ↓
...
    ↓
stream complete
```

So Lesson 001-005 provides the transport foundation for Lesson 001-006.

---

# 29. The Most Important Mental Model

If you remember only one diagram from this lesson, remember this:

```text
              OPENAI
                 │
          stream: true
                 │
                 ▼
        OpenAI Event Stream
                 │
                 ▼
          for await (...)
                 │
                 ▼
 response.output_text.delta
                 │
                 ▼
            event.delta
                 │
                 ▼
            TextEncoder
                 │
                 ▼
       controller.enqueue()
                 │
                 ▼
          ReadableStream
                 │
                 ▼
          HTTP Response
                 │
                 ▼
              CALLER
```

And remember:

```text
OpenAI Event Stream ≠ HTTP Stream
```

Our Route Handler bridges the two.

---

# 30. Six Key Concepts from 001-005

### 1. OpenAI and HTTP are two different streams

```text
OpenAI stream
    ↓
our server
    ↓
HTTP stream
```

Our Route Handler bridges them.

### 2. A delta is a chunk, not necessarily a word

```text
" perce" + "ives"
```

becomes:

```text
" perceives"
```

Never assume:

```text
one event = one word
```

### 3. `start(controller)` is called by the Web Streams runtime

We create:

```ts
new ReadableStream(...)
```

and the Web Streams implementation invokes:

```ts
start(controller);
```

We do not call it ourselves.

### 4. `TextEncoder` converts strings to bytes

```text
event.delta
    ↓
TextEncoder
    ↓
bytes
```

### 5. `controller.enqueue()` forwards another chunk

```text
bytes
    ↓
controller.enqueue(...)
    ↓
caller can receive them
```

### 6. `controller.close()` ends our outgoing stream

When the OpenAI stream finishes:

```text
response.output_text.done
response.content_part.done
response.output_item.done
response.completed
```

the async iteration ends and we call:

```ts
controller.close();
```

That tells the caller:

```text
No more data will arrive.
```

---

# 31. Quality Checks

We ran:

```bash
pnpm lint
```

Result:

```text
passed
```

We also ran:

```bash
pnpm build
```

The production build completed successfully with:

```text
Next.js 16.3.4
Cache Components enabled
Compiled successfully
TypeScript completed
12/12 static pages generated
```

The API route remained dynamic:

```text
ƒ /api/openai
```

while the course pages remained statically prerendered where appropriate.

This is consistent with our architecture:

```text
course pages
    ↓
static where appropriate

/api/openai
    ↓
dynamic
    ↓
user-specific OpenAI generation
```

---

# 32. What We Achieved

In Lesson 001-005, we:

- enabled OpenAI Responses API streaming with `stream: true`
- inspected the actual OpenAI streaming event lifecycle
- consumed the OpenAI stream with `for await`
- identified `response.output_text.delta`
- learned that a delta is not necessarily a complete word
- created an outgoing Web `ReadableStream`
- learned who calls `start(controller)`
- converted JavaScript strings to bytes with `TextEncoder`
- forwarded chunks with `controller.enqueue()`
- closed the outgoing stream with `controller.close()`
- bridged the OpenAI event stream to an HTTP text stream
- tested progressive output using `curl -N`
- preserved runtime validation for invalid prompts
- passed ESLint
- passed the production build

Most importantly, we now have the server-side streaming foundation required for a real chat interface.

---

# 33. Next — Lesson 001-006: Simple LLM Chat UI

Our API can now stream generated text.

But our consumer is still:

```text
curl -N
```

In the next lesson, we replace that command-line consumer with a browser interface.

Conceptually:

```text
001-005

OpenAI
   ↓
Next.js streaming API
   ↓
curl -N
```

becomes:

```text
001-006

OpenAI
   ↓
Next.js streaming API
   ↓
React chat UI
   ↓
progressively rendered answer
```

That will give us a natural reason to explore:

```text
prompt input
submit behavior
client-side stream consumption
generating/loading state
loading skeleton
progressive text rendering
error state
Server vs Client Components
Suspense
Cache Components
```

while keeping one architectural rule clear:

> Live user-specific LLM generation remains dynamic and should not be cached merely because Cache Components is enabled.

---

## Final Takeaway

Before this lesson:

```text
Prompt
  ↓
OpenAI
  ↓
wait for everything
  ↓
complete response
```

After this lesson:

```text
Prompt
  ↓
OpenAI stream
  ↓
text delta
  ↓
text delta
  ↓
text delta
  ↓
Next.js ReadableStream
  ↓
caller receives text progressively
```

And the detail we should carry directly into the next lesson is:

```text
" perce" + "ives" → " perceives"
```

**Never assume one streaming event equals one word.**

Append each chunk exactly as it arrives.

That is the foundation we will use to build the Simple LLM Chat UI.
