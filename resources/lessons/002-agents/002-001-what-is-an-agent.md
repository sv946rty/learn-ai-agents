# Lesson 002-001 — What is an Agent?

## Goal

Section 001 taught us how to build an application that communicates with an LLM:

```text
Prompt
   ↓
Model
   ↓
Answer
```

We can send a prompt to OpenAI, receive a response, stream that response through a Next.js Route Handler, and progressively render it in the browser.

But that alone does **not** make our application an agent.

In this lesson, we introduce the mental model behind an AI agent.

By the end of the lesson, we should understand the conceptual transition from:

```text
Prompt
   ↓
Model
   ↓
Answer
```

to:

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

This lesson is intentionally conceptual.

We are **not implementing tool/function calling yet**.

That begins in Lesson 002-002.

---

# 1. What We Built in Section 001

By the end of Section 001, our application had a complete browser-to-model streaming pipeline:

```text
Browser
   ↓
POST /api/openai
   ↓
Next.js Route Handler
   ↓
OpenAI Responses API
   ↓
stream: true
   ↓
HTTP stream
   ↓
Browser ReadableStream
   ↓
TextDecoder
   ↓
React UI
```

From the user's perspective, however, the interaction is still fundamentally:

```text
Ask something
   ↓
Model generates text
   ↓
Receive answer
```

For example:

```text
Prompt:
Explain what a JavaScript Promise is.

        ↓

LLM

        ↓

Answer:
A JavaScript Promise represents...
```

The model produces a response.

The application displays it.

That is an LLM application.

---

# 2. What Changes When We Build an Agent?

An agent introduces another idea:

> The model can participate in deciding what the application should do next.

Instead of only asking:

```text
What text should I return?
```

the system can eventually support questions such as:

```text
What should I do next?

Should I take an action?

Which action should I request?

What did that action return?

Do I have enough information now?

Should I continue?

Can I produce the final answer?
```

The architecture therefore becomes more than:

```text
Prompt → Model → Answer
```

It begins to look like:

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
Decision
  ↓
...
  ↓
Final Answer
```

The important word is:

```text
continue
```

An agent can work through multiple steps toward a goal.

---

# 3. LLM vs Agent

The simplest comparison is:

## LLM application

```text
Prompt
  ↓
Model
  ↓
Answer
```

The application asks the model for a response.

## Agent

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
  └──────────→ Model
                 ↓
              continue...
                 ↓
            Final Answer
```

An agent is therefore not simply:

```text
LLM + fancy prompt
```

The larger application architecture matters.

---

# 4. The LLM Is Still the Model

Moving from an LLM application to an agent does **not** mean that the LLM disappears.

The LLM is still central.

Conceptually:

```text
             AGENT SYSTEM

       ┌────────────────────┐
       │                    │
       │        LLM         │
       │                    │
       │ reasoning /        │
       │ decision making    │
       │                    │
       └────────────────────┘
                │
                ▼
        surrounding system
```

The model can help determine what should happen next.

But the complete agent is larger than the model itself.

A useful mental model is:

```text
LLM
=
reasoning / decision engine


Agent
=
LLM
+
application logic
+
actions
+
observations
+
control flow
```

Later lessons will make each of those pieces concrete.

---

# 5. The Goal

An ordinary LLM interaction often begins with a prompt.

An agent is easier to think about in terms of a **goal**.

For example:

```text
Calculate the total cost of these items
and explain the result.
```

or:

```text
Find the information needed to answer
this question.
```

or:

```text
Complete this task using the capabilities
available to you.
```

The distinction is useful because a goal may require multiple steps.

```text
Goal
  ↓
What information do I need?
  ↓
What should I do?
  ↓
What happened?
  ↓
What should I do next?
```

The agent works toward completion rather than assuming one model response is necessarily the entire task.

---

# 6. The Model

The model is the reasoning and decision-making component of our simplified agent mental model.

Conceptually:

```text
Goal
  ↓
Model
  ↓
What should happen next?
```

The model may eventually determine that the next step should be:

```text
produce an answer
```

or:

```text
request an action
```

Later, when we introduce tools, the model may be able to request something such as:

```text
calculator(...)
```

But that is **not implemented in this lesson**.

For 002-001, we only need to understand that the model can be used to decide the next step.

---

# 7. Decision

This is where the agent mental model begins to differ significantly from our Section 001 application.

Section 001 was essentially:

```text
Model
  ↓
text
```

An agent-oriented system can instead interpret model output as a decision about what should happen next.

Conceptually:

```text
Model
  ↓
Decision
```

Possible decisions might eventually include:

```text
Answer the user

or

Request an action

or

Continue working
```

Again, we are not implementing the mechanism yet.

We are establishing the architecture first.

---

# 8. Action

An **action** is something the surrounding application can do.

Examples in future agent systems could include:

```text
perform a calculation

search a data source

call an API

query a database

retrieve a document

send information to another system
```

A crucial architectural distinction is:

> The model can request or select an action, while application code is responsible for carrying out the action.

Conceptually:

```text
Model
   ↓
requests action
   ↓
Application
   ↓
executes action
```

This distinction will become extremely important when we implement tool calling.

For now, remember:

```text
model decides/request
        ≠
application executes
```

---

# 9. Observation

After an action executes, something comes back.

We call that result an **observation**.

For example:

```text
Action:
Calculate 27 × 43

        ↓

Application executes calculation

        ↓

Observation:
1161
```

The observation becomes new information available to the agent system.

Conceptually:

```text
Action
  ↓
result
  ↓
Observation
```

The important part is what happens next.

Instead of immediately ending the program, the observation can feed back into the next model step:

```text
Observation
     ↓
Model
```

Now the model can reason using information that did not exist before the action was performed.

---

# 10. The Loop

This feedback cycle is one of the defining ideas behind the agent architecture we will build in this course.

```text
Model
  ↓
Decision
  ↓
Action
  ↓
Observation
  ↓
Model
```

The observation becomes input to another model decision.

So we get:

```text
        ┌───────────────────────┐
        │                       │
        ▼                       │
      Model                     │
        ↓                       │
     Decision                   │
        ↓                       │
      Action                    │
        ↓                       │
   Observation ─────────────────┘
```

This can repeat as necessary.

Eventually:

```text
Model
  ↓
Decision
  ↓
Final Answer
```

This repeated cycle is what later lessons will turn into an actual **agent loop**.

But the loop itself is not implemented in 002-001.

---

# 11. A Concrete Mental Example

Suppose the user eventually asks:

```text
Use the calculator to multiply 27 by 43.
Then multiply that result by 10.
```

A simple conceptual agent process could look like this:

```text
GOAL

Multiply 27 × 43,
then multiply the result by 10.

        ↓

MODEL

I first need 27 × 43.

        ↓

DECISION

Use calculator.

        ↓

ACTION

calculator(27, 43)

        ↓

OBSERVATION

1161

        ↓

MODEL

I now need 1161 × 10.

        ↓

DECISION

Use calculator again.

        ↓

ACTION

calculator(1161, 10)

        ↓

OBSERVATION

11610

        ↓

MODEL

The goal is complete.

        ↓

FINAL ANSWER

11610
```

This example illustrates why an agent architecture is useful.

The model did not merely generate the final text in one conceptual step.

It worked through a sequence:

```text
decide
  ↓
act
  ↓
observe
  ↓
decide again
```

We will eventually implement this behavior during Section 002.

But **not yet**.

---

# 12. Why Not Implement the Calculator Now?

Because the curriculum is intentionally incremental.

Our Section 002 roadmap is:

```text
002-001  What is an Agent?
002-002  Function/Tool Calling
002-003  Calculator Tool
002-004  Agent Loop
002-005  Multiple Tool Calls
002-006  Safety Guard
002-007  Agent UI
```

Each lesson introduces one new concept.

If we implemented the calculator now, we would need to introduce:

```text
tool definitions
tool schemas
tool calls
arguments
tool execution
tool results
possibly looping
```

all at once.

That would blur several different concepts together.

Instead:

```text
002-001
Understand the architecture

        ↓

002-002
Learn how a model requests a tool

        ↓

002-003
Implement a real calculator tool

        ↓

002-004
Build the repeated agent loop
```

This makes each architectural layer easier to understand.

---

# 13. Tool Calling Is Not the Same as an Agent

This distinction will become especially important in the next lesson.

Suppose a model can request:

```text
calculator({
  a: 27,
  b: 43
})
```

That gives us **tool calling**.

But tool calling by itself does not automatically give us the full architecture:

```text
Goal
  ↓
Decision
  ↓
Action
  ↓
Observation
  ↓
Decision
  ↓
...
```

Tool calling is one capability used inside an agent system.

Conceptually:

```text
Agent
  │
  ├── Model
  ├── Tool calling
  ├── Tool execution
  ├── Observations
  ├── Control loop
  └── stopping rules
```

We will build these pieces progressively.

---

# 14. The Application Is Part of the Agent

One of the easiest misconceptions is to imagine the model itself secretly performing all agent operations.

A better architecture is:

```text
              APPLICATION

        ┌─────────────────┐
        │                 │
        │      MODEL      │
        │                 │
        └────────┬────────┘
                 │
                 │ decision
                 ▼
        ┌─────────────────┐
        │                 │
        │ APPLICATION     │
        │ CONTROL LOGIC   │
        │                 │
        └────────┬────────┘
                 │
                 │ execute
                 ▼
        ┌─────────────────┐
        │                 │
        │     ACTION      │
        │                 │
        └────────┬────────┘
                 │
                 │ result
                 ▼
        ┌─────────────────┐
        │                 │
        │   OBSERVATION   │
        │                 │
        └────────┬────────┘
                 │
                 └──────→ MODEL
```

The surrounding program matters.

This is why agent engineering is not only prompt engineering.

We are designing an application architecture.

---

# 15. Who Actually Executes the Action?

This deserves special emphasis.

Suppose later the model requests:

```text
calculator({
  operation: "multiply",
  a: 27,
  b: 43
})
```

The model has expressed a structured request.

But the model itself is not necessarily executing our JavaScript calculator function.

Our application will do something conceptually like:

```text
MODEL

"I want calculator(...)."

        ↓

APPLICATION

receives request

        ↓

APPLICATION CODE

executes calculator(...)

        ↓

RESULT

1161

        ↓

APPLICATION

returns observation to model
```

This separation gives the application control over:

```text
which tools exist
what arguments are allowed
whether a tool may run
how the tool executes
what result is returned
when execution must stop
```

Those controls become essential for reliable agent systems.

---

# 16. Agent Does Not Mean Autonomous Without Limits

The word **agent** can sometimes suggest a system that runs independently forever.

That is not the architecture we want.

Our application remains in control.

Eventually we will introduce boundaries such as:

```text
available tools

argument validation

maximum iterations

error handling

safety guards

stopping conditions
```

Conceptually:

```text
Agent capability
      +
Application control
      =
Useful bounded system
```

This is why Section 002 eventually includes:

```text
002-006 — Safety Guard
```

An agent should not simply continue indefinitely.

---

# 17. Goal Completion

An agent loop needs some way to stop.

Conceptually, each model step can lead toward one of two broad outcomes:

```text
            MODEL
              │
       ┌──────┴──────┐
       │             │
       ▼             ▼
    ACTION       FINAL ANSWER
       │
       ▼
 OBSERVATION
       │
       └────────→ MODEL
```

If another action is required:

```text
continue
```

If the goal is complete:

```text
return final answer
```

Later, application-level safeguards will also be able to stop execution even when the model continues requesting actions.

---

# 18. A Useful Agent State Machine

Another way to understand the architecture is as a state machine.

```text
START
  ↓
GOAL
  ↓
MODEL
  ↓
DECISION
  │
  ├── action needed
  │       ↓
  │     ACTION
  │       ↓
  │   OBSERVATION
  │       ↓
  │     MODEL
  │
  └── goal complete
          ↓
      FINAL ANSWER
          ↓
         END
```

Later we will turn this conceptual state machine into actual TypeScript control flow.

For now, the important point is:

> Agent behavior emerges from the relationship between model decisions and application control flow.

---

# 19. Agent vs Workflow

As we continue the course, another useful distinction will emerge.

A traditional application might have a fixed workflow:

```text
Step A
  ↓
Step B
  ↓
Step C
```

The programmer decides the sequence in advance.

An agent-oriented system allows the model to participate in deciding the next step:

```text
Goal
  ↓
Model
  ↓
Which action?
  ├── A
  ├── B
  └── C
```

The application still defines the allowed capabilities and boundaries, but the model can help choose among them dynamically.

That decision-making role is one reason agents are useful for tasks whose exact sequence cannot always be predetermined.

---

# 20. What We Changed in the Application

Lesson 002-001 intentionally requires very little code.

The main application change is architectural.

Previously:

```text
/learn/02-agents
      ↓
CourseSectionPlaceholder
```

Section 02 had no real content yet.

Now:

```text
/learn/02-agents
      ↓
CourseLayout
      ↓
real Agents content
```

The page contains a visual comparison:

```text
LLM                       AGENT

Prompt                    Goal
  ↓                         ↓
Model                     Model
  ↓                         ↓
Answer                    Decision
                            ↓
                          Action
                            ↓
                        Observation
                            ↓
                          repeat
```

This teaches the conceptual architecture before we add implementation complexity.

---

# 21. Section 02 Graduates from the Placeholder

At the end of Section 001, our course architecture looked like:

```text
01 LLMs
   ↓
real content


02 Agents ────┐
03 RAG         │
04 LangGraph   ├──→ CourseSectionPlaceholder
05 MCP         │
06 Build       │
07 Eval ───────┘
```

Now that Section 002 has started:

```text
01 LLMs
   ↓
real content


02 Agents
   ↓
real content


03 RAG ───────┐
04 LangGraph   │
05 MCP         ├──→ CourseSectionPlaceholder
06 Build       │
07 Eval ───────┘
```

This continues the course architecture pattern established in 001-006.

Each section graduates from temporary scaffolding when its real lessons begin.

---

# 22. Why We Keep `CourseSectionPlaceholder`

We still do **not** delete:

```text
src/components/learn/course-section-placeholder.tsx
```

because Sections 03–07 still use it.

The lifecycle is:

```text
Section not started
       ↓
CourseSectionPlaceholder


Section begins
       ↓
CourseLayout + real content


All sections eventually graduate
       ↓
CourseSectionPlaceholder becomes dead code
       ↓
delete it
```

This lets us evolve the course incrementally without prematurely building later sections.

---

# 23. Server Component Boundary

The new Agents page does not need browser interactivity.

It contains:

```text
static lesson text
comparison cards
layout
```

Therefore:

```text
src/app/learn/02-agents/page.tsx
```

remains a Server Component.

We do **not** add:

```ts
"use client";
```

There is no reason to introduce a Client Component boundary when the page does not require:

```text
useState
event handlers
browser APIs
interactive streaming
```

This follows the same architectural principle we established in Section 001:

> Server Components by default. Use Client Components only where browser-side interactivity requires them.

---

# 24. No OpenAI Request Is Needed in This Lesson

Another intentional design decision is that 002-001 does not make a new OpenAI request.

Why?

Because the lesson is teaching:

```text
What architectural idea turns an LLM application
into an agent-oriented system?
```

not:

```text
How do we call a tool?
```

Adding another model request would not improve the core concept.

It would instead risk mixing this lesson with 002-002.

Sometimes the best incremental lesson is one that introduces **architecture before implementation**.

---

# 25. What We Did NOT Add

To preserve the curriculum boundary, 002-001 deliberately does not add:

```text
OpenAI tools
function schemas
tool definitions
tool_choice
tool calls
tool-call arguments
calculator functions
tool execution
tool results
agent while loops
multiple tool calls
maximum iteration guards
agent chat UI
```

Those concepts belong to later lessons.

The absence of these features is intentional.

---

# 26. Functional Verification

Because this lesson is conceptual, functional testing focuses on course architecture and rendering.

We verified:

```text
/learn/02-agents
```

renders the real Agents lesson.

The page correctly displays:

```text
Section 02
Agents
Lesson 002-001
What is an Agent?
```

and the visual comparison:

```text
LLM

Prompt
  ↓
Model
  ↓
Answer
```

versus:

```text
Agent

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
continue until the goal is complete
```

We also navigated to:

```text
/learn/03-rag
```

and verified that Section 03 still displays:

```text
This section will be built incrementally as the course progresses.
```

This confirms:

```text
01 LLMs    → real content
02 Agents  → real content
03–07      → CourseSectionPlaceholder
```

---

# 27. Lint Validation

We ran:

```bash
pnpm lint
```

ESLint completed successfully.

This confirms that the new Section 02 implementation satisfies the project's lint rules.

---

# 28. Production Build Validation

We also ran:

```bash
pnpm build
```

The optimized Next.js production build completed successfully.

The route summary included:

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

The Agents page is currently:

```text
○ /learn/02-agents
```

meaning the page can be prerendered as static content.

That makes sense because 002-001 is a static conceptual lesson with no runtime model execution.

---

# 29. The Mental Model to Remember

If there is only one diagram to remember from this lesson, use this:

```text
LLM APPLICATION

Prompt
  ↓
Model
  ↓
Answer
```

versus:

```text
AGENT

Goal
  ↓
Model
  ↓
Decision
  │
  ├───────────────┐
  │               │
  ▼               ▼
Action        Final Answer
  │
  ▼
Observation
  │
  └────────────→ Model
```

Or even more simply:

```text
LLM

ask → answer
```

versus:

```text
Agent

goal → decide → act → observe → repeat → finish
```

---

# 30. Key Takeaways

### An LLM and an agent are not the same thing

An LLM produces model output.

An agent uses an LLM as part of a larger goal-directed system.

### The model remains central

The LLM can act as the reasoning and decision-making engine.

### The surrounding application matters

Application code provides capabilities, execution, observations, control flow, and boundaries.

### Agents work toward goals

A goal may require multiple steps rather than one model response.

### Actions produce observations

```text
Action
  ↓
Observation
  ↓
next model decision
```

### The feedback loop is fundamental

```text
Model → Decision → Action → Observation → Model
```

### The model does not magically execute application code

The model can request an action; the application controls actual execution.

### Tool calling is only one part of an agent

Tool calling provides a mechanism for requesting actions, but a complete agent system also needs execution, observations, control flow, and stopping behavior.

### Agent systems should be bounded

Later we will add limits and safety guards rather than allowing uncontrolled looping.

### 002-001 is intentionally conceptual

We first understand the architecture.

Then we implement it incrementally.

---

# 31. Where We Are in the Course

We have now crossed an important conceptual boundary:

```text
SECTION 001 — LLMs

Prompt
  ↓
Model
  ↓
Answer

        │
        │
        ▼

SECTION 002 — AGENTS

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
repeat
```

But our actual application still does not have tools.

That is exactly what comes next.

---

# 32. Next — 002-002 Function/Tool Calling

The next question is:

> How can a model tell our application that it wants an action to happen?

We need a structured communication mechanism between:

```text
MODEL
```

and:

```text
APPLICATION CODE
```

Instead of the model merely generating text such as:

```text
"Please multiply 27 by 43."
```

we want it to be able to produce a structured request conceptually like:

```text
I want to call:

calculator({
  a: 27,
  b: 43
})
```

That mechanism is **function/tool calling**.

So our progression becomes:

```text
002-001
What is an Agent?
      ↓
understand the mental model


002-002
Function/Tool Calling
      ↓
give the model a structured way
to request an action


002-003
Calculator Tool
      ↓
execute a real action


002-004
Agent Loop
      ↓
feed observations back
and continue
```

We now understand **what an agent is**.

Next, we begin building one.
