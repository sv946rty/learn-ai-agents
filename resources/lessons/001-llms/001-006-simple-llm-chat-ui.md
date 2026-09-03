# Lesson 001-006 — Simple LLM Chat UI

## Goal

In the previous lessons, we built the server-side foundation for calling OpenAI and streaming model output.

In this lesson, we connect that backend stream to a real browser UI.

By the end of the lesson, the application can:

1. Accept a prompt in the browser.
2. Send the prompt to `/api/openai`.
3. Show a waiting state while the model prepares its response.
4. Detect when the first HTTP chunk arrives.
5. Decode streamed bytes into text.
6. Append each chunk progressively to the UI.
7. Return the interface to its ready state when streaming finishes.

The complete flow is:

```text
Browser
   ↓
fetch("/api/openai")
   ↓
Next.js Route Handler
   ↓
OpenAI Responses API
   ↓
response.output_text.delta
   ↓
TextEncoder
   ↓
HTTP byte stream
   ↓
response.body
   ↓
getReader()
   ↓
reader.read()
   ↓
TextDecoder
   ↓
React state
   ↓
Progressive UI
```

---

# 1. Where We Started

At the end of Lesson 001-005, the server already streamed model output.

Our Route Handler essentially performed this transformation:

```text
OpenAI
   ↓
response.output_text.delta
   ↓
string
   ↓
TextEncoder
   ↓
bytes
   ↓
ReadableStream
   ↓
HTTP response
```

We tested that stream using:

```bash
curl -N
```

For example:

```bash
curl -N \
  -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Explain what an AI agent is in three short sentences."}'
```

`curl -N` allowed us to observe text arriving progressively instead of waiting for the complete response.

But we still did not have a browser interface capable of consuming that stream.

Lesson 001-006 completes the other half.

---

# 2. The Browser Becomes a Stream Consumer

The browser sends the prompt using `fetch()`:

```ts
const response = await fetch("/api/openai", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ prompt }),
});
```

At first glance this resembles an ordinary API request.

The important difference is what we do with the response.

We do **not** call:

```ts
await response.text();
```

That would conceptually treat the response as something we want to consume as a completed value.

Instead, we access:

```ts
response.body;
```

`response.body` is a `ReadableStream`.

That allows the browser to process the response progressively.

---

# 3. Getting a Stream Reader

First we verify that a response body exists:

```ts
if (!response.body) {
  throw new Error("Response body is missing.");
}
```

Then we acquire a reader:

```ts
const reader = response.body.getReader();
```

Conceptually:

```text
HTTP Response
      ↓
response.body
      ↓
ReadableStream
      ↓
getReader()
      ↓
reader
```

`getReader()` does **not** download the complete response.

It gives us an object that lets us ask the stream for data as data becomes available.

---

# 4. Reading One Chunk at a Time

We repeatedly call:

```ts
const { done, value } = await reader.read();
```

The result contains two important values.

```text
done
value
```

`value` normally contains a `Uint8Array` of bytes.

`done` tells us whether the stream has ended.

Therefore our basic loop becomes:

```ts
while (true) {
  const { done, value } = await reader.read();

  if (done) break;

  // Process value...
}
```

Conceptually:

```text
reader.read()
     ↓
{ done, value }
     ↓
value = Uint8Array
     ↓
process bytes
     ↓
reader.read()
     ↓
next chunk
     ↓
...
     ↓
done = true
```

This is the browser-side equivalent of the asynchronous streaming loop we used on the server.

---

# 5. TextEncoder on the Server, TextDecoder in the Browser

Lesson 001-005 used:

```ts
const encoder = new TextEncoder();
```

The server converted text into bytes:

```text
string
   ↓
TextEncoder
   ↓
Uint8Array
```

For example, conceptually:

```text
"Hello"
   ↓
TextEncoder
   ↓
bytes
```

The browser performs the inverse operation.

We create:

```ts
const decoder = new TextDecoder();
```

Then:

```ts
const chunk = decoder.decode(value, {
  stream: true,
});
```

Now the flow becomes:

```text
SERVER

OpenAI text
   ↓
TextEncoder
   ↓
bytes
   ↓
HTTP


BROWSER

HTTP
   ↓
bytes
   ↓
TextDecoder
   ↓
text
```

Together:

```text
string
  ↓
TextEncoder
  ↓
bytes
  ↓
HTTP
  ↓
bytes
  ↓
TextDecoder
  ↓
string
```

This encoder/decoder relationship is one of the key concepts of Lessons 001-005 and 001-006.

---

# 6. Why `stream: true` Matters to TextDecoder

We decode each received byte chunk using:

```ts
decoder.decode(value, {
  stream: true,
});
```

Why not simply:

```ts
decoder.decode(value);
```

Because HTTP chunk boundaries do not have to align perfectly with encoded character boundaries.

A multi-byte UTF-8 character could theoretically be divided across two reads.

Using:

```ts
{
  stream: true;
}
```

tells `TextDecoder`:

> More bytes may still be coming. Preserve any incomplete character data for the next decode operation.

When the HTTP stream finishes, we flush the decoder:

```ts
const finalChunk = decoder.decode();
```

If anything remains:

```ts
if (finalChunk) {
  setAnswer((current) => current + finalChunk);
}
```

This gives us a robust streaming decoder.

---

# 7. A Chunk Is Not a Word

This is one of the most important lessons from our streaming experiments.

During Lesson 001-005 we observed OpenAI produce deltas similar to:

```text
" perce"
```

followed by:

```text
"ives"
```

Together they form:

```text
" perceives"
```

Therefore we must never assume:

```text
one OpenAI event = one word
```

We also cannot assume:

```text
one HTTP chunk = one OpenAI event
```

or:

```text
one reader.read() = one token
```

These are different boundaries.

The complete system contains several layers:

```text
Model generation
      ↓
OpenAI streaming events
      ↓
our server ReadableStream
      ↓
HTTP/network transport
      ↓
browser ReadableStream
      ↓
reader.read()
```

The network/runtime may combine or split data differently from the original OpenAI events.

Therefore the correct browser behavior is simply:

```ts
setAnswer((current) => current + chunk);
```

Append exactly what arrives.

Do not add spaces.

Do not split by spaces.

Do not assume a chunk represents a word.

---

# 8. Why We Use the Functional State Update

We update the answer with:

```ts
setAnswer((current) => current + chunk);
```

rather than:

```ts
setAnswer(answer + chunk);
```

Streaming causes many state updates over time.

The functional form gives React the latest state value for each update:

```text
current answer
     +
new chunk
     ↓
new answer
```

For example:

```text
current = "A Promise"
chunk   = " represents"

result  = "A Promise represents"
```

Then another chunk arrives:

```text
current = "A Promise represents"
chunk   = " a future"

result  = "A Promise represents a future"
```

This avoids relying on a potentially stale `answer` value captured by the asynchronous function.

---

# 9. Three UI Phases

While testing the application, we noticed something important.

The model could take a significant amount of time before the first visible response arrived.

Originally the UI changed the button from:

```text
Send
```

to:

```text
Generating...
```

But the user might still stare at the screen for many seconds without seeing any response.

That makes the application appear frozen.

So we introduced a second state:

```ts
const [isWaitingForFirstChunk, setIsWaitingForFirstChunk] = useState(false);
```

We now distinguish three phases.

## Phase 1 — Ready

Before a request:

```text
● Ready

[ Send ]
```

The user can enter a prompt.

---

## Phase 2 — Waiting for the First Chunk

Immediately after Send:

```text
● Streaming

[ Generating... ]

⟳ Waiting for model...
  The model is preparing its response.
```

Internally:

```ts
setAnswer("");
setIsLoading(true);
setIsWaitingForFirstChunk(true);
```

At this point:

```text
request started
      ↓
model may be processing
      ↓
browser has not received response text yet
```

---

## Phase 3 — Actively Streaming

Eventually:

```ts
const { done, value } = await reader.read();
```

returns the first chunk.

At that moment:

```ts
setIsWaitingForFirstChunk(false);
```

The waiting panel disappears.

The response panel begins appearing:

```text
AI Response                 ● Streaming

A JavaScript Promise repre▌
```

Additional chunks progressively extend the answer.

Finally:

```text
stream ends
    ↓
isLoading = false
    ↓
Ready
```

The complete UI state machine is:

```text
READY
  │
  │ Send
  ▼
WAITING FOR FIRST CHUNK
  │
  │ reader.read() returns first bytes
  ▼
ACTIVELY STREAMING
  │
  │ done = true
  ▼
READY
```

---

# 10. `isLoading` vs `isWaitingForFirstChunk`

These two states represent different things.

```ts
const [isLoading, setIsLoading] = useState(false);

const [isWaitingForFirstChunk, setIsWaitingForFirstChunk] = useState(false);
```

`isLoading` represents the entire request lifecycle:

```text
Send
  ↓
waiting
  ↓
streaming
  ↓
finished
```

`isWaitingForFirstChunk` represents only:

```text
Send
  ↓
waiting
  ↓
FIRST CHUNK
```

Therefore:

```text
                    isLoading   isWaitingForFirstChunk

Ready                  false             false

Waiting                 true              true

Actively streaming      true              false

Complete                false             false
```

This gives the UI enough information to communicate what is actually happening.

---

# 11. Why We Did Not Use React Suspense

At first, a waiting state might sound like a job for React `<Suspense>`.

But this is an important distinction.

Our component already exists on the page.

The user can see:

```text
LLM Playground
Prompt
Send
```

Then the user clicks Send.

Inside an event handler we perform:

```ts
fetch("/api/openai");
```

and later:

```ts
reader.read();
```

We are waiting for an imperative browser operation to receive its first stream chunk.

So we represent that state explicitly:

```ts
isWaitingForFirstChunk;
```

This is different from using Suspense as the mechanism for a React component/resource boundary that is waiting before revealing content.

The distinction is:

```text
Waiting-for-first-chunk UI
        ↓
React state


LLM output transport
        ↓
Web Streams API


React rendering
        ↓
state updates


Suspense
        ↓
different React rendering/loading concern
```

So the waiting panel may visually resemble a loading fallback, but the mechanism in this lesson is ordinary React state.

---

# 12. Server Component vs Client Component

Another major concept introduced by this lesson is the Server/Client Component boundary.

Our page:

```text
src/app/learn/01-llms/page.tsx
```

remains a Server Component.

We do **not** add:

```ts
"use client";
```

to the page.

Instead:

```text
LLMsPage
Server Component
     │
     ▼
CourseLayout
Server Component
     │
     ├── Section 01 heading
     ├── description
     │
     └── LlmChat
         Client Component
```

Only `LlmChat` needs:

```ts
"use client";
```

because it requires browser-side interactivity:

```text
useState()
event handlers
fetch()
response.body
getReader()
TextDecoder
progressive state updates
```

This keeps the Client Component boundary as small as possible.

---

# 13. `"use client"` Does Not Mean Browser-Only HTML

While debugging this lesson, we discovered an important Next.js behavior.

It is easy to mentally interpret:

```ts
"use client";
```

as:

> Do not render this component on the server.

That is not the correct mental model.

A Client Component can still contribute initial HTML during Next.js server rendering/prerendering.

The JavaScript sent to the browser then hydrates that UI and makes it interactive.

We verified this ourselves by requesting the page HTML and observing content from `LlmChat`, including text such as:

```text
LLM Playground
POST /api/openai
Ask the model something...
```

before relying on browser interaction.

A better mental model is:

```text
"use client"
     ↓
This component participates in the Client Component boundary
     ↓
its JavaScript can run in the browser
     ↓
hooks + event handlers become interactive after hydration
```

It does **not** simply mean:

```text
browser-only rendering
```

That distinction becomes increasingly important as our Next.js application grows.

---

# 14. An Architecture Bug We Found During the Lesson

Initially our Section 01 page looked conceptually like:

```tsx
<>
  <CourseSectionPlaceholder ... />
  <LlmChat />
</>
```

But the UI did not compose correctly.

Why?

Because `CourseSectionPlaceholder` already contained:

```tsx
<CourseLayout>...</CourseLayout>
```

Therefore our architecture was effectively:

```text
Page
 ├── CourseSectionPlaceholder
 │      └── CourseLayout
 │             └── placeholder content
 │
 └── LlmChat
        ↑
        outside CourseLayout
```

`LlmChat` was a sibling of the entire layout instead of real content inside the layout.

The problem was architectural, not a streaming failure.

---

# 15. Section 01 Graduates from the Placeholder

`CourseSectionPlaceholder` was introduced in Lesson 001-001 as temporary scaffolding.

Originally:

```text
01 LLMs ─────┐
02 Agents     │
03 RAG        │
04 LangGraph  ├──→ CourseSectionPlaceholder
05 MCP        │
06 Build      │
07 Eval ──────┘
```

That made sense when none of those sections had real lesson content.

But Section 01 now has real functionality.

So in Lesson 001-006 it graduates:

```text
01 LLMs
   ↓
CourseLayout
   ↓
real section content
   ↓
LlmChat
```

Meanwhile:

```text
02 Agents
03 RAG
04 LangGraph
05 MCP
06 Build
07 Eval
```

continue using:

```text
CourseSectionPlaceholder
```

This gives us a reusable curriculum pattern:

```text
unfinished section
      ↓
CourseSectionPlaceholder


section gains real content
      ↓
CourseLayout + section-specific components
```

Eventually every section will graduate.

When no pages use `CourseSectionPlaceholder` anymore, we can remove it as dead code.

---

# 16. Do Not Put LLM Features Inside the Generic Placeholder

Another possible design would have been:

```text
CourseSectionPlaceholder
   └── LlmChat
```

We deliberately did **not** do this.

`CourseSectionPlaceholder` is generic infrastructure.

It should not know anything about:

```text
LLMs
OpenAI
streaming
chat
agents
RAG
```

Otherwise a temporary generic component would become coupled to one specific course section.

Instead:

```text
CourseLayout
    ↑
generic reusable layout


CourseSectionPlaceholder
    ↑
generic temporary scaffolding


LlmChat
    ↑
LLM-specific feature
```

Each component keeps a clear responsibility.

---

# 17. A Build Failure Confirmed Why the Placeholder Still Matters

During final validation:

```bash
pnpm build
```

initially failed for:

```text
/learn/02-agents
/learn/03-rag
/learn/04-langgraph
/learn/05-mcp
/learn/06-build
/learn/07-eval
```

Each page expected:

```ts
import { CourseSectionPlaceholder } from "@/components/learn/course-section-placeholder";
```

We discovered that `course-section-placeholder.tsx` had accidentally been overwritten with the new Section 01 page implementation.

That meant the named export:

```ts
CourseSectionPlaceholder;
```

no longer existed.

The correct solution was **not** to modify six pages.

Instead we restored the shared placeholder component.

This reinforced the intended architecture:

```text
Section 01
   ↓
real implementation


Sections 02–07
   ↓
shared placeholder
```

After restoring it, the production build succeeded.

---

# 18. Why the Page Remains a Server Component

Our final Section 01 page follows this structure:

```tsx
export default function LLMsPage() {
  const section = courseSections[0];

  return (
    <CourseLayout>
      ...
      <LlmChat />
    </CourseLayout>
  );
}
```

The page itself does not require:

```text
useState
onClick
onChange
onSubmit
browser fetch
stream reader
```

Therefore there is no reason to move the entire page across the Client Component boundary.

Instead:

```text
SERVER
────────────────────────────

LLMsPage
CourseLayout
section metadata
section heading


CLIENT
────────────────────────────

LlmChat
useState
textarea
buttons
fetch
stream reader
TextDecoder
progressive rendering
```

This is the architecture we want to continue using throughout the course:

> Keep `"use client"` as low in the component tree as practical.

---

# 19. The Teaching Delay

Our browser stream contains:

```ts
await sleep(200);
```

after rendering each received HTTP chunk.

This is intentional.

On a fast network or local development environment, chunks may arrive so quickly that a student barely sees progressive rendering.

The delay makes the behavior easier to observe.

Conceptually:

```text
chunk arrives
   ↓
decode
   ↓
render
   ↓
wait 200 ms
   ↓
read/render next chunk
```

This is **teaching behavior**, not production architecture.

A production application would normally remove this artificial delay.

It is also important to remember:

> The delay does not create streaming.

Streaming already exists.

The delay merely makes the streaming behavior easier to see.

---

# 20. Error Handling

We explicitly check the HTTP status:

```ts
if (!response.ok) {
  throw new Error(`Request failed: ${response.status} ${response.statusText}`);
}
```

This is necessary because `fetch()` does not automatically reject its Promise simply because the server returned a normal HTTP error status such as:

```text
400
500
```

We also verify:

```ts
if (!response.body) {
  throw new Error("Response body is missing.");
}
```

Errors are caught:

```ts
catch (error) {
  console.error(error);
  setAnswer("Something went wrong.");
}
```

Finally:

```ts
finally {
  setIsWaitingForFirstChunk(false);
  setIsLoading(false);
}
```

ensures the UI does not remain stuck in:

```text
Waiting...
```

or:

```text
Generating...
```

after the request ends.

---

# 21. Client Validation and Server Validation

The UI prevents an empty prompt from being submitted:

```ts
if (!prompt.trim()) return;
```

The Send button is also disabled when appropriate:

```tsx
disabled={isLoading || !prompt.trim()}
```

But the server still performs its own validation.

This distinction is important.

Client validation provides:

```text
better UX
```

Server validation provides:

```text
API boundary protection
```

A caller can bypass our browser UI and call:

```text
/api/openai
```

directly.

Therefore server validation remains necessary.

---

# 22. Live Model Responses Should Not Be Cached

The project has:

```ts
cacheComponents: true;
```

enabled in `next.config.ts`.

That remains part of our modern Next.js foundation.

However, we do not cache the live user-specific model generation in this lesson.

The request is:

```text
user prompt
    ↓
live model execution
    ↓
streamed response
```

This is runtime AI behavior.

So:

```text
Cache Components enabled
        ≠
cache every operation
```

We will introduce caching only where it makes architectural sense and when the curriculum reaches that topic.

---

# 23. Complete Browser Streaming Algorithm

The essential browser-side algorithm is:

```ts
const response = await fetch("/api/openai", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ prompt }),
});

if (!response.ok) {
  throw new Error(`Request failed: ${response.status} ${response.statusText}`);
}

if (!response.body) {
  throw new Error("Response body is missing.");
}

const reader = response.body.getReader();
const decoder = new TextDecoder();

let hasReceivedFirstChunk = false;

while (true) {
  const { done, value } = await reader.read();

  if (done) break;

  if (!hasReceivedFirstChunk) {
    hasReceivedFirstChunk = true;
    setIsWaitingForFirstChunk(false);
  }

  const chunk = decoder.decode(value, {
    stream: true,
  });

  setAnswer((current) => current + chunk);

  await sleep(200);
}

const finalChunk = decoder.decode();

if (finalChunk) {
  setIsWaitingForFirstChunk(false);
  setAnswer((current) => current + finalChunk);
}
```

This small loop contains most of the important concepts introduced in this lesson.

---

# 24. Complete End-to-End Architecture

We can now trace a prompt through the entire system.

```text
USER
 │
 │ types prompt
 ▼
<textarea>
 │
 │ onSubmit
 ▼
handleSubmit()
 │
 │
 ├── setIsLoading(true)
 │
 ├── setIsWaitingForFirstChunk(true)
 │
 ▼
fetch("/api/openai")
 │
 │ POST JSON
 ▼
NEXT.JS ROUTE HANDLER
 │
 │ validate prompt
 ▼
OpenAI Responses API
 │
 │ stream: true
 ▼
OpenAI stream events
 │
 │ response.output_text.delta
 ▼
event.delta
 │
 │ string
 ▼
TextEncoder
 │
 │ Uint8Array
 ▼
controller.enqueue()
 │
 ▼
HTTP RESPONSE STREAM
 │
 ▼
response.body
 │
 ▼
getReader()
 │
 ▼
reader.read()
 │
 │ first bytes arrive
 ├── setIsWaitingForFirstChunk(false)
 │
 ▼
TextDecoder
 │
 │ bytes → string
 ▼
chunk
 │
 ▼
setAnswer(current => current + chunk)
 │
 ▼
REACT RE-RENDER
 │
 ▼
progressive text appears
 │
 │
 │ more chunks...
 │
 ▼
done = true
 │
 ▼
setIsLoading(false)
 │
 ▼
READY
```

We now have a complete browser-to-model-to-browser streaming pipeline.

---

# 25. What We Tested

We verified the UI manually in the browser using the example prompt:

```text
Explain what a JavaScript Promise is in 5 short sentences.
```

The important behaviors were:

```text
Empty prompt
   ↓
Send disabled


Click Try
   ↓
example prompt fills textarea


Click Send
   ↓
Ready → Streaming
Send → Generating...


Before first chunk
   ↓
Waiting for model...
The model is preparing its response.


First chunk arrives
   ↓
waiting panel disappears
AI Response appears


More chunks arrive
   ↓
answer grows progressively
streaming cursor remains visible


Stream finishes
   ↓
Streaming → Ready
Generating... → Send
cursor disappears
completed answer remains
```

This confirmed the complete browser streaming path.

---

# 26. Production Validation

After implementation and functional testing, we ran:

```bash
pnpm lint
```

and ESLint completed successfully.

We also ran:

```bash
pnpm build
```

After restoring the accidentally overwritten shared placeholder component, the optimized production build completed successfully.

The final route summary included:

```text
○ /
ƒ /api/openai
○ /learn/01-llms
○ /learn/02-agents
○ /learn/03-rag
○ /learn/04-langgraph
○ /learn/05-mcp
○ /learn/06-build
○ /learn/07-eval
```

This also illustrates an important distinction:

```text
/learn/01-llms
      ↓
static/prerendered page shell


/api/openai
      ↓
dynamic server execution
```

The page can be prerendered while the model request itself remains dynamic.

---

# 27. What Lesson 001-006 Added

Before this lesson:

```text
Browser
   ↓
curl was our main stream observer


Server
   ↓
OpenAI streaming already worked
```

After this lesson:

```text
Browser UI
   ↓
prompt
   ↓
fetch
   ↓
Next.js server
   ↓
OpenAI
   ↓
stream
   ↓
browser reader
   ↓
decoder
   ↓
React state
   ↓
progressive answer
```

We also introduced:

```text
Client Component boundary
controlled textarea
browser fetch()
ReadableStream reader
TextDecoder
progressive React rendering
waiting-for-first-chunk UX
streaming status
generating state
streaming cursor
client-side validation
```

---

# 28. Section 001 Is Now Complete

Across Section 001 we progressed from an empty project to a complete streaming LLM application.

```text
001-001
Project Setup
     ↓
Next.js foundation


001-002
Connect OpenAI
     ↓
OpenAI SDK + server client


001-003
Prompt → Response
     ↓
caller-controlled prompts


001-004
Responses API Deep Dive
     ↓
understand Response objects


001-005
Streaming
     ↓
OpenAI → server → HTTP stream


001-006
Simple LLM Chat UI
     ↓
browser consumes and renders stream
```

The final Section 001 architecture is:

```text
┌─────────────────────┐
│       Browser       │
│                     │
│      LlmChat        │
│  Client Component   │
└──────────┬──────────┘
           │
           │ POST /api/openai
           ▼
┌─────────────────────┐
│   Next.js Server    │
│                     │
│    Route Handler    │
└──────────┬──────────┘
           │
           │ Responses API
           ▼
┌─────────────────────┐
│       OpenAI        │
│                     │
│    stream: true     │
└──────────┬──────────┘
           │
           │ deltas
           ▼
┌─────────────────────┐
│   Next.js Server    │
│                     │
│    TextEncoder      │
│   ReadableStream    │
└──────────┬──────────┘
           │
           │ HTTP bytes
           ▼
┌─────────────────────┐
│       Browser       │
│                     │
│     getReader()     │
│     TextDecoder     │
│     setAnswer()     │
│                     │
│ Progressive Render │
└─────────────────────┘
```

---

# 29. Key Takeaways

### `fetch()` can consume a streaming response

We do not need to wait for the complete model answer.

```text
fetch
  ↓
response.body
  ↓
ReadableStream
```

### `getReader()` gives us progressive access

```text
ReadableStream
     ↓
getReader()
     ↓
reader.read()
```

### HTTP response chunks are bytes

```text
reader.read()
     ↓
Uint8Array
```

### `TextDecoder` converts bytes back to text

```text
Uint8Array
     ↓
TextDecoder
     ↓
string
```

### Chunks are not words

Never assume transport boundaries correspond to linguistic boundaries.

### Functional state updates are important

```ts
setAnswer((current) => current + chunk);
```

preserves the latest accumulated answer.

### Waiting and streaming are different UI phases

```text
Waiting for first chunk
        ≠
actively receiving chunks
```

### The waiting panel does not require Suspense

For this imperative `fetch()` streaming flow, ordinary React state accurately represents the lifecycle.

### Keep Client Components focused

Only the interactive `LlmChat` subtree needs `"use client"`.

### `"use client"` does not mean browser-only initial rendering

Client Components can participate in initial server-rendered/prerendered HTML and are then hydrated for browser interactivity.

### Generic scaffolding should remain generic

`CourseSectionPlaceholder` continues serving unfinished sections while Section 01 now owns its real content.

---

# 30. Next — Section 002: Agents

We now have everything required to communicate with an LLM:

```text
prompt
   ↓
model
   ↓
streamed answer
```

But this is still an **LLM application**, not yet an agent.

The model receives a prompt and produces text.

It cannot yet:

```text
choose an action
use a tool
observe a tool result
decide what to do next
repeat actions
```

That is what Section 002 introduces.

The next lesson is:

```text
002-001 — What is an Agent?
```

We will build on the LLM foundation from Section 001 and begin moving from:

```text
Prompt
   ↓
LLM
   ↓
Answer
```

toward:

```text
Goal
  ↓
LLM
  ↓
Decision
  ↓
Action / Tool
  ↓
Observation
  ↓
LLM
  ↓
Next decision
```

That transition is the beginning of agent engineering.
