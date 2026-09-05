# Lesson 002-005 --- Multiple Tool Calls

**Section:** 02 --- Agents\
**Course:** Learn AI Agents\
**Publisher:** Thunkx\
**Tagline:** Learn by building.

## Lesson Goal

In **002-004 --- Agent Loop**, we built the repeating cycle:

``` text
Model → function_call → calculator → function_call_output → Model again → repeat
```

That lesson intentionally used `response.output.find(...)` to handle one
requested action at a time.

In **002-005**, we expand the same loop in two different ways:

1.  **Multiple tool types** --- `calculator` and `format_number`.
2.  **Multiple function calls in one model response** --- one turn can
    request several actions.

By the end of the lesson the agent can collect all calls, dispatch each
tool, return an output for every `call_id`, and continue until the model
produces a final answer.

The maximum-iteration guard is deliberately deferred to **002-006 ---
Safety Guard**.

------------------------------------------------------------------------

## PAST → NOW → NEXT

### PAST --- 002-004

``` text
response.output
  ↓
.find(...)
  ↓
toolCall
  ↓
toolOutput
  ↓
Model again
```

### NOW --- 002-005

``` text
response.output
  ↓
.filter(...)
  ↓
toolCalls[]
  ↓
.map(...)
  ↓
toolOutputs[]
  ↓
Model again
```

### NEXT --- 002-006

The route still uses `while (true)` without a maximum-step boundary. The
next lesson adds that safety guard.

------------------------------------------------------------------------

## 1. Multiple Tool Types vs. Multiple Function Calls

These concepts are related, but not identical.

**Multiple tool types** means the model has different capabilities:

``` text
calculator
format_number
```

The application maps model-facing names to implementations:

``` text
"calculator"    → calculator()
"format_number" → formatNumber()
```

**Multiple function calls** means one model response can request more
than one action before the next model turn:

``` text
function_call A
function_call B
```

A response could contain two calls to the same calculator, so multiple
calls do not necessarily imply multiple tool types.

------------------------------------------------------------------------

## 2. The Second Tool: `format_number`

``` ts
export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
```

Example:

``` text
formatNumber(11610) → "11,610"
```

The model-facing name is `format_number`; the application function is
`formatNumber()`.

A **tool definition** tells the model what capability exists. A **tool
implementation** performs the actual work.

------------------------------------------------------------------------

## 3. Tool Dispatch

With several capabilities, the route must execute the implementation
that corresponds to `toolCall.name`:

``` ts
if (toolCall.name === "calculator") {
  // parse calculator arguments
  // execute calculator(...)
} else if (toolCall.name === "format_number") {
  // parse formatter arguments
  // execute formatNumber(...)
} else {
  throw new Error(`Unknown tool: ${toolCall.name}`);
}
```

This explicit mapping matters. The model can request the correct tool
while the application still executes the wrong implementation if
dispatch is broken.

------------------------------------------------------------------------

## 4. Dependent Calls --- Across Multiple Model Turns

Test prompt:

``` text
Use the calculator tool to multiply 27 by 43.
Then multiply that result by 10.
Finally, use the format_number tool to format that result.
```

Observed execution:

``` text
MODEL #1
  ↓
calculator(27, 43)
  ↓
1161

MODEL #2
  ↓
calculator(1161, 10)
  ↓
11610

MODEL #3
  ↓
format_number(11610)
  ↓
"11,610"

MODEL #4
  ↓
no function_call
  ↓
FINAL ANSWER
```

The calls are dependent because Model #2 cannot construct
`calculator(1161, 10)` until it observes `1161`, and Model #3 cannot
construct `format_number(11610)` until it observes `11610`.

This is **sequential dependency across model turns**.

------------------------------------------------------------------------

## 5. Independent Calls --- Within One Model Response

Test prompt:

``` text
Use the calculator tool to do two independent calculations:
(1) multiply 27 by 43, and
(2) multiply 15 by 20.
Give me both results.
```

The model already knows all arguments, so one response can contain:

``` text
              Model #1
                 │
          ┌──────┴──────┐
          ↓             ↓
       call_A         call_B
 calculator(27,43) calculator(15,20)
          ↓             ↓
        1161           300
          └──────┬──────┘
                 ↓
       return both outputs
                 ↓
              Model #2
```

Our logs confirmed two function calls in the same response and two
corresponding results.

The final model text formatted `1161` as `1,161`; `format_number` was
not involved in this independent-call test.

------------------------------------------------------------------------

## 6. `.find()` → `.filter()`

002-004:

``` ts
const toolCall = response.output.find(
  (item) => item.type === "function_call",
);
```

`.find()` returns the first matching item.

002-005:

``` ts
const toolCalls = response.output.filter(
  (item) => item.type === "function_call",
);
```

`.filter()` preserves every matching function call.

`response.output` remains heterogeneous, so we still search by
`item.type`. The difference is singular versus plural:

``` text
.find()   → toolCall
.filter() → toolCalls[]
```

------------------------------------------------------------------------

## 7. The Real `.find()` Failure

Before the fix, the model requested:

``` text
call_A → calculator(27, 43)
call_B → calculator(15, 20)
```

The old `.find()` architecture returned only:

``` text
call_A → output_A: 1161 ✓
call_B → nothing        ✗
```

OpenAI rejected the continuation:

``` text
400 No tool output found for function call ...
```

This experiment proved a key rule:

> Every function call requested in a model response needs a
> corresponding `function_call_output` before continuation.

------------------------------------------------------------------------

## 8. `toolCalls.map(...)`

After collecting all calls, we turn each call into its corresponding
observation:

``` ts
const toolOutputs = toolCalls.map((toolCall) => {
  let result: number | string;

  // dispatch and execute the requested tool

  return {
    type: "function_call_output" as const,
    call_id: toolCall.call_id,
    output: String(result),
  };
});
```

Conceptually:

``` text
toolCalls[]
   │
   ├── call_A → execute → output_A
   └── call_B → execute → output_B
                         ↓
                    toolOutputs[]
```

`.map()` is appropriate because we need one output object for every
requested call.

------------------------------------------------------------------------

## 9. Why `while (true)` AND `toolCalls.map(...)`?

This is the central mental model of 002-005.

Both repeat work, but at different levels:

> **`while` = DEPTH across model turns**\
> **`.map()` = BREADTH across tool calls within one model turn**

### `while (true)` = DEPTH

The outer loop permits repeated model decisions:

``` text
Model #1
  ↓
Model #2
  ↓
Model #3
  ↓
Model #4
```

It answers:

> **Does the agent need another model turn?**

Our dependent example needs this depth because later actions cannot be
chosen until earlier observations exist.

``` text
while iteration #1
  Model #1 → calculator(27,43) → 1161

while iteration #2
  Model #2 → calculator(1161,10) → 11610

while iteration #3
  Model #3 → format_number(11610) → "11,610"

while iteration #4
  Model #4 → no function_call → final answer
```

### `toolCalls.map(...)` = BREADTH

One model response may already contain several calls:

``` text
              Model #1
                 │
          ┌──────┴──────┐
          ↓             ↓
       call_A         call_B
          ↓             ↓
      output_A       output_B
```

`.map()` answers:

> **What do we do with all calls in this turn?**

It handles every action the model has already requested in the current
response.

### Why not only `while`?

Because one response may already contain `call_A` and `call_B`. Both
need outputs before the next model turn. Handling only one reproduces
the missing-output failure.

### Why not only `.map()`?

Because `.map()` can process only calls that already exist. It cannot
decide the model's next action.

After `calculator(27,43)` produces `1161`, the application must return
that observation to the model. The **model** then decides whether the
next action should be `calculator(1161,10)`.

That requires another model turn, which is why the outer `while` exists.

### Both dimensions together

``` text
                    while iteration #1

                         Model #1
                            │
                       toolCalls[]
                            │
                      ┌─────┴─────┐
                      ↓           ↓
                   call_A       call_B
                      ↓           ↓
                  output_A     output_B
                      └─────┬─────┘
                            ↓
                       toolOutputs[]
                            │
                            ↓

                    while iteration #2

                         Model #2
                            │
                           ...
```

Memory aid:

``` text
while = DEPTH
map   = BREADTH
```

------------------------------------------------------------------------

## 10. `.map()` Does Not Mean Parallel JavaScript

In this lesson, `toolCalls.map(...)` executes our deterministic tools
synchronously.

We are **not** teaching:

``` ts
Promise.all(...)
```

or async/concurrent tool execution.

The concept is multiple actions requested in one model response, not
execution speed.

------------------------------------------------------------------------

## 11. `call_id` Correlation

With multiple calls, correlation becomes especially visible:

``` text
call_A → output_A
call_B → output_B
```

Each output preserves the exact request's ID:

``` ts
return {
  type: "function_call_output" as const,
  call_id: toolCall.call_id,
  output: String(result),
};
```

`call_id` tells the model which observation belongs to which requested
function call.

------------------------------------------------------------------------

## 12. Return All Observations Together

002-004 used:

``` ts
input: [toolOutput]
```

002-005 uses:

``` ts
input: toolOutputs
```

Continuation:

``` ts
response = await openai.responses.create({
  model: "gpt-5.6-luna",
  previous_response_id: response.id,
  input: toolOutputs,
  tools: [calculatorTool, formatNumberTool],
});
```

`previous_response_id` continues the interaction; `toolOutputs` supplies
the new observations.

------------------------------------------------------------------------

## 13. How the Loop Stops

``` ts
if (toolCalls.length === 0) {
  return Response.json({
    type: "message",
    text: response.output_text,
    output: response.output,
  });
}
```

The `return` exits the Route Handler and therefore exits `while (true)`.

Conceptually:

``` text
Model response
  ↓
filter function calls
  ↓
zero calls?
  ├── yes → final answer
  └── no  → execute all → return observations → Model again
```

There is still no defensive maximum-iteration limit. That belongs to
002-006.

------------------------------------------------------------------------

## 14. Complete 002-005 Loop

``` ts
let response = await openai.responses.create({
  model: "gpt-5.6-luna",
  input: prompt,
  tools: [calculatorTool, formatNumberTool],
});

while (true) {
  const toolCalls = response.output.filter(
    (item) => item.type === "function_call",
  );

  if (toolCalls.length === 0) {
    return Response.json({
      type: "message",
      text: response.output_text,
      output: response.output,
    });
  }

  const toolOutputs = toolCalls.map((toolCall) => {
    let result: number | string;

    if (toolCall.name === "calculator") {
      const arguments_ = JSON.parse(toolCall.arguments) as {
        operation: CalculatorOperation;
        a: number;
        b: number;
      };

      result = calculator(
        arguments_.operation,
        arguments_.a,
        arguments_.b,
      );
    } else if (toolCall.name === "format_number") {
      const arguments_ = JSON.parse(toolCall.arguments) as {
        value: number;
      };

      result = formatNumber(arguments_.value);
    } else {
      throw new Error(`Unknown tool: ${toolCall.name}`);
    }

    return {
      type: "function_call_output" as const,
      call_id: toolCall.call_id,
      output: String(result),
    };
  });

  response = await openai.responses.create({
    model: "gpt-5.6-luna",
    previous_response_id: response.id,
    input: toolOutputs,
    tools: [calculatorTool, formatNumberTool],
  });
}
```

Read it as:

``` text
FILTER → STOP? → MAP → CONTINUE → repeat
```

------------------------------------------------------------------------

## 15. Debugging Lesson: Correct-Looking Answer ≠ Correct Pipeline

During development, `format_number(11610)` was accidentally dispatched
through `calculator()`.

The application produced:

``` text
undefined
```

yet the model still eventually returned:

``` text
11,610
```

So:

> A correct-looking final answer does not prove that the tool pipeline
> executed correctly.

During development inspect:

``` text
requested tool
  ↓
arguments
  ↓
selected implementation
  ↓
tool result
  ↓
observation
  ↓
next model decision
```

The temporary `TOOL CALLS` and `TOOL RESULT` logs helped reveal what
actually happened.

------------------------------------------------------------------------

## 16. Zero · One · Many

The plural architecture naturally handles all cases.

``` text
0 calls
→ return final answer

1 call
→ [call_A]
→ .map()
→ [output_A]

2+ calls
→ [call_A, call_B, ...]
→ .map()
→ [output_A, output_B, ...]
```

One call is simply an array containing one item.

------------------------------------------------------------------------

## 17. Functional Tests

### Dependent calculator → calculator → formatter

``` bash
curl -s -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Use the calculator tool to multiply 27 by 43. Then multiply that result by 10. Finally, use the format_number tool to format that result."}' | jq
```

Observed sequence:

``` text
calculator(27,43) → 1161
calculator(1161,10) → 11610
format_number(11610) → "11,610"
```

**PASS**

### Independent calls in one response

``` bash
curl -s -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Use the calculator tool to do two independent calculations: (1) multiply 27 by 43, and (2) multiply 15 by 20. Give me both results."}' | jq
```

Observed:

``` text
calculator(27,43) → 1161
calculator(15,20) → 300
```

**PASS**

### Historical `.find()` failure

``` text
400 No tool output found for function call ...
```

**CONFIRMED before fix**

### No-tool prompt

``` bash
curl -s -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Say hello in one short sentence."}' | jq
```

Observed `TOOL CALLS: []`.

**PASS**

### Input validation

Empty prompt, whitespace-only prompt, and non-string prompt all
returned:

``` text
HTTP 400
{"error":"Prompt is required."}
```

**PASS**

### Lint

``` bash
pnpm lint
```

Zero errors and zero warnings.

**PASS**

### Production build

``` bash
pnpm build
```

Observed successful compilation, TypeScript checking, page generation,
and final optimization.

**PASS**

------------------------------------------------------------------------

## 18. Test Matrix

  -----------------------------------------------------------------------
  Test                    What it proves          Result
  ----------------------- ----------------------- -----------------------
  Dependent calculator →  Sequential dependencies PASS
  calculator → formatter  across model turns

  Two independent         Multiple calls in one   PASS
  calculator calls        response

  Historical `.find()`    Every requested call    CONFIRMED
  test                    needs an output

  No-tool prompt          Zero-call termination   PASS
                          works

  Single calculator call  Plural architecture     PASS
                          handles one call

  Empty prompt            Input validation        PASS

  Whitespace prompt       Input validation        PASS

  Non-string prompt       Input validation        PASS

  `pnpm lint`             Static validation       PASS

  `pnpm build`            Production/TypeScript   PASS
                          validation
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 19. Current Lesson Boundary

Implemented:

``` text
✓ calculator + format_number
✓ multiple tool types
✓ dispatch by toolCall.name
✓ dependent calls across turns
✓ independent calls in one response
✓ .filter() → toolCalls[]
✓ .map() → toolOutputs[]
✓ call_id correlation
✓ previous_response_id continuation
✓ zero / one / many calls
✓ final-answer termination
```

Not introduced:

``` text
✗ maximum-iteration safety guard
✗ runtime schema validation
✗ Agent UI
✗ Promise.all / async tool concurrency
```

------------------------------------------------------------------------

## 20. Final Mental Model

``` text
                         MODEL
                           │
                           ↓
                    response.output
                           │
                           ↓
                  filter function_calls
                           │
                    ┌──────┴──────┐
                    │             │
                zero calls      1+ calls
                    │             │
                    ↓             ↓
              FINAL ANSWER    toolCalls[]
                                  │
                                  ↓
                                .map()
                                  │
                    ┌─────────────┼─────────────┐
                    ↓             ↓             ↓
                 call_A        call_B         call_C
                    ↓             ↓             ↓
                output_A      output_B       output_C
                    └─────────────┼─────────────┘
                                  ↓
                             toolOutputs[]
                                  │
                                  ↓
                         MODEL AGAIN ↻
```

Two dimensions:

``` text
DEPTH
while (true)
Model → Model → Model → ...

BREADTH
toolCalls.map(...)
call_A + call_B + ... → output_A + output_B + ...
```

------------------------------------------------------------------------

## Key Takeaways

-   Multiple **tool types** are available capabilities; multiple **tool
    calls** are requested actions.
-   Dependent calls require later model turns because later arguments
    depend on earlier observations.
-   Independent calls can appear together in one model response.
-   `.find()` becomes `.filter()` so every requested call is preserved.
-   `.map()` creates one `function_call_output` per call.
-   **`while` = depth across model turns.**
-   **`.map()` = breadth within one model turn.**
-   `.map()` here does not imply concurrent JavaScript.
-   `call_id` correlates every observation with its request.
-   A correct-looking final answer does not prove correct tool
    execution.

------------------------------------------------------------------------

# Next --- 002-006: Safety Guard

The agent is now capable of repeatedly handling zero, one, or many
requested actions.

But the outer loop still has no maximum-step boundary:

``` ts
while (true)
```

In **002-006**, we will make that loop safer by bounding how long the
agent may continue requesting actions.

## Final Memory Aid

``` text
002-004 taught the LOOP.
002-005 makes the loop PLURAL.

.filter() finds ALL calls.
.map() creates ALL outputs.

while = DEPTH.
map   = BREADTH.

Every requested call needs an observation.

Correct-looking final answer ≠ proven-correct execution.
```
