# Lesson 001-004 — Responses API Deep Dive

> **Section:** 001 — LLMs
> **Project:** Learn AI Agents
> **Publisher:** Thunkx
> **Tagline:** Learn by building.
> **Previous:** 001-003 — Prompt → Response
> **Next:** 001-005 — Streaming

## Lesson goal

In Lesson 001-003, we completed the fundamental LLM interaction:

```text
Prompt → Model → Response
```

Our API route accepted a caller-provided prompt, sent it to OpenAI, read `response.output_text`, and returned the generated text.

That was enough to prove the interaction worked, but `response.output_text` is only one convenient view of a much richer object returned by the OpenAI Responses API.

In this lesson, we inspect that Response object and focus on six fields:

```text
response
├── id
├── status
├── model
├── output
├── output_text
└── usage
```

By the end, you should understand both the structured Response representation and the convenient generated-text representation.

---

## 1. Where we are coming from

At the end of Lesson 001-003, our route called:

```ts
const response = await openai.responses.create({
  model: "gpt-5.6-luna",
  input: prompt,
});
```

and returned only:

```ts
return Response.json({
  message: response.output_text,
});
```

Conceptually:

```text
caller
  ↓
POST /api/openai
  ↓
prompt
  ↓
openai.responses.create()
  ↓
OpenAI Response object
  ↓
response.output_text
  ↓
{"message":"..."}
```

This was intentionally simple. Now we want to understand what comes back before reducing it to one string.

---

## 2. Inspecting the full Response object

During development, we temporarily added:

```ts
console.dir(response, { depth: null });
```

Then we sent:

```bash
curl -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is 2 + 2?"}'
```

A real Response observed during this lesson contained fields including:

```js
{
  id: "resp_...",
  object: "response",
  status: "completed",
  model: "gpt-5.6-luna",
  output: [
    {
      id: "msg_...",
      type: "message",
      status: "completed",
      content: [
        {
          type: "output_text",
          annotations: [],
          logprobs: [],
          text: "2 + 2 = 4"
        }
      ],
      phase: "final_answer",
      role: "assistant"
    }
  ],
  usage: {
    input_tokens: 14,
    input_tokens_details: {
      cache_write_tokens: 0,
      cached_tokens: 0
    },
    output_tokens: 11,
    output_tokens_details: {
      reasoning_tokens: 0
    },
    total_tokens: 25
  },
  output_text: "2 + 2 = 4"
}
```

The actual object contained additional fields. We deliberately do **not** try to learn every property in this lesson.

After inspecting the object, the temporary `console.dir(...)` was removed.

---

## 3. Response object mental model

```text
OpenAI Response
│
├── id
│   └── Which Response is this?
│
├── status
│   └── What state is it in?
│
├── model
│   └── Which model is associated with it?
│
├── output[]
│   └── Structured output items
│
├── output_text
│   └── Convenient combined generated text
│
└── usage
    └── Token usage information
```

This is the main mental model for Lesson 001-004.

---

## 4. `response.id`

Our observed Response contained an ID similar to:

```json
"id": "resp_082bd17f9bfad6fc006a988c0b5dc087d0843bf3406e914dc1"
```

The ID identifies this particular OpenAI Response:

```text
request
  ↓
OpenAI creates a Response
  ↓
response.id
  ↓
"Which Response is this?"
```

For this lesson, we only expose and inspect the ID. We do not add response retrieval or other lifecycle operations.

---

## 5. `response.status`

Our successful test returned:

```json
"status": "completed"
```

This is the state of the **OpenAI Response object**.

Do not confuse it with an HTTP status from our own Next.js API:

```ts
return Response.json(
  { error: "Prompt is required." },
  { status: 400 },
);
```

These are different layers:

```text
Our HTTP API                         OpenAI Response

HTTP 200                            response.status
HTTP 400                                 ↓
HTTP 500                            "completed"
   ↓
HTTP exchange status               Response state
```

---

## 6. `response.model`

We sent:

```ts
model: "gpt-5.6-luna",
```

and our observed Response contained:

```json
"model": "gpt-5.6-luna"
```

`response.model` tells us which model is associated with the returned Response.

---

## 7. Understanding `response.output`

Our observed Response contained:

```json
"output": [
  {
    "id": "msg_...",
    "type": "message",
    "status": "completed",
    "content": [
      {
        "type": "output_text",
        "annotations": [],
        "logprobs": [],
        "text": "2 + 2 = 4"
      }
    ],
    "phase": "final_answer",
    "role": "assistant"
  }
]
```

Notice that `output` is an array:

```text
output[]
```

For our simple request, that array contained one message, and the message contained another array called `content`:

```text
output[]
  │
  └── message
        │
        ├── role: "assistant"
        │
        └── content[]
              │
              └── output_text
                    │
                    └── text: "2 + 2 = 4"
```

The important lesson is that the Responses API represents output as **structured data**, not merely as one string.

---

## 8. Why are `output` and `content` arrays?

For our tiny example, the structure may look unnecessarily complicated.

But we should not build our mental model around:

```text
Response = one string
```

A better model is:

```text
Response
  ↓
output items
  ↓
content items
  ↓
generated content
```

Our current request happens to produce a simple structure. Later lessons will introduce additional capabilities, but we do not need them yet to understand why the representation is structured.

---

## 9. Why not always use `response.output[0].content[0].text`?

Looking at our observed Response, we might be tempted to write:

```ts
response.output[0].content[0].text
```

For this particular Response, that path appears to reach:

```text
"2 + 2 = 4"
```

But it makes assumptions about the exact item types and positions we observed.

The better lesson is to understand `response.output` as the structured representation rather than hard-code assumptions about the first item.

When all we need is generated text, the SDK gives us something more convenient.

---

## 10. `response.output_text`

The SDK exposes:

```ts
response.output_text
```

Our observed value was:

```text
2 + 2 = 4
```

Compare the two views:

```text
response.output
      ↓
structured representation
      ↓
output[]
  └── message
      └── content[]
          └── output_text
              └── text


response.output_text
      ↓
convenient generated text
      ↓
"2 + 2 = 4"
```

A useful rule of thumb:

```text
Need structured output?
    → inspect response.output

Just need generated text?
    → use response.output_text
```

---

## 11. Why our JSON says `outputText`

The OpenAI SDK property is:

```ts
response.output_text
```

Our own API returns:

```ts
outputText: response.output_text,
```

Therefore the caller receives:

```json
{
  "outputText": "2 + 2 = 4"
}
```

These are not two OpenAI properties:

```text
OpenAI SDK property
response.output_text
        ↓
our Next.js JSON property
outputText
```

---

## 12. Understanding `response.usage`

Our observed Response contained:

```json
"usage": {
  "input_tokens": 14,
  "input_tokens_details": {
    "cache_write_tokens": 0,
    "cached_tokens": 0
  },
  "output_tokens": 11,
  "output_tokens_details": {
    "reasoning_tokens": 0
  },
  "total_tokens": 25
}
```

For this lesson, focus on:

```text
input_tokens
output_tokens
total_tokens
```

In our observed request:

```text
input_tokens       14
output_tokens    + 11
                  ───
total_tokens       25
```

The exact numbers are examples from this run and may vary.

---

## 13. Tokens are not words

Our visible prompt was:

```text
What is 2 + 2?
```

A token is a model-processing unit, not simply an English word.

Do not estimate API usage by counting visible words. Use the values reported by `response.usage`.

---

## 14. Why token usage matters

Conceptually:

```text
                model request
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
     INPUT TOKENS          OUTPUT TOKENS
   model input usage      model output usage
          │                     │
          └──────────┬──────────┘
                     ▼
                TOTAL TOKENS
```

Usage information helps us reason about model consumption and cost. We do not build billing or optimization logic in this lesson.

---

## 15. Selecting useful fields instead of returning everything

We could have written:

```ts
return Response.json(response);
```

But we deliberately did not.

The full object contains many properties outside Lesson 001-004. Returning everything would make the lesson harder to understand and introduce concepts too early.

Instead:

```ts
return Response.json({
  id: response.id,
  status: response.status,
  model: response.model,
  output: response.output,
  outputText: response.output_text,
  usage: response.usage,
});
```

This gives us enough information to study the Response while keeping the lesson focused.

---

## 16. Final implementation

The important part of the completed route is:

```ts
const response = await openai.responses.create({
  model: "gpt-5.6-luna",
  input: prompt,
});

return Response.json({
  id: response.id,
  status: response.status,
  model: response.model,
  output: response.output,
  outputText: response.output_text,
  usage: response.usage,
});
```

The runtime prompt validation from Lesson 001-003 remains in place.

The lesson comments in `src/app/api/openai/route.ts` now document:

```text
PAST — 001-003 Prompt → Response
NOW  — 001-004 Responses API Deep Dive
NEXT — 001-005 Streaming
TEST CASES
```

---

## 17. Test 1 — Inspect a successful Response

Start the development server if needed:

```bash
pnpm dev
```

Then:

```bash
curl -s -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is 2 + 2?"}' \
  | python3 -m json.tool
```

`python3 -m json.tool` does not change the API response. It only pretty-prints the JSON for terminal readability.

Without it, `curl` may display compact JSON:

```json
{"id":"resp_...","status":"completed","model":"gpt-5.6-luna",...}
```

With it, the same data is easier to inspect:

```json
{
    "id": "resp_...",
    "status": "completed",
    "model": "gpt-5.6-luna",
    "output": [
        {
            "type": "message",
            "content": [
                {
                    "type": "output_text",
                    "text": "2 + 2 = 4"
                }
            ]
        }
    ],
    "outputText": "2 + 2 = 4",
    "usage": {
        "input_tokens": 14,
        "output_tokens": 11,
        "total_tokens": 25
    }
}
```

Exact IDs, output details, and token counts may vary.

---

## 18. Test 2 — Compare `output` and `outputText`

Inspect:

```json
"output": [...]
```

versus:

```json
"outputText": "2 + 2 = 4"
```

They provide two views:

```text
output
  ↓
structured details

outputText
  ↓
convenient generated text
```

---

## 19. Test 3 — Inspect token usage

Find:

```json
"usage": {
  "input_tokens": 14,
  "output_tokens": 11,
  "total_tokens": 25
}
```

These are observed example values.

Do not write a test that requires the exact same counts on every request. The lesson is about the fields and their meaning, not fixed token numbers.

---

## 20. Test 4 — Regression test prompt validation

Run:

```bash
curl -i -X POST http://localhost:3000/api/openai \
  -H "Content-Type: application/json" \
  -d '{"prompt":""}'
```

Expected HTTP status:

```text
400 Bad Request
```

Expected JSON:

```json
{"error":"Prompt is required."}
```

This verifies that the validation introduced in Lesson 001-003 still protects the OpenAI request.

---

## 21. Quality checks

After functional testing:

```bash
pnpm lint
```

Result for this lesson:

```text
PASS
```

Then:

```bash
pnpm build
```

The production build completed successfully.

The route table included:

```text
ƒ /api/openai
```

The API route remains dynamic and server-rendered on demand.

---

## 22. What changed from 001-003?

### Before — 001-003

```ts
return Response.json({
  message: response.output_text,
});
```

Caller saw a simple answer.

### Now — 001-004

```ts
return Response.json({
  id: response.id,
  status: response.status,
  model: response.model,
  output: response.output,
  outputText: response.output_text,
  usage: response.usage,
});
```

Caller can study:

```text
identity
state
model
structured output
convenient text
token usage
```

The model call did not fundamentally change.

What changed is our **understanding of what comes back**.

---

## 23. Complete flow

```text
Caller
  │
  │ POST /api/openai
  │ {"prompt":"What is 2 + 2?"}
  ▼
Next.js Route Handler
  │
  ├── request.json()
  ├── extract prompt
  └── validate prompt
  │
  ▼
openai.responses.create()
  │
  ├── model: "gpt-5.6-luna"
  └── input: prompt
  │
  ▼
OpenAI Response object
  │
  ├── id
  ├── status
  ├── model
  ├── output[]
  ├── output_text
  └── usage
  │
  ▼
Selected JSON returned by our route
  │
  ├── id
  ├── status
  ├── model
  ├── output
  ├── outputText
  └── usage
  │
  ▼
Caller
```

---

## 24. Key takeaways

### `responses.create()` returns a Response object

`response.output_text` is one convenient property on that object, not the entire Response.

### `output` is structured

Think:

```text
output[]
  ↓
output items
  ↓
content[]
  ↓
content items
```

### `output_text` is convenient

When all we need is generated text:

```ts
response.output_text
```

avoids manually walking the structured output.

### `id` identifies the Response

```ts
response.id
```

answers: **Which Response is this?**

### `status` is not the HTTP status

`response.status` describes the OpenAI Response state.

`{ status: 400 }` in our `Response.json(...)` call is an HTTP status from our Next.js endpoint.

### `usage` reports token consumption

Focus on:

```text
input_tokens
output_tokens
total_tokens
```

Tokens are not simply words.

### Keep the curriculum boundary

We expose only what this lesson needs instead of teaching every property in the full Response object.

---

## 25. What we intentionally did not build

Lesson 001-004 is about understanding the Responses API object.

We did **not** add:

```text
streaming
chat UI
tool calling
agent loops
RAG
LangGraph
MCP
evaluation
```

Those belong to later lessons.

Our progression remains:

```text
001-002  Connect OpenAI
    ↓
001-003  Prompt → Response
    ↓
001-004  Responses API Deep Dive
    ↓
001-005  Streaming
    ↓
001-006  Simple LLM Chat UI
```

---

## 26. Next lesson — 001-005 Streaming

Our current interaction waits for the complete Response:

```text
request
   ↓
wait
   ↓
complete Response
   ↓
return JSON
```

In Lesson 001-005, we will move toward:

```text
Prompt
  ↓
generated output arrives progressively
  ↓
caller receives output as it is produced
```

Streaming is the next building block before the Simple LLM Chat UI in Lesson 001-006.

---

## Lesson complete

At the end of 001-004, our mental model is:

```text
openai.responses.create()
          ↓
    Response object
          │
          ├── identity
          ├── state
          ├── model
          ├── structured output
          ├── convenient text
          └── token usage
```

We have moved from merely **getting an answer** to understanding the structure of the API response that carries that answer.

**Next:** `001-005 — Streaming`
