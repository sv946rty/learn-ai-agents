# Lesson 002-004 — Agent Loop

**Section:** 002 — Agents  
**Lesson:** 002-004  
**Title:** Agent Loop  
**Subtitle:** From Tool Result to the Next Model Decision

---

## What You Will Learn

In 002-003, our application could execute a real calculator, but the flow stopped after tool execution:

```text
Prompt → Model → function_call → calculator(...) → result → STOP
```

In 002-004, the result becomes an observation that goes back to the model:

```text
Goal
  ↓
Model
  ↓
function_call
  ↓
Application executes calculator(...)
  ↓
result
  ↓
function_call_output
  ↓
Model again
  ↓
repeat until no function_call
  ↓
Final Answer
```

The model can now use each observation to decide what to do next.

---

## PAST — 002-003 Calculator Tool

The previous lesson connected a **model-facing tool definition** with a real **application-side implementation**.

The model could request:

```json
{
  "type": "function_call",
  "name": "calculator",
  "arguments": {
    "operation": "multiply",
    "a": 27,
    "b": 43
  }
}
```

Our application parsed those arguments and explicitly executed:

```ts
calculator("multiply", 27, 43);
```

JavaScript produced `1161`.

The responsibility boundary was:

```text
MODEL → decides WHAT action to request
APPLICATION → decides HOW that action works and executes it
```

But the model never received `1161`, so it could not use that result for another decision.

---

## Why 002-003 Cannot Finish a Multi-Step Goal

Consider:

```text
Multiply 27 by 43. Then multiply that result by 10.
```

002-003 can reach:

```text
Model → calculator(27, 43) → 1161 → STOP
```

But the next step requires the model to observe `1161` and decide to request:

```text
calculator(1161, 10)
```

The missing architecture is:

```text
1161 → observation → Model again
```

That is the purpose of 002-004.

---

# Building the Agent Loop Incrementally

We did not jump directly to `while (true)`. We built and tested the feedback mechanism one piece at a time.

## Step 1 — Extract the Calculator Tool Definition

The tool schema can be inline:

```ts
tools: [
  {
    type: "function",
    // ...
  },
]
```

or extracted:

```ts
const calculatorTool = {
  type: "function" as const,
  name: "calculator",
  description: "Perform basic arithmetic using two numbers.",
  parameters: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["add", "subtract", "multiply", "divide"],
      },
      a: { type: "number" },
      b: { type: "number" },
    },
    required: ["operation", "a", "b"],
    additionalProperties: false,
  },
  strict: true,
};
```

and reused as:

```ts
tools: [calculatorTool]
```

### Is extraction required for an agent loop?

No. The two forms are functionally equivalent. Extraction gives no capability or performance advantage. It is a readability/reuse choice because the same schema is now supplied to repeated model calls.

### Why `type: "function" as const`?

A separately declared object can have a string literal property widened by TypeScript to `string`. The SDK expects the literal tool type `"function"`. `as const` preserves that literal type.

An inline SDK object often benefits from contextual typing, so the surrounding `tools` parameter can already tell TypeScript what literal is expected.

This is a TypeScript typing detail, not an agent capability.

---

## Step 2 — Turn the Tool Result Into an Observation

After executing:

```ts
const result = calculator(
  arguments_.operation,
  arguments_.a,
  arguments_.b,
);
```

we create:

```ts
const toolOutput = {
  type: "function_call_output" as const,
  call_id: toolCall.call_id,
  output: String(result),
};
```

For `27 × 43`, that may look like:

```json
{
  "type": "function_call_output",
  "call_id": "call_abc123",
  "output": "1161"
}
```

A `function_call` travels conceptually from **model → application**: “Please execute this action.”

A `function_call_output` travels from **application → model**: “Here is the result of the action you requested.”

```text
Model → function_call → Application → function_call_output → Model
```

---

## Why `call_id` Matters

The request and observation use the same call ID:

```text
function_call                    function_call_output
------------------               --------------------
call_id: call_abc123  ────────→  call_id: call_abc123
calculator(...)                  output: "1161"
```

That correlation tells the model which requested function call produced the observation.

---

## Step 3 — Send the Observation Back to the Model

Our first experiment made one explicit second model call:

```ts
const nextResponse = await openai.responses.create({
  model: "gpt-5.6-luna",
  previous_response_id: response.id,
  input: [toolOutput],
  tools: [calculatorTool],
});
```

For a one-step prompt, this proved the round trip:

```text
Model #1 → calculator(27, 43) → 1161 → observation → Model #2 → Final Answer
```

### What does `previous_response_id` do?

It continues from the previous model interaction. We send the new observation in `input`, while `previous_response_id` connects it to the prior response so the model can continue working toward the original goal.

---

## Step 4 — The Experiment That Revealed Why We Need a Loop

We then tested:

```text
Use the calculator tool to multiply 27 by 43. Then multiply that result by 10.
```

The first call requested `calculator(27, 43)`. The app produced `1161` and returned it as a tool observation.

The second model response was **not** a final message. It requested another function call:

```json
{
  "type": "function_call",
  "arguments": "{\"operation\":\"multiply\",\"a\":1161,\"b\":10}",
  "call_id": "call_...",
  "name": "calculator"
}
```

That was correct model behavior: it observed `1161` and decided the next action should be `calculator(1161, 10)`.

But fixed two-call code was insufficient. A task may require two, three, or more cycles. The application cannot know the number ahead of time.

That is why we need a loop.

### Why was `response.output_text` empty?

Because the second response contained another structured `function_call`, not a final text message.

This gives us a useful rule:

```text
function_call exists → agent still has work to do
no function_call → model is ready to finish
```

---

## Step 5 — Why `response` Becomes `let`

The current model response changes every iteration:

```text
response = Model #1 response
  ↓
execute tool
  ↓
response = Model #2 response
  ↓
execute tool
  ↓
response = Model #3 response
```

So:

```ts
const response
```

becomes:

```ts
let response
```

because we later reassign it with the next OpenAI response.

---

## Step 6 — Why `.find()` Instead of `response.output[0]`

002-003 used:

```ts
const output = response.output[0];
```

That was a teaching simplification for simple prompts.

During experimentation with a prompt that asked the model to print text and then use the calculator, we observed that `response.output` can be heterogeneous:

```text
output[0] → reasoning
output[1] → message
output[2] → function_call
```

Therefore a function call is not guaranteed to be `output[0]`.

Instead:

```ts
const toolCall = response.output.find(
  (item) => item.type === "function_call",
);
```

`response.output[0]` asks for the first item. `.find(...)` asks for the item we actually need.

---

## Why `.find()` Instead of `.filter()` Right Now?

`.find()` returns one matching function call:

```ts
const toolCall = response.output.find(
  (item) => item.type === "function_call",
);
```

`.filter()` could collect multiple matching calls:

```ts
const toolCalls = response.output.filter(
  (item) => item.type === "function_call",
);
```

002-004 intentionally teaches:

```text
one requested calculator action
  ↓
execute it
  ↓
return observation
  ↓
ask model again
  ↓
repeat
```

This is a **curriculum choice**, not a claim that a model can only request one function call. Broader multiple-call/tool handling belongs to 002-005.

---

## Step 7 — The Actual Agent Loop

```ts
while (true) {
  const toolCall = response.output.find(
    (item) => item.type === "function_call",
  );

  if (!toolCall) {
    return Response.json({
      type: "message",
      text: response.output_text,
      output: response.output,
    });
  }

  const arguments_ = JSON.parse(toolCall.arguments) as {
    operation: CalculatorOperation;
    a: number;
    b: number;
  };

  const result = calculator(
    arguments_.operation,
    arguments_.a,
    arguments_.b,
  );

  const toolOutput = {
    type: "function_call_output" as const,
    call_id: toolCall.call_id,
    output: String(result),
  };

  response = await openai.responses.create({
    model: "gpt-5.6-luna",
    previous_response_id: response.id,
    input: [toolOutput],
    tools: [calculatorTool],
  });
}
```

At each iteration, `response` is the newest model decision.

If a `function_call` exists, the application executes it, sends the observation back, replaces `response`, and loops again.

If no function call exists, the handler returns the final model response.

---

## How Does `while (true)` Stop?

The exit condition is:

```ts
if (!toolCall) {
  return Response.json(...);
}
```

`return` exits the entire `POST()` Route Handler, which also ends the loop.

Conceptually:

```text
Search newest response for function_call
  ↓
No function_call found
  ↓
return final answer
  ↓
Route Handler exits
  ↓
loop ends
```

There is intentionally no maximum-iteration guard in this lesson. That safety concept belongs to 002-006.

---

# Complete Two-Step Runtime

Teaching prompt:

```text
Use the calculator tool to multiply 27 by 43. Then multiply that result by 10.
```

Runtime:

```text
Original Goal
     ↓
Model #1
     ↓
calculator(27, 43)
     ↓
1161
     ↓
function_call_output
     ↓
Model #2
     ↓
calculator(1161, 10)
     ↓
11610
     ↓
function_call_output
     ↓
Model #3
     ↓
Final Answer: "11,610"
```

The calculator produced the numeric value `11610`. The model chose to present the final natural-language answer as `11,610`.

That formatting does not mean we added a formatting tool. An explicit deterministic formatting capability can be introduced later.

---

# No-Tool Requests Still Work

For:

```text
Say hello in one short sentence.
```

the model can return a normal message such as `Hello!` without requesting the calculator.

Then `.find(...)` returns `undefined`, the `if (!toolCall)` branch returns the message, and the loop terminates immediately.

Tool availability does not force tool usage.

---

# Current Architecture

```text
                    ┌───────────────────────────────┐
                    │                               │
                    ▼                               │
User Goal → Model Decision                          │
              │                                     │
              ├── message ─────────→ Final Answer   │
              │                                     │
              └── function_call                     │
                       ↓                             │
                  parse arguments                    │
                       ↓                             │
                  calculator()                       │
                       ↓                             │
                     result                          │
                       ↓                             │
              function_call_output                   │
                       │                             │
                       └─────────────────────────────┘
```

The critical cycle is:

```text
Decision → Action → Observation → Decision
```

---

# Mental Model

A basic LLM application:

```text
Prompt → Model → Answer
```

Tool calling adds:

```text
Prompt → Model → Tool Request → Application Action
```

The agent loop adds feedback:

```text
Goal → Model Decision → Action → Observation → Model Decision → ... → Final Answer
```

The model remains the reasoning engine. The surrounding application lets it request actions, receive observations, and decide again.

---

# What 002-004 Does Not Do

This lesson deliberately does **not** add:

- multiple distinct tool capabilities,
- broader handling of multiple function calls in one response,
- a maximum-step safety guard,
- runtime validation of parsed tool arguments,
- special divide-by-zero protection,
- an Agent UI.

The current cast:

```ts
JSON.parse(toolCall.arguments) as {
  operation: CalculatorOperation;
  a: number;
  b: number;
};
```

is compile-time typing, not runtime schema validation.

The unbounded `while (true)` is also intentional for this lesson so the loop mechanism stays visible. A safety guard belongs to 002-006.

---

# TEST CASES

Start the development server:

```bash
pnpm dev
```

## Test 1 — Multi-Step Agent Loop

```bash
curl -s -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Use the calculator tool to multiply 27 by 43. Then multiply that result by 10."}' | jq
```

Expected semantic result: `11610`. The final model-generated text may format it as `11,610`.

## Test 2 — No Tool Required

```bash
curl -s -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Say hello in one short sentence."}' | jq
```

Expected shape:

```json
{
  "type": "message",
  "text": "Hello!"
}
```

Exact wording may vary.

## Test 3 — One Calculator Step

```bash
curl -s -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Use the calculator tool to multiply 27 by 43."}' | jq
```

Expected semantic result: `1161`.

## Test 4 — Empty Prompt

```bash
curl -i -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"prompt":""}'
```

Expected: HTTP 400 with `{"error":"Prompt is required."}`.

## Test 5 — Whitespace-Only Prompt

```bash
curl -i -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"prompt":"   "}'
```

Expected: HTTP 400.

## Test 6 — Non-String Prompt

```bash
curl -i -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"prompt":123}'
```

Expected: HTTP 400.

---

# Validation

For this lesson we verified:

```text
Multi-step calculator loop    ✓
No-tool termination           ✓
function_call_output          ✓
call_id correlation           ✓
previous_response_id          ✓
.find() output lookup         ✓
Lesson UI                     ✓
Browser visual check          ✓
pnpm lint                     ✓
pnpm build                    ✓
```

The production build keeps `/api/agents` as a dynamic server route.

---

# PAST / NOW / NEXT

## PAST — 002-003

```text
Model → function_call → calculator() → result → STOP
```

We could execute a real tool, but the model never saw the result.

## NOW — 002-004

```text
Model → function_call → calculator() → result
  ↓
function_call_output → Model again → repeat → Final Answer
```

The tool result becomes an observation and the model can continue deciding.

## NEXT — 002-005

We expand beyond this lesson's deliberately narrow handling. A useful teaching example is another deterministic capability such as `formatNumber()`:

```text
calculator(27, 43)
  ↓
1161
  ↓
MODEL
  ↓
calculator(1161, 10)
  ↓
11610
  ↓
MODEL
  ↓
formatNumber(11610)
  ↓
"11,610"
  ↓
MODEL
  ↓
Final Answer
```

The maximum-step safety guard remains reserved for 002-006.

---

# Key Takeaway

The architectural transition is:

```text
Model → Action → STOP
```

becoming:

```text
Model → Action → Observation → Model
```

and allowing that cycle to repeat.

The model decides **WHAT** it wants to do.

The application executes **HOW** the action works.

The application returns the result as an **observation**.

The model uses that observation to **decide again**.

```text
One request.
Many steps.
Until the answer is final.
```
