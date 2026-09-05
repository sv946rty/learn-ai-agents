# 002-006 --- Safety Guard

> **Section 02 --- Agents**\
> **Learn AI Agents** by **Thunkx**\
> **Learn by building.**

## Lesson Goal

In 002-005, our agent learned two dimensions:

``` text
while (true)       = DEPTH across tool rounds
toolCalls.map(...) = BREADTH inside one tool round
```

The agent could use multiple tool types, execute every function call
returned in one model response, and continue across dependent model
turns. But the depth was still unbounded.

In this lesson, we add one explicit application safety policy:

``` ts
const MAX_TOOL_ROUNDS = 5;
```

The application will execute at most five **tool-execution rounds** for
one request.

------------------------------------------------------------------------

## From 002-005: Depth and Breadth

### Dependent calls = depth

``` text
Model #1 → calculator(27, 43) → 1161
Model #2 → calculator(1161, 10) → 11610
Model #3 → format_number(11610) → "11,610"
Model #4 → Final Answer
```

Later actions need earlier observations, so they require multiple model
turns. The outer `while (true)` handles this depth.

### Independent calls = breadth

One model response may request:

``` text
calculator(27, 43)
calculator(15, 20)
```

We preserve every function call with:

``` ts
const toolCalls = response.output.filter(
  (item) => item.type === "function_call",
);
```

and execute every requested call with:

``` ts
const toolOutputs = toolCalls.map((toolCall) => {
  // execute each requested tool
});
```

The `.map()` handles breadth inside one tool round.

Keep this mental model:

``` text
MODEL CALLS
    ↓
TOOL ROUNDS       ← DEPTH
    ↓
TOOL CALLS        ← BREADTH within each round
```

------------------------------------------------------------------------

## Why Do We Need a Safety Guard?

`while (true)` is useful because the agent can keep reasoning after each
tool observation. But that same freedom creates a practical risk: the
model may keep deciding that it needs **one more tool call** instead of
finishing.

A problematic loop does not have to repeat the exact same arguments. The
model can repeatedly search, calculate, verify, or refine with slightly
different inputs while still failing to reach a stopping decision.

### Example 1 --- Self-correcting calculation loop

``` text
Keep calculating the square root of 2 until you are 100% sure it is correct.
If you have any doubt, calculate it again.
```

The model may calculate, observe, decide that another verification would
increase confidence, and call the calculator again. The phrase **"100%
sure"** provides no concrete programmatic stopping boundary.

### Example 2 --- Repeated search/refinement loop

Imagine an agent with a web-search tool:

``` text
Search the web for the most recent news about OpenAI.
Make sure you have the latest information.
If newer information might exist, search again.
```

The model could repeatedly reason that another query or source might be
newer:

``` text
Search → observe → maybe something newer → search again → observe → ...
```

### Example 3 --- Verification loop

``` text
Use the calculator tool to solve this problem.
Then verify your answer.
If you are not completely certain, check it again until you are certain.
```

The agent may alternate between:

``` text
calculate → observe → verify → calculate → observe → verify → ...
```

Each individual call can be correct while the overall agent still fails
to stop.

### Example 4 --- Ambiguous optimization goal

Imagine an agent with research or comparison tools:

``` text
Find the best option.
Keep comparing until you are absolutely sure it is the best.
```

"Best" and "absolutely sure" do not tell the application when execution
must stop. The model may keep requesting more comparisons, sources, or
calculations.

### Why is this dangerous?

Without an application-side boundary, excessive tool rounds can cause:

-   unnecessary model-token usage,
-   unnecessary API and tool costs,
-   slower responses,
-   repeated calls to external services,
-   provider rate-limit or timeout failures,
-   requests that take a very long time to finish,
-   or, in a pathological case, an agent that never reaches a final
    answer.

The important lesson is:

> **Good prompting is not a safety boundary.**

We can ask the model to stop when it is finished, but the application
should enforce its own deterministic limit:

``` text
Model:       decides what it wants to do next
Application: decides whether another tool round is allowed
```

That is why `MAX_TOOL_ROUNDS` belongs in application code rather than
only in the prompt.

The guard does not assume every agent will loop forever. It guarantees
that even if the model keeps requesting tools, the request cannot
execute more than the application-defined maximum number of tool rounds.

------------------------------------------------------------------------

## The New Problem: Unbounded Depth

Before this lesson, the loop could conceptually continue indefinitely:

``` ts
while (true) {
  // inspect the model response
  // execute requested tools
  // send observations back
  // ask the model again
}
```

We need the loop because we cannot know in advance how many dependent
decisions a useful task requires. But the application should still
decide how much tool execution it will permit.

------------------------------------------------------------------------

## What Exactly Are We Counting?

The word **step** is ambiguous in an agent loop. We distinguish three
counts.

### 1. Model calls

A model call is one request to the AI model.

For a no-tool prompt:

``` text
Model calls:            1
Tool rounds:            0
Individual tool calls:  0
```

### 2. Tool rounds

A tool round is one model response whose requested tools are executed
and whose observations are sent back to the model.

For one calculator request:

``` text
Model #1
   ↓
calculator(27, 43)
   ↓
1161
   ↓
Model #2 → Final Answer
```

Counts:

``` text
Model calls:            2
Tool rounds:            1
Individual tool calls:  1
```

### 3. Individual tool calls

One tool round may contain multiple calls:

``` text
              ┌→ calculator(27, 43)
Model #1 ─────┤
              └→ calculator(15, 20)
                       ↓
                    Model #2
```

Counts:

``` text
Model calls:            2
Tool rounds:            1
Individual tool calls:  2
```

Our safety problem is unbounded **depth**, not breadth.

> **One counted safety unit = one tool-execution round.**

------------------------------------------------------------------------

## Add the Safety Policy

Before the loop:

``` ts
const MAX_TOOL_ROUNDS = 5;
let toolRound = 0;
```

`MAX_TOOL_ROUNDS` is the application policy.

`toolRound` records how many tool rounds have already been permitted for
the current request.

The value `5` is a course-friendly demonstration value, not a universal
production recommendation.

------------------------------------------------------------------------

## Where Should the Guard Go?

First collect all function calls:

``` ts
const toolCalls = response.output.filter(
  (item) => item.type === "function_call",
);
```

Then check whether the model has finished:

``` ts
if (toolCalls.length === 0) {
  return Response.json({
    type: "message",
    text: response.output_text,
    output: response.output,
  });
}
```

Only if another tool round is requested do we check the safety limit:

``` ts
if (toolRound >= MAX_TOOL_ROUNDS) {
  return Response.json(
    {
      error: `Agent stopped after ${MAX_TOOL_ROUNDS} tool rounds.`,
    },
    { status: 422 },
  );
}
```

If allowed:

``` ts
toolRound++;
```

Then execute all calls in that round.

The order is:

``` text
1. Inspect model response
        ↓
2. No tool calls?
   YES → return final answer
   NO  → continue
        ↓
3. toolRound >= MAX_TOOL_ROUNDS?
   YES → stop with 422
   NO  → continue
        ↓
4. toolRound++
        ↓
5. Execute every requested tool
        ↓
6. Send observations to model
        ↓
7. Repeat
```

------------------------------------------------------------------------

## Why Check the Final Answer First?

This avoids an off-by-one bug.

After Round #5:

``` text
toolRound = 5
```

The model still needs to observe Round #5 and decide whether it is
finished.

If its next response contains no tool calls, we should return that final
answer normally.

Therefore:

``` text
5 rounds + FINISH        → 200 OK
5 rounds + request #6    → 422 STOP
```

The guard limits **another tool execution round**. It does not reject a
final answer merely because five rounds have already completed.

------------------------------------------------------------------------

## Off-by-One Walkthrough

With a maximum of five:

``` text
Round #1: 0 >= 5 ? NO → increment → execute
Round #2: 1 >= 5 ? NO → increment → execute
Round #3: 2 >= 5 ? NO → increment → execute
Round #4: 3 >= 5 ? NO → increment → execute
Round #5: 4 >= 5 ? NO → increment → execute
```

After Round #5:

``` text
toolRound = 5
```

If the next response is final, it succeeds.

If the next response requests tools:

``` text
5 >= 5 ? YES
```

Round #6 is blocked **before execution**.

------------------------------------------------------------------------

## The 002-006 Agent Loop

The important structure is:

``` ts
const MAX_TOOL_ROUNDS = 5;
let toolRound = 0;

while (true) {
  const toolCalls = response.output.filter(
    (item) => item.type === "function_call",
  );

  console.log("TOOL CALLS:", toolCalls);

  if (toolCalls.length === 0) {
    return Response.json({
      type: "message",
      text: response.output_text,
      output: response.output,
    });
  }

  if (toolRound >= MAX_TOOL_ROUNDS) {
    return Response.json(
      {
        error: `Agent stopped after ${MAX_TOOL_ROUNDS} tool rounds.`,
      },
      { status: 422 },
    );
  }

  toolRound++;

  const toolOutputs = toolCalls.map((toolCall) => {
    // Dispatch and execute each requested tool.
    // Return one function_call_output per call.
  });

  response = await openai.responses.create({
    model: "gpt-5.6-luna",
    previous_response_id: response.id,
    input: toolOutputs,
    tools: [calculatorTool, formatNumberTool],
  });
}
```

What remains unchanged:

``` text
.filter()              → preserves every function call
.map()                 → executes every call in this round
call_id                → correlates calls with observations
previous_response_id   → continues the conversation
while (true)           → provides agent depth
```

We did not replace the agent loop. We **bounded** it.

------------------------------------------------------------------------

## Safety Guard vs. Multiple Calls

The safety counter increments once per tool round:

``` ts
toolRound++;
```

It does not increment once per item in:

``` ts
toolCalls.map(...)
```

If one response requests two independent calls:

``` text
call_A → calculator(27, 43)
call_B → calculator(15, 20)
```

then:

``` text
toolRound++    → once
.map(...)      → handles call_A and call_B
```

So:

``` text
while + safety guard = DEPTH
.map()                = BREADTH
```

------------------------------------------------------------------------

## Why HTTP 422?

At the limit we intentionally return:

``` ts
return Response.json(
  {
    error: `Agent stopped after ${MAX_TOOL_ROUNDS} tool rounds.`,
  },
  { status: 422 },
);
```

This is an intentional application-policy stop, not an unexpected server
crash. For this lesson, `422` gives us a clear observable signal that
another tool round was refused.

------------------------------------------------------------------------

## Functional Tests

### No tool required

``` bash
curl -s -X POST http://localhost:3000/api/agents   -H "Content-Type: application/json"   -d '{"prompt":"Say hello in one short sentence."}' | jq
```

Observed:

``` text
Hello!

Model calls:            1
Tool rounds:            0
Individual tool calls:  0
```

### One calculator call

``` bash
curl -s -X POST http://localhost:3000/api/agents   -H "Content-Type: application/json"   -d '{"prompt":"Use the calculator tool to multiply 27 by 43."}' | jq
```

Observed:

``` text
1161

Model calls:            2
Tool rounds:            1
Individual tool calls:  1
```

### Dependent tool rounds

Prompt:

``` text
Use the calculator tool to multiply 27 by 43.
Then multiply that result by 10.
Finally, use the format_number tool to format that result.
```

Observed:

``` text
Model #1 → calculator(27, 43) → 1161
Model #2 → calculator(1161, 10) → 11610
Model #3 → format_number(11610) → "11,610"
Model #4 → Final Answer

Model calls:            4
Tool rounds:            3
Individual tool calls:  3
```

### Multiple calls in one round

Prompt:

``` text
Use the calculator tool to do two independent calculations:
(1) multiply 27 by 43, and
(2) multiply 15 by 20.
Give me both results.
```

Observed semantic results:

``` text
27 × 43 → 1161
15 × 20 → 300

Model calls:            2
Tool rounds:            1
Individual tool calls:  2
```

Two tool calls do not automatically mean two tool rounds.

------------------------------------------------------------------------

## Boundary Test --- Exactly Five Rounds Then Finish

We deliberately tested five dependent calculator rounds:

``` text
Round #1 → 4
Round #2 → 8
Round #3 → 16
Round #4 → 32
Round #5 → 64
          ↓
       FINISH
```

Observed:

``` text
HTTP 200
Final answer: 64
```

This proves exactly five tool rounds are allowed and validates the
final-answer-before-guard ordering.

------------------------------------------------------------------------

## Safety Test --- Request a Sixth Round

We then forced six dependent calculator rounds.

The logs showed:

``` text
Round #1 → calculator(2, 2)   → 4
Round #2 → calculator(4, 2)   → 8
Round #3 → calculator(8, 2)   → 16
Round #4 → calculator(16, 2)  → 32
Round #5 → calculator(32, 2)  → 64
```

The next model response requested:

``` text
calculator(64, 2)
```

But there was no:

``` text
TOOL RESULT: calculator 128
```

because Round #6 was blocked before execution.

Observed:

``` text
HTTP 422
{"error":"Agent stopped after 5 tool rounds."}
```

Counts:

``` text
Model calls:             6
Tool rounds requested:   6
Tool rounds executed:    5
Individual tools run:    5
```

The sixth model call is necessary because the application must first let
the model decide whether to finish or request another tool round.

------------------------------------------------------------------------

## Regression Verification

We verified:

``` text
✓ No-tool response
✓ One calculator call
✓ Dependent calculator → calculator → format_number
✓ Two independent calls in one response
✓ Exactly five rounds then finish → 200
✓ Sixth requested round → 422
✓ Empty prompt → 400
✓ Whitespace-only prompt → 400
✓ Non-string prompt → 400
```

Formal verification also passed:

``` bash
pnpm lint
pnpm build
```

------------------------------------------------------------------------

## What This Lesson Does Not Do

002-006 deliberately adds only one safety mechanism.

It does **not** introduce:

-   runtime schema validation,
-   token budgets,
-   cost budgets,
-   time budgets,
-   `Promise.all(...)`,
-   asynchronous tool concurrency,
-   Agent UI.

Those concepts would distract from the lesson boundary:

> **Bound the depth of the agent loop.**

------------------------------------------------------------------------

## Architecture After 002-006

``` text
USER PROMPT
    ↓
MODEL RESPONSE
    ↓
filter function_call items
    ↓
Any tool calls?
    ├── NO ───────────────→ FINAL ANSWER
    │
    └── YES
         ↓
    toolRound >= 5?
         ├── YES ─────────→ 422 SAFETY STOP
         │
         └── NO
              ↓
         toolRound++
              ↓
         map ALL tool calls
              ↓
         execute tools
              ↓
         function_call_output[]
              ↓
         MODEL AGAIN
              ↺
```

The key architecture is:

``` text
.map()              → handles BREADTH
while (true)        → enables DEPTH
MAX_TOOL_ROUNDS     → bounds DEPTH
```

------------------------------------------------------------------------

## Definition of Done

-   [x] Existing agent loop preserved
-   [x] `MAX_TOOL_ROUNDS` defined
-   [x] Tool rounds counted explicitly
-   [x] Guard checked before another round executes
-   [x] Final answer checked before the guard
-   [x] Exactly five rounds can finish normally
-   [x] Sixth requested round is blocked
-   [x] Multiple calls inside one allowed round still execute
-   [x] Inherited API behavior passes regression testing
-   [x] Lesson page explains the safety boundary
-   [x] `pnpm lint` passes
-   [x] `pnpm build` passes
-   [x] Lesson infographic created

------------------------------------------------------------------------

## Takeaway

The model decides **what action it wants next**.

The application decides **whether another tool round is still allowed**.

``` text
while gives the agent depth.

MAX_TOOL_ROUNDS bounds that depth.

.map() executes all calls inside each allowed round.
```

That is our first explicit execution safety boundary.

------------------------------------------------------------------------

## Next --- 002-007: Agent UI

Our backend agent can now choose tools, execute them, observe results,
continue across dependent turns, handle multiple calls in one response,
and stop at an application-defined safety boundary.

Next, we make that agent accessible through a user-facing interface.

``` text
Agent Loop
    ↓
Safety Guard
    ↓
Agent UI
```
