# 002-007 — Agent UI

**Section 02 · Agents**
**Learn AI Agents · by Thunkx**
**Learn by building.**

## Goal

In the previous lessons, we built the agent backend step by step. It can call tools, continue across dependent model turns, execute multiple tool calls in one round, and stop at an application-defined safety boundary.

Until now, we mostly interacted with that backend using `curl`.

In this lesson, we give the existing agent a browser interface.

The key idea is:

```text
The UI does not become the agent.
The UI gives the existing agent an interface.
```

The browser handles presentation and interaction. The server continues to handle agent execution.

## PAST — 002-006: Safety Guard

At the end of 002-006, our backend already supported:

- `calculator` and `format_number`
- dependent tool rounds
- multiple tool calls in one model response
- `.filter()` to collect all function calls in a response
- `.map()` to execute all calls in one tool round
- `previous_response_id` to continue across model turns
- `MAX_TOOL_ROUNDS = 5`
- normal completion after the fifth permitted round
- HTTP `422` when a sixth tool round is requested

Conceptually:

```text
User prompt
    ↓
Model
    ↓
Tool calls?
    ↓
Safety guard
    ↓
Execute all requested tools
    ↓
Observations
    ↓
Model again
```

That backend is already the agent. We do **not** rebuild it in this lesson.

## NOW — 002-007: Agent UI

We add a browser interface around the existing API:

```text
page.tsx
Server Component
    ↓
<AgentDemo />
Client Component
    ↓
React state
    ↓
fetch("/api/agents")
    ↓
Existing server-side agent
    ↓
JSON response
    ↓
React state
    ↓
UI re-renders
```

The browser handles **presentation and request state**. The server handles **agent execution**.

## 1. Why Add an Agent UI?

`curl` was useful while developing the API:

```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Use the calculator tool to multiply 27 by 43."
  }'
```

It lets us inspect the request and response directly. But an end user should not need a terminal.

A browser UI gives us:

```text
Prompt textarea
      ↓
Run Agent
      ↓
Loading...
      ↓
Answer or Error
```

Changing the interface does not require changing how the agent works.

## 2. Keep `page.tsx` as a Server Component

The lesson page contains mostly static teaching content. It does not need React state, browser event handlers, or `fetch()`.

So `src/app/learn/02-agents/page.tsx` remains a Server Component.

The interactive portion lives in:

```text
src/components/learn/agent-demo.tsx
```

and begins with:

```tsx
"use client";
```

Architecture:

```text
page.tsx
SERVER COMPONENT
     │
     └── <AgentDemo />
              CLIENT COMPONENT
                    │
                    └── /api/agents
                           SERVER
```

We do not turn the entire lesson page into a Client Component just because one small part needs browser interaction.

## 3. The `AgentDemo` Client Component

`AgentDemo` needs browser-side interactivity:

```tsx
"use client";

import { useState } from "react";
```

The client boundary is needed because the component responds to typing, `onChange`, button clicks, request progress, successful responses, and errors.

## 4. Four UI States

```tsx
const [prompt, setPrompt] = useState("");
const [answer, setAnswer] = useState("");
const [error, setError] = useState("");
const [isLoading, setIsLoading] = useState(false);
```

- `prompt` — text currently entered by the user.
- `answer` — successful final answer returned by the agent API.
- `error` — API or network error shown to the user.
- `isLoading` — whether the browser is waiting for the agent.

Together:

```text
prompt
loading
answer
error
```

form the basic state model for this UI.

## 5. Controlled Prompt Input

```tsx
<textarea
  id="agent-prompt"
  value={prompt}
  onChange={(event) => setPrompt(event.target.value)}
  placeholder="Ask the agent to use its tools..."
  rows={5}
/>
```

Flow:

```text
User types
    ↓
onChange(event)
    ↓
setPrompt(event.target.value)
    ↓
prompt state changes
    ↓
React re-renders
```

React state is the source of truth for the textarea value.

## 6. Starting an Agent Request

At the beginning of each request:

```tsx
setIsLoading(true);
setAnswer("");
setError("");
```

This enters loading state and clears stale answer/error state.

Simplified:

```tsx
async function runAgent() {
  setIsLoading(true);
  setAnswer("");
  setError("");

  try {
    // POST to /api/agents
  } catch {
    // Handle request failure.
  } finally {
    setIsLoading(false);
  }
}
```

## 7. Calling `/api/agents`

```tsx
const response = await fetch("/api/agents", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ prompt }),
});
```

This sends the same API contract we previously exercised with `curl`:

```text
POST /api/agents
Content-Type: application/json

{ "prompt": "..." }
```

The transport changed. The agent API did not.

## 8. What Happens on the Server?

Once `/api/agents` receives the prompt, the existing agent takes over:

```text
Browser
   ↓
POST /api/agents
   ↓
Model
   ↓
Tool calls?
   │
   ├── No → final answer
   │
   └── Yes
        ↓
     safety guard
        ↓
     execute tools
        ↓
     observations
        ↓
     model again
```

The browser does not reproduce the agent loop. It waits for the API outcome.

## 9. Reading the JSON Response

```tsx
const data = (await response.json()) as {
  text?: string;
  error?: string;
};
```

Successful response:

```json
{
  "text": "11,610"
}
```

Safety stop:

```json
{
  "error": "Agent stopped after 5 tool rounds."
}
```

## 10. `response.ok`

```tsx
if (!response.ok) {
  setError(data.error ?? "The agent request failed.");
  return;
}

setAnswer(data.text ?? "");
```

Mental model:

```text
2xx
 ↓
response.ok = true
 ↓
setAnswer(...)

non-2xx
 ↓
response.ok = false
 ↓
setError(...)
```

HTTP `422` is a valid response from our server, but it represents an unsuccessful agent request.

## 11. HTTP Error vs Request Failure

An HTTP error means the server responded but did not accept the outcome as successful, such as the `422` safety stop.

A request failure means `fetch()` itself could not complete normally.

```tsx
catch {
  setError("Unable to reach the agent.");
}
```

Both eventually become UI error state, but they represent different failure paths.

## 12. Why `finally` Matters

```tsx
finally {
  setIsLoading(false);
}
```

`finally` runs after success, an HTTP error path, or an exception.

```text
setIsLoading(true)
       ↓
    request
       ↓
success / error / exception
       ↓
finally
       ↓
setIsLoading(false)
```

This prevents the interface from getting stuck on `Running...`.

## 13. Loading UX

A tool-using agent may require several model/tool rounds before returning a final answer.

The button therefore changes from `Run Agent` to `Running...` and becomes disabled.

The UI also displays:

```text
Agent is working...

It may use several tools before returning a final answer.
```

This is loading feedback, not tool-call visualization.

## 14. Accessible Loading Feedback

The loading panel uses:

```tsx
<div role="status" aria-live="polite">
```

The decorative spinner uses:

```tsx
aria-hidden="true"
```

The status is communicated through text, not animation alone.

## 15. Rendering Answer and Error States

```tsx
{answer && (
  <div>
    <p>Answer</p>
    <p>{answer}</p>
  </div>
)}

{error && (
  <div>
    <p>Error</p>
    <p>{error}</p>
  </div>
)}
```

Flow:

```text
HTTP response
      ↓
setAnswer(...) OR setError(...)
      ↓
React state changes
      ↓
React re-renders
      ↓
Answer panel OR Error panel
```

## 16. Client-Side Empty-Prompt Guard

```tsx
disabled={isLoading || !prompt.trim()}
```

Examples:

```text
""       → disabled
"   "    → disabled
"Hello"  → enabled
```

This prevents unnecessary empty requests from the normal UI.

## 17. Client Validation Does Not Replace Server Validation

The browser guard improves UX, but `/api/agents` must still validate input because it can be called directly by `curl`, another frontend, or another application.

```text
Client validation = UX
Server validation = API correctness
```

## 18. What Runs Where?

### Browser — `AgentDemo`

- prompt state
- loading state
- answer state
- error state
- textarea and button
- `fetch("/api/agents")`
- display answer/error

### Server — `/api/agents`

- OpenAI calls
- tool definitions
- calculator execution
- `format_number` execution
- tool dispatch
- agent loop
- `previous_response_id`
- `MAX_TOOL_ROUNDS`
- final answer
- safety stop

```text
BROWSER
presentation + request state
        │
        │ HTTP
        ▼
SERVER
agent execution
```

## 19. What the Browser Must Not Own

The Client Component does **not**:

- call OpenAI directly
- store the OpenAI API key
- execute calculator or `format_number`
- dispatch tool calls
- run the agent `while` loop
- enforce `MAX_TOOL_ROUNDS`

The UI should not become a second implementation of the agent.

## 20. End-to-End Test — Dependent Tool Calls

Prompt:

```text
Use the calculator tool to multiply 27 by 43.
Then multiply that result by 10.
Finally, use the format_number tool to format that result.
```

Observed flow:

```text
Round #1
calculator(27, 43)
→ 1161

Round #2
calculator(1161, 10)
→ 11610

Round #3
format_number(11610)
→ "11,610"

Model #4
→ final answer
```

Browser result:

```text
11,610
```

This verifies:

```text
Browser
   ↓
fetch()
   ↓
/api/agents
   ↓
multiple dependent tool rounds
   ↓
final JSON
   ↓
setAnswer(...)
   ↓
Browser
```

## 21. Regression Test — Multiple Tool Calls in One Round

Prompt:

```text
Use the calculator tool to do two independent calculations:
(1) multiply 27 by 43, and
(2) multiply 15 by 20.
Give me both results.
```

Observed result:

```text
1. 27 × 43 = 1,161
2. 15 × 20 = 300
```

This confirms that adding the UI did not break the breadth behavior introduced in 002-005.

## 22. End-to-End Test — Safety Stop

A repeated multiply-by-2 prompt was used to require a sixth dependent calculator round.

Five rounds execute:

```text
#1 → 4
#2 → 8
#3 → 16
#4 → 32
#5 → 64
```

Then the model requests Round #6.

The server returns:

```text
HTTP 422
```

with:

```json
{
  "error": "Agent stopped after 5 tool rounds."
}
```

Round #6 does not execute.

The browser displays:

```text
Error

Agent stopped after 5 tool rounds.
```

The safety stop is an application outcome, not a UI crash.

## 23. 200 vs 422

Normal completion:

```text
Agent finishes
    ↓
HTTP 200
    ↓
{text: "..."}
    ↓
setAnswer(...)
    ↓
Answer panel
```

Safety boundary:

```text
Agent requests Round #6
    ↓
HTTP 422
    ↓
{error: "..."}
    ↓
setError(...)
    ↓
Error panel
```

## 24. 001-006 vs 002-007

001-006:

```text
User
 ↓
LLM API
 ↓
Answer
```

002-007:

```text
User
 ↓
Agent API
 ↓
Model
 ↕
Tools
 ↻
 ↓
Answer / Safety Stop
```

The browser pattern is familiar, while the server-side system is much more capable.

## 25. What 002-007 Adds

Added now:

- `AgentDemo` Client Component
- controlled prompt input
- prompt / answer / error / loading state
- browser `fetch()`
- loading spinner and accessible status
- successful answer presentation
- API error presentation
- empty-prompt UI guard

Deliberately still out of scope:

- tool-call visualization
- conversation history
- persistence/database storage
- rich agent event streaming
- new agent architecture
- advanced runtime safety
- concurrency

## 26. Complete Mental Model

```text
┌──────────────────────────────┐
│           BROWSER            │
│ AgentDemo                    │
│ prompt / loading             │
│ answer / error               │
└──────────────┬───────────────┘
               │
               │ POST /api/agents
               ▼
┌──────────────────────────────┐
│            SERVER            │
│ Model                        │
│   ↓                          │
│ toolCalls[]                  │
│   ↓                          │
│ safety guard                 │
│   ↓                          │
│ toolCalls.map(...)           │
│   ↓                          │
│ toolOutputs[]                │
│   ↓                          │
│ Model again ↻                │
│                              │
│ MAX_TOOL_ROUNDS = 5          │
└──────────────┬───────────────┘
               │
               │ JSON
               ▼
┌──────────────────────────────┐
│           BROWSER            │
│ 200 → Answer                 │
│ 422 → Error                  │
└──────────────────────────────┘
```

The browser knows **how to ask for agent work**. The server knows **how to perform agent work**.

## 27. Section 002 Recap

- **002-001 — What is an Agent?** Model + actions + observations + repeated decisions.
- **002-002 — Function / Tool Calling.** Let the model request structured application actions.
- **002-003 — Calculator Tool.** Execute a real tool and return its observation.
- **002-004 — Agent Loop.** Continue model → tool → observation → model.
- **002-005 — Multiple Tool Calls.** `while` handles depth; `.map()` handles breadth.
- **002-006 — Safety Guard.** `MAX_TOOL_ROUNDS` bounds agent depth.
- **002-007 — Agent UI.** Expose the bounded agent through the browser.

## 28. Verification

Verified during the lesson:

```text
✓ Controlled prompt input
✓ Empty prompt → disabled
✓ Whitespace prompt → disabled
✓ Valid prompt → enabled
✓ Loading feedback
✓ Dependent tools → 11,610
✓ Independent calls → 1,161 and 300
✓ Safety stop → HTTP 422
✓ Safety error displayed in UI
✓ pnpm lint
✓ pnpm build
```

Production build:

```text
Next.js 16.3.4
Compiled successfully
TypeScript passed
13/13 static pages generated
```

## Takeaway

```text
The UI does not become the agent.

The UI gives the existing agent an interface.
```

React owns browser interaction and presentation.

The server owns model calls, tool execution, the agent loop, and the safety boundary.

## Next — Section 003: RAG

Section 02 is complete.

Our application now has a browser-accessible agent that can reason, request tools, execute actions, observe results, continue across turns, handle multiple calls, stop at a safety boundary, and return the outcome to the UI.

Next we move into **retrieval-augmented generation (RAG)**: connecting model responses to information supplied by our application.
