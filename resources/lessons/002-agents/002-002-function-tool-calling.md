# 002-002 — Function/Tool Calling

## Learn AI Agents

**Section:** 002 — Agents  
**Lesson:** 002-002 — Function/Tool Calling  
**Publisher:** Thunkx  
**Tagline:** Learn by building.

---

## 1. Goal

In **002-001 — What is an Agent?**, we introduced the mental model:

```text
Goal
  ↓
Model
  ↓
Decision
  ↓
Action
  ↓
Observation
  ↓
Model
  ↓
...
  ↓
Final Answer
```

One important question remained:

> How does the model tell our application which action it wants to perform?

That is the problem addressed by **function/tool calling**.

In this lesson, we give the model a tool definition and allow it to make a structured request for that tool.

By the end of the lesson:

```text
User Prompt
    ↓
OpenAI Responses API
    ↓
Model
    ↓
Decision
   /      \
  ↓        ↓
function_call   message
  ↓             ↓
request tool    answer directly
```

The most important idea is:

> **Tool request ≠ tool execution**

The model can request an action in this lesson, but our application does not execute that action yet.

---

## 2. Where We Came From

Section 001 built the LLM foundation:

```text
Prompt → Model → Answer
```

Then we added streaming:

```text
Prompt
  ↓
Model
  ↓
text deltas
  ↓
HTTP stream
  ↓
Browser UI
```

By **001-006 — Simple LLM Chat UI**, the browser could POST to `/api/openai` and progressively display the streamed response.

Then **002-001 — What is an Agent?** introduced the larger agent model:

```text
Goal → Model → Decision → Action → Observation → Model → ...
```

But 002-001 was conceptual. The model still had no structured mechanism for requesting an action.

That changes now.

---

## 3. What Is Function/Tool Calling?

Normally:

```text
User → Model → Text
```

Tool calling adds another possibility. Our application describes capabilities available to the model.

For this lesson:

```text
get_weather
```

The model can decide:

```text
Can I answer directly?

or

Should I ask the application to use get_weather?
```

Conceptually:

```text
                Model
                  ↓
               Decision
             ┌────┴────┐
             ↓         ↓
      function_call   message
             ↓         ↓
      request action  answer directly
```

This is an important transition from a simple LLM application toward an agent.

---

## 4. Our Teaching Tool: `get_weather`

The tool accepts a location:

```json
{
  "location": "San Jose, CA"
}
```

But we deliberately do **not** implement:

```ts
function getWeather(location: string) {
  // ...
}
```

We do not call a weather API, retrieve a temperature, or execute anything.

The tool definition only tells the model that our application claims a capability named `get_weather` is available.

This isolates **tool calling** from **tool execution**.

---

## 5. Curriculum Boundary

If we implemented everything immediately, we would mix:

```text
tool definition
+ model decision
+ function call
+ argument parsing
+ execution
+ tool result
+ observation
```

Instead:

### 002-002

```text
Model → function_call → STOP
```

### 002-003

```text
function_call → execute application code → tool result
```

### 002-004

```text
Model → Tool Call → Execute Tool → Observation → Model again → ...
```

Each lesson introduces one additional responsibility.

---

## 6. Why We Added `/api/agents`

Section 001 already owns:

```text
/api/openai
```

That route supports streamed LLM responses.

Rather than breaking that completed lesson, Section 002 gets its own evolving API:

```text
/api/agents
```

Architecture:

```text
Section 001
    ↓
/api/openai
    ↓
LLM text streaming
```

```text
Section 002
    ↓
/api/agents
    ↓
agent/tool-calling behavior
```

Earlier lessons remain runnable while the agent section evolves independently.

---

## 7. The New Route Handler

File:

```text
src/app/api/agents/route.ts
```

It reuses our server-side OpenAI client:

```ts
import { openai } from "@/lib/openai/client";
```

Request type:

```ts
type PromptRequest = {
  prompt: string;
};
```

The route reads the body and validates the prompt:

```ts
const body = (await request.json()) as PromptRequest;
const prompt = body.prompt;

if (typeof prompt !== "string" || !prompt.trim()) {
  return Response.json(
    { error: "Prompt is required." },
    { status: 400 },
  );
}
```

Remember:

```text
TypeScript type ≠ runtime validation
```

A caller can still send invalid JSON data such as `{ "prompt": 123 }`, so runtime validation remains necessary.

---

## 8. Defining the Tool

The major addition is the `tools` array:

```ts
const response = await openai.responses.create({
  model: "gpt-5.6-luna",
  input: prompt,
  tools: [
    {
      type: "function",
      name: "get_weather",
      description: "Get the current weather for a location.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, for example San Jose, CA.",
          },
        },
        required: ["location"],
        additionalProperties: false,
      },
      strict: true,
    },
  ],
});
```

### `type`

```ts
type: "function"
```

identifies a function tool.

### `name`

```ts
name: "get_weather"
```

gives the capability a stable identifier the model can request.

### `description`

Explains what the capability does so the model can decide when it is relevant.

### `parameters`

Describes the structured arguments:

```text
get_weather
     ↓
requires
     ↓
location
     ↓
string
```

### `strict: true`

For this lesson, the important idea is that generated function arguments should follow the supplied parameter schema.

We intentionally avoid advanced schema details here.

---

## 9. The Model Gets to Decide

Providing tools does **not** mean a tool must always be used.

```text
                 Model
                   ↓
                Decision
              ┌────┴────┐
              ↓         ↓
       function_call   message
              ↓         ↓
       request action  answer directly
```

We tested both branches.

---

## 10. Weather Test: `function_call`

We sent:

```bash
curl -s -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is the weather in San Jose, CA?"}' | jq
```

Observed API shape:

```json
{
  "type": "function_call",
  "name": "get_weather",
  "arguments": "{\"location\":\"San Jose, CA\"}",
  "callId": "call_..."
}
```

Notice what is absent:

```text
temperature
forecast
weather conditions
```

No weather lookup happened. The model produced only a structured request.

---

## 11. Tool Request ≠ Tool Execution

A `function_call` means:

```text
MODEL REQUESTED AN ACTION
```

It does not mean:

```text
APPLICATION EXECUTED THE ACTION
```

Current flow:

```text
User
  ↓
Model
  ↓
Decision
  ↓
function_call
  ↓
STOP
```

This distinction is the central idea of 002-002.

---

## 12. Inspecting the Output

For this focused lesson:

```ts
const output = response.output[0];
```

We care about two output paths.

For a function call:

```ts
if (output?.type === "function_call") {
  return Response.json({
    type: output.type,
    name: output.name,
    arguments: output.arguments,
    callId: output.call_id,
  });
}
```

Otherwise:

```ts
return Response.json({
  type: "message",
  text: response.output_text,
});
```

This small API contract makes the distinction easy to study without exposing the entire raw OpenAI response.

---

## 13. `arguments` Is a JSON String

We observed:

```text
"{\"location\":\"San Jose, CA\"}"
```

It is a **string containing JSON**, not yet a JavaScript object.

Conceptually it represents:

```js
{
  location: "San Jose, CA"
}
```

Later we could parse it:

```ts
JSON.parse(output.arguments)
```

but we intentionally do not do that yet. Parsing becomes useful when the application actually executes a tool in 002-003.

---

## 14. What Is `callId`?

The raw function call contains `call_id`; our API exposes it as `callId`.

Think of it as the identifier for one particular requested tool call:

```text
function_call
     │
     ├── name
     ├── arguments
     └── call_id
              ↓
       identifies this call
```

Later, a tool result can be associated with the function call that requested it.

We expose the ID now but do not use it yet.

---

## 15. `status: completed` Does Not Mean the Tool Ran

In raw output we observed a function-call item with a completed status.

That means the model finished generating the function-call output item.

It does **not** mean:

```text
weather lookup completed
```

So:

```text
function_call generation completed
          ≠
external tool execution completed
```

---

## 16. Normal Message Test

We also tested:

```bash
curl -s -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is 2 + 2? Answer normally without using any tool."}' | jq
```

Normal API shape:

```json
{
  "type": "message",
  "text": "<model-generated answer>"
}
```

One run produced:

```json
{
  "type": "message",
  "text": "2 + 2 = 4"
}
```

Exact wording and punctuation can vary. The contract is the structure, not a guaranteed sentence.

This proves:

```text
tools available
      ≠
tool must be used
```

---

## 17. Another Normal Message

We also tested:

```bash
curl -s -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Say hello in one short sentence."}' | jq
```

Again:

```json
{
  "type": "message",
  "text": "<model-generated answer>"
}
```

A particular run might say `"Hello!"`, but exact wording is not deterministic.

---

## 18. Why We Do Not Teach `tool_choice` Yet

Additional controls can influence tool selection, but they are outside this lesson.

The current mental model is enough:

```text
Give model tools
      ↓
Model decides
      ↓
function_call OR message
```

We add configuration only when it solves a concrete problem in the curriculum.

---

## 19. Why `/api/agents` Does Not Stream Yet

Section 001 already taught streaming through `/api/openai`.

For 002-002, `/api/agents` intentionally uses a completed response:

```ts
const response = await openai.responses.create({
  model: "gpt-5.6-luna",
  input: prompt,
  tools: [...],
});
```

There is no:

```ts
stream: true
```

This does **not** mean tool calling and streaming are incompatible.

It is a curriculum choice: isolate structured tool calling instead of simultaneously introducing streamed tool-call events.

---

## 20. `/api/openai` Still Streams

We explicitly verified the old endpoint after introducing `/api/agents`:

```bash
curl -N -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Explain what an AI agent is in three short sentences."}'
```

It continued returning streamed plain text.

So:

```text
/api/openai → streaming LLM response
/api/agents → structured tool-calling response
```

Section 002 does not regress Section 001.

---

## 21. Invalid Prompt Behavior

The new route retains prompt validation.

Empty, whitespace-only, or non-string prompts produce:

```text
HTTP 400
```

with:

```json
{
  "error": "Prompt is required."
}
```

Invalid input therefore does not trigger an unnecessary model request.

---

## 22. Updating the Section 02 Page

The visible course page evolved from:

```text
002-001 — What is an Agent?
```

to:

```text
002-002 — Function/Tool Calling
```

It preserves the previous lesson:

```text
Goal → Model → Decision
```

then introduces:

```text
type: function
name: get_weather
argument: location
```

and shows:

```text
              Decision
             /        \
            ↓          ↓
function_call        message
```

The page deliberately ends at:

```text
Model → function_call → STOP
```

with:

> **Tool request ≠ tool execution**

The UI therefore represents only what the application actually supports at this lesson.

---

## 23. Why the Page Is Still a Server Component

The lesson page needs no state, event handlers, browser APIs, or effects.

Therefore we do not add:

```tsx
"use client";
```

The project rule remains:

> Use Server Components by default. Add `"use client"` only when browser-side interactivity actually requires it.

---

## 24. Static Lesson Page, Dynamic APIs

Our production build reported:

```text
○ /learn/02-agents
ƒ /api/agents
ƒ /api/openai
```

where:

```text
○ = Static, prerendered as static content
ƒ = Dynamic, server-rendered on demand
```

The lesson UI can be prepared ahead of a particular request.

The APIs depend on each incoming prompt, so they execute on demand.

```text
○ /learn/02-agents
       ↓
prerenderable lesson UI
```

```text
ƒ /api/agents
       ↓
request arrives
       ↓
read prompt
       ↓
call model
       ↓
produce response
```

---

## 25. Related Rendering Concepts

We also clarified several concepts that solve different problems.

### Static vs Dynamic

**When** does Next.js produce the route?

### Cache Components

**What** server-rendered work or data may be reused?

### Suspense

**What part of the React UI can wait independently?**

### Client Components

**What requires browser-side interactivity?**

### LLM Streaming

**How does generated model output arrive progressively?**

In particular:

```text
Suspense ≠ LLM token streaming
```

Our LLM streaming uses the HTTP response stream, `getReader()`, `reader.read()`, decoded chunks, and React state.

Likewise, `cacheComponents: true` does not mean live user-specific model generation should automatically be cached.

---

## 26. Final `/api/agents` Flow

```text
POST /api/agents
      ↓
Read JSON body
      ↓
Validate prompt
      ↓
OpenAI Responses API
      ↓
Provide get_weather definition
      ↓
Model
      ↓
Decision
   ┌──┴──────────────┐
   ↓                 ↓
function_call      message
   ↓                 ↓
return structured  return text
tool request       answer
```

The function-call path stops after returning the structured request.

There is no execution yet.

---

## 27. What We Built

This lesson added:

```text
src/app/api/agents/route.ts
```

and evolved:

```text
src/app/learn/02-agents/page.tsx
```

The API now demonstrates:

- a function tool definition,
- structured tool parameters,
- model tool selection,
- `function_call`,
- normal `message` responses,
- `arguments`,
- `callId`,
- a small application-facing response contract.

The Section 02 page visually explains the same architecture.

---

## 28. What We Deliberately Did Not Build

We did **not** build:

- a weather API integration,
- a JavaScript weather implementation,
- calculator execution,
- argument parsing for execution,
- tool-result submission,
- observations,
- a repeating agent loop,
- multiple tool calls,
- safety guards,
- an interactive Agent UI.

Those belong to later lessons.

This is not missing functionality. It is the curriculum boundary.

---

## 29. Verification

We verified:

```text
weather question → function_call → get_weather
```

and:

```text
2 + 2 → message
```

and another ordinary conversational prompt → `message`.

We also verified `/api/openai` still streams, visually checked `/learn/02-agents`, and successfully ran:

```bash
pnpm lint
pnpm build
```

The final build included:

```text
○ /
ƒ /api/agents
ƒ /api/openai
○ /learn/01-llms
○ /learn/02-agents
○ /learn/03-rag
○ /learn/04-langgraph
○ /learn/05-mcp
○ /learn/06-build
○ /learn/07-eval
```

So 002-002 passes implementation, runtime, visual, lint, and production-build validation.

---

## 30. Lesson Infographic

The visual summary is stored at:

```text
resources/infographics/002-agents/002-002-function-tool-calling.png
```

Its central idea is:

```text
Tool request ≠ Tool execution
```

and:

```text
Prompt
  ↓
Model
  ↓
Decision
  ├───────────────┐
  ↓               ↓
message       function_call
  ↓               ↓
answer        structured request
                  ↓
                 STOP
```

---

## 31. Next — 002-003 Calculator Tool

Now that the model can request an action, the next question is:

> How does our application actually execute the requested action?

That is **002-003 — Calculator Tool**.

We will move from:

```text
Model
  ↓
function_call
  ↓
STOP
```

to:

```text
Model
  ↓
function_call
  ↓
Application reads arguments
  ↓
Application executes deterministic code
  ↓
Tool result
```

A calculator makes the separation clear:

```text
Model → decides WHAT action is needed
Application code → performs the actual calculation
```

But 002-003 still will not be the complete agent loop.

That comes in **002-004 — Agent Loop**:

```text
Model
  ↓
Tool Call
  ↓
Execute Tool
  ↓
Observation
  ↓
Model again
  ↓
...
  ↓
Final Answer
```

For now, 002-002 has accomplished one fundamental transition:

> The model is no longer limited to answering with text. It can now communicate a structured request for our application to take an action.
