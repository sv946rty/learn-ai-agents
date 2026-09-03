# 002-003 — Calculator Tool

## From Model Request to Real Execution

In the previous lesson, **002-002 — Function/Tool Calling**, we gave the model a structured way to request an action.

The important boundary was:

```text
Model
  ↓
function_call
  ↓
STOP
```

The model could ask our application to use a tool, but the application did not execute anything yet.

In **002-003**, we move one step further:

```text
Model
  ↓
function_call
  ↓
JSON.parse(arguments)
  ↓
calculator(...)
  ↓
result
  ↓
STOP
```

This is the lesson where a tool request becomes **real application execution**.

> **Key idea:** The model requests an action. The application executes real code.

---

## 1. What changed from 002-002?

In 002-002, we declared a teaching tool named `get_weather`.

The model could return a structured request such as:

```json
{
  "type": "function_call",
  "name": "get_weather",
  "arguments": "{\"location\":\"San Jose, CA\"}",
  "callId": "call_..."
}
```

But there was no `getWeather()` implementation.

No weather lookup happened.

That was intentional. We wanted to isolate one concept:

> A `function_call` is a request from the model, not proof that the application executed a function.

Now we replace that teaching-only capability with something we can really execute: a calculator.

---

## 2. Create the real calculator

Create:

```text
src/lib/agents/calculator.ts
```

```ts
export type CalculatorOperation =
    | "add"
    | "subtract"
    | "multiply"
    | "divide";

export function calculator(
    operation: CalculatorOperation,
    a: number,
    b: number,
) {
    switch (operation) {
        case "add":
            return a + b;

        case "subtract":
            return a - b;

        case "multiply":
            return a * b;

        case "divide":
            return a / b;
    }
}
```

This is ordinary deterministic TypeScript.

There is no model involved in the arithmetic.

For example:

```ts
calculator("multiply", 27, 43)
```

returns:

```text
1161
```

That distinction will matter throughout the Agents section.

---

## 3. Tool definition vs. tool implementation

We now have two different things that happen to share the name **calculator**.

### Model-facing tool definition

The OpenAI request describes a capability:

```ts
{
    type: "function",
    name: "calculator",
    description: "Perform basic arithmetic using two numbers.",
    parameters: {
        type: "object",
        properties: {
            operation: {
                type: "string",
                enum: ["add", "subtract", "multiply", "divide"],
            },
            a: {
                type: "number",
            },
            b: {
                type: "number",
            },
        },
        required: ["operation", "a", "b"],
        additionalProperties: false,
    },
    strict: true,
}
```

This tells the **model**:

- a calculator capability exists;
- which operations are available;
- which arguments it must provide.

It does **not** execute arithmetic.

### Application-side implementation

Our real TypeScript function is:

```ts
calculator(operation, a, b)
```

This tells our **application** how to perform the operation.

So:

```text
MODEL SIDE                      APPLICATION SIDE

name: calculator               calculator(...)
operation                      switch(operation)
a                              real arithmetic
b
```

There is no magical connection between:

```ts
name: "calculator"
```

and:

```ts
function calculator(...) { ... }
```

Our application must explicitly connect them.

---

## 4. Update `/api/agents`

Import the calculator:

```ts
import {
    calculator,
    type CalculatorOperation,
} from "@/lib/agents/calculator";
```

Then give the model the calculator tool definition:

```ts
const response = await openai.responses.create({
    model: "gpt-5.6-luna",
    input: prompt,
    tools: [
        {
            type: "function",
            name: "calculator",
            description: "Perform basic arithmetic using two numbers.",
            parameters: {
                type: "object",
                properties: {
                    operation: {
                        type: "string",
                        enum: [
                            "add",
                            "subtract",
                            "multiply",
                            "divide",
                        ],
                    },
                    a: {
                        type: "number",
                    },
                    b: {
                        type: "number",
                    },
                },
                required: ["operation", "a", "b"],
                additionalProperties: false,
            },
            strict: true,
        },
    ],
});
```

The model can now decide whether to request the calculator or answer normally.

---

## 5. The model requests the calculator

Try:

```bash
curl -s -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Use the calculator tool to multiply 27 by 43."}' | jq
```

The model can produce a `function_call` whose arguments represent:

```json
{
  "operation": "multiply",
  "a": 27,
  "b": 43
}
```

But there is an important detail.

OpenAI returns `output.arguments` as a **JSON string**.

Conceptually, it looks like:

```text
"{\"operation\":\"multiply\",\"a\":27,\"b\":43}"
```

Our calculator cannot conveniently consume that string directly.

First, the application needs to parse it.

---

## 6. Parse the arguments

Inside the `function_call` branch:

```ts
const arguments_ = JSON.parse(output.arguments) as {
    operation: CalculatorOperation;
    a: number;
    b: number;
};
```

Now:

```ts
arguments_.operation
```

is:

```text
multiply
```

and:

```ts
arguments_.a
```

is:

```text
27
```

while:

```ts
arguments_.b
```

is:

```text
43
```

The flow has advanced from:

```text
function_call
```

to:

```text
function_call
  ↓
JSON.parse()
  ↓
JavaScript values
```

### A TypeScript detail

The `as { ... }` portion gives TypeScript information about the shape we expect.

It is **not runtime validation**.

For this lesson, the strict tool schema keeps the example focused. More defensive validation and safety concerns belong later in the course.

---

## 7. Execute the real tool

Now comes the key line in this lesson:

```ts
const result = calculator(
    arguments_.operation,
    arguments_.a,
    arguments_.b,
);
```

For our example, this becomes conceptually:

```ts
calculator("multiply", 27, 43)
```

The TypeScript function executes:

```ts
return a * b;
```

and produces:

```text
1161
```

This number was produced by **our application code**.

OpenAI did not reach into our project and automatically execute `calculator()`.

The sequence is:

```text
Model
  ↓
requests calculator
  ↓
Application
  ↓
parses arguments
  ↓
calls calculator()
  ↓
JavaScript performs arithmetic
  ↓
1161
```

---

## 8. Return the teaching-friendly API response

For this lesson, `/api/agents` returns:

```ts
return Response.json({
    type: output.type,
    name: output.name,
    arguments: arguments_,
    result,
    callId: output.call_id,
});
```

A real response looks like:

```json
{
  "type": "function_call",
  "name": "calculator",
  "arguments": {
    "operation": "multiply",
    "a": 27,
    "b": 43
  },
  "result": 1161,
  "callId": "call_..."
}
```

Notice the progression from 002-002.

Previously we had only the model's request.

Now we also have:

```json
"result": 1161
```

That result exists because the application executed real code.

---

## 9. Why keep `callId`?

The model's function request has a `call_id`.

Our route exposes it as:

```ts
callId: output.call_id
```

For 002-003, we are mostly preserving it so we can see the identity of the requested function call.

Its importance becomes clearer in **002-004**.

When we return a tool result to the model, the call ID lets the API associate the observation with the function call that requested it.

For now:

```text
function_call
  ↓
callId
  ↓
calculator result
  ↓
STOP
```

We do not send the result back to the model yet.

---

## 10. The model can still answer normally

Giving the model a calculator does not mean every prompt must use it.

Try:

```bash
curl -s -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Say hello in one word. Do not use any tool."}' | jq
```

We observed:

```json
{
  "type": "message",
  "text": "Hello"
}
```

So the decision still looks like:

```text
                         Model
                           ↓
                        Decision
                      ┌────┴────┐
                      ↓         ↓
               function_call   message
                      ↓         ↓
                calculator()   answer
                      ↓        directly
                   result
```

Tool availability is not the same as forced tool usage.

---

## 11. Test all calculator operations

We tested all four operations.

### Add

```text
20 + 5
```

Result:

```text
25
```

### Subtract

```text
20 - 8
```

Result:

```text
12
```

### Multiply

```text
6 × 7
```

Result:

```text
42
```

### Divide

```text
20 ÷ 4
```

Result:

```text
5
```

The model decides which structured operation to request.

The actual arithmetic remains deterministic application code.

---

## 12. The complete 002-003 flow

We can now describe the application as:

```text
User Prompt
    ↓
/api/agents
    ↓
OpenAI Responses API
    ↓
Model
    ↓
Decision
   ┌┴────────────────┐
   ↓                 ↓
function_call      message
   ↓                 ↓
JSON.parse()       normal answer
   ↓
calculator(...)
   ↓
real result
   ↓
STOP
```

For our example:

```text
"Use the calculator tool to multiply 27 by 43."
                    ↓
                  Model
                    ↓
              function_call
                    ↓
 operation="multiply", a=27, b=43
                    ↓
               JSON.parse()
                    ↓
     calculator("multiply", 27, 43)
                    ↓
                  1161
                    ↓
                   STOP
```

---

## 13. What this lesson does NOT do

The application now executes a real tool, but this is **not yet the complete agent loop**.

### No observation returned to the model

We have:

```text
calculator()
  ↓
1161
```

but not:

```text
1161
  ↓
Model
```

### No model-again step

The model does not see the result and make another decision.

### No repeating loop

We are not doing:

```text
Model
  ↓
Tool
  ↓
Observation
  ↓
Model
  ↓
Tool
  ↓
Observation
  ↓
...
```

That belongs to the next lesson.

> **Current boundary:** The application executes the tool and produces a result, but the result is not returned to the model.

---

## 14. Why not build the loop immediately?

The course is intentionally separating three concepts.

### 002-003 — Calculator Tool

Can the **application execute** a tool requested by the model?

```text
Model → Tool Request → Application Execution → Result → STOP
```

### 002-004 — Agent Loop

Can the **model observe the result and decide again**?

```text
Model → Tool → Observation → Model → ...
```

### 002-005 — Multiple Tool Calls

Can the model choose among multiple available capabilities across those decisions?

Keeping these lessons separate makes it much easier to understand which part of the architecture is responsible for each behavior.

---

## 15. Preview: 002-004 Agent Loop

A useful next prompt is:

```text
Multiply 27 by 43. Then multiply that result by 10.
```

The desired future flow is:

```text
Model
  ↓
calculator(27 × 43)
  ↓
1161
  ↓
Model again
  ↓
calculator(1161 × 10)
  ↓
11610
  ↓
Model again
  ↓
Final Answer
```

That requires something we intentionally do not have yet:

```text
tool result
    ↓
observation returned to model
    ↓
model makes next decision
```

That repeating decision process is the **Agent Loop**.

---

## Final mental model

The most important lesson from 002-003 is not the calculator itself.

It is the separation of responsibilities:

```text
MODEL
  ↓
decides what action to request

APPLICATION
  ↓
parses the request
  ↓
executes trusted application code
  ↓
produces a result
```

Or, in one sentence:

> **The model requests. The application executes.**

We now have a real tool result.

Next, we will teach the model how to **observe that result and continue**.
