# AGENTS.md

## Project Identity

- **Project:** Learn AI Agents
- **Repository:** `learn-ai-agents`
- **Publisher:** Thunkx
- **Tagline:** Learn by building.
- **Primary stack:** Next.js 16.3+, App Router, TypeScript, React,
  Tailwind CSS, shadcn/ui, OpenAI
- **Goal:** Teach modern AI-agent engineering by building a real
  application incrementally from LLM fundamentals through Agents, RAG,
  LangGraph, MCP, application integration, and evaluation.

This repository is both a working Next.js application and a
self-contained open-source course.

The code, lesson tutorials, Git checkpoints, and lesson infographics
should reinforce one another.

---

# Core Rule

> **Do not jump ahead. Build only what the current lesson is intended to
> teach, while keeping the repository coherent, runnable, and ready for
> the next lesson.**

Do not introduce future concepts merely because they may eventually be
useful.

Examples:

- Do not install the OpenAI SDK in `001-001`; `001-002` owns that.
- Do not introduce agent loops while teaching basic LLM calls.
- Do not introduce RAG dependencies during the Agents section.
- Do not introduce LangGraph before Section 004.
- Do not introduce MCP before Section 005.
- Do not prematurely build abstractions whose only purpose belongs to a
  future lesson.

Foundational architecture that prevents unnecessary later rewrites is
allowed in `001-001`, provided it does not implement or teach future
course concepts.

---

# 1. Course Curriculum

The master roadmap at:

```text
resources/infographics/000.overview.course.png
```

is the authoritative visual curriculum.

Keep the sequence below synchronized with it.

## Section 001 — LLMs

**Build:** A simple chat application powered by OpenAI.

- `001-001` Project Setup
- `001-002` Connect OpenAI
- `001-003` Prompt → Response
- `001-004` Responses API Deep Dive
- `001-005` Streaming
- `001-006` Simple LLM Chat UI

## Section 002 — Agents

**Build:** An agent that can use tools to solve tasks step-by-step.

- `002-001` What is an Agent? — Understand the agent-loop concept
- `002-002` Function / Tool Calling — Learn how the model asks for tools
- `002-003` Calculator Tool — Create a calculator tool
- `002-004` Agent Loop (Basic) — Model → tool → result → model
- `002-005` Multiple Tool Calls — Handle multiple tool calls
- `002-006` Safety Guard (Max Iterations) — Bound agent execution
- `002-007` Agent UI — Build the full agent chat UI with tools

## Section 003 — RAG

**Build:** A RAG chatbot that knows your documents.

- `003-001` Overview — What RAG is and when to use it
- `003-002` Documents & Loaders — Load PDF, TXT, Markdown, web, and
  other sources
- `003-003` Chunking — Split documents into chunks
- `003-004` Embeddings — Create embeddings with OpenAI
- `003-005` Vector Store — Store embeddings in a vector database
- `003-006` Retrieval — Retrieve relevant chunks for a question
- `003-007` RAG in Next.js — Build a RAG application with chat and
  citations

Before implementing `003-005`, verify current retrieval/vector-store
capabilities and ecosystem choices. Do not silently change the roadmap.

## Section 004 — LangGraph

**Build:** A graph-based agent capable of more complex workflows.

- `004-001` Why LangGraph? — Limitations of simple loops and benefits
  of graphs
- `004-002` State Management — Define messages, memory, variables, and
  other state
- `004-003` Nodes — Create LLM, tool, and custom nodes
- `004-004` Edges — Connect nodes
- `004-005` Conditional Routing — Route based on tools, state, and
  results
- `004-006` Loops & Subgraphs — Build loops, subgraphs, and complex
  flows
- `004-007` Graph in Next.js — Run a LangGraph agent in the application

Teach **LangChain vs. LangGraph** as part of `004-001`, while keeping
the lesson titled **Why LangGraph?**

## Section 005 — MCP

**Build:** Agents that can use external capabilities through MCP.

- `005-001` MCP Overview
- `005-002` MCP Server
- `005-003` MCP Client
- `005-004` MCP Tools
- `005-005` MCP Resources
- `005-006` Use MCP in Agent
- `005-007` MCP + Next.js Integration

## Section 006 — Build

**Build:** A complete AI-agent application.

- `006-001` App Planning
- `006-002` Project Scaffold
- `006-003` Core Agent (LLM + Tools)
- `006-004` Add RAG
- `006-005` Add LangGraph
- `006-006` Add MCP
- `006-007` Polish & Deploy

## Section 007 — Eval

**Achieve:** A more reliable, production-ready AI-agent system.

- `007-001` Why Eval?
- `007-002` Test Cases
- `007-003` Tool Call Eval
- `007-004` Agent Loop Eval
- `007-005` RAG Eval
- `007-006` End-to-End Eval
- `007-007` Continuous Quality

---

# 2. Repository Architecture

The Git repository root is also the Next.js application root.

Never create a nested second `learn-ai-agents` application directory.

```text
learn-ai-agents/
├── AGENTS.md
├── README.md
├── resources/
│   ├── lessons/
│   │   ├── 001-llms/
│   │   │   ├── 001-001-project-setup.md
│   │   │   ├── 001-002-connect-openai.md
│   │   │   └── ...
│   │   ├── 002-agents/
│   │   ├── 003-rag/
│   │   ├── 004-langgraph/
│   │   ├── 005-mcp/
│   │   ├── 006-build/
│   │   └── 007-eval/
│   └── infographics/
│       ├── 000.overview.course.png
│       ├── 001-llms/
│       │   ├── 001-001-project-setup.png
│       │   ├── 001-002-connect-openai.png
│       │   └── ...
│       ├── 002-agents/
│       ├── 003-rag/
│       ├── 004-langgraph/
│       ├── 005-mcp/
│       ├── 006-build/
│       └── 007-eval/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
├── package.json
└── ...
```

Conceptually:

```text
src/                    → what we build

resources/lessons/      → how we teach it

resources/infographics/ → how we visualize it

README.md               → how learners enter and navigate the course
```

`resources/` is course/documentation material and should not
automatically become runtime content.

`public/` is for assets intentionally served by Next.js.

Do not place tutorial infographics in `public/` merely because they are
images.

---

# 3. Lesson Artifact Model

## 3.1 One Tutorial Per Lesson

Every numbered lesson owns one Markdown tutorial.

Tutorials are grouped by major course section:

```text
resources/lessons/
├── 001-llms/
│   ├── 001-001-project-setup.md
│   ├── 001-002-connect-openai.md
│   ├── 001-003-prompt-response.md
│   ├── 001-004-responses-api-deep-dive.md
│   ├── 001-005-streaming.md
│   └── 001-006-simple-llm-chat-ui.md
├── 002-agents/
├── 003-rag/
├── 004-langgraph/
├── 005-mcp/
├── 006-build/
└── 007-eval/
```

The tutorial filename must begin with the exact lesson identifier.

Examples:

```text
001-001-project-setup.md
002-004-agent-loop.md
002-006-safety-guard.md
```

Do not combine an entire major section into one large Markdown tutorial.

## 3.2 One Infographic Per Lesson

Every numbered lesson should normally have one corresponding infographic.

Infographics use the same section and lesson naming model:

```text
resources/infographics/
├── 001-llms/
│   ├── 001-001-project-setup.png
│   ├── 001-002-connect-openai.png
│   └── ...
├── 002-agents/
└── ...
```

Whenever practical, the tutorial and infographic use the same basename:

```text
resources/lessons/001-llms/001-001-project-setup.md

resources/infographics/001-llms/001-001-project-setup.png
```

This creates a direct relationship between:

```text
lesson
  │
  ├── implementation
  ├── checkpoint
  ├── tutorial
  └── infographic
```

A learner should be able to identify all artifacts for a lesson from its
lesson number.

## 3.3 Primary Learner Experience

Keep the normal path simple:

```text
Choose numbered lesson
        ↓
Read lesson tutorial
        ↓
Run/review lesson checkpoint
        ↓
Open explicitly identified implementation files
        ↓
Follow execution through the code
        ↓
Run examples and tests
        ↓
Complete exercises
        ↓
Use lesson infographic for reinforcement
        ↓
Continue to next numbered lesson
```

The normal learning unit is a **numbered lesson**.

Major sections organize related lessons, but each lesson should be
independently understandable in the context of everything taught before
it.

## 3.4 Lesson Checkpoints

Development occurs one numbered lesson at a time.

Preserve a meaningful Git checkpoint for every lesson.

Examples:

```text
lesson-001-001
lesson-001-002
lesson-001-003

lesson-002-001
lesson-002-002
lesson-002-003
lesson-002-004
lesson-002-005
lesson-002-006
lesson-002-007
```

Checkpoints preserve:

- curriculum history;
- exact lesson state;
- debugging context;
- maintenance history;
- lesson-to-lesson evolution;
- deeper Git-based study.

When useful, learners may compare checkpoints:

```bash
git diff lesson-002-003..lesson-002-004
```

Prefer a linear history with lesson tags/checkpoints over dozens of
permanent lesson branches.

## 3.5 Tutorials Are Guided Code Tours

A lesson tutorial must never merely say:

> "Review the code."

For every coding lesson, explicitly identify:

1. the exact file or files to open;
2. the exact function, component, constant, loop, type, or region to
   find;
3. what that code is responsible for;
4. why the code exists;
5. how it relates to the lesson concept;
6. where execution came from;
7. where execution goes next;
8. how the learner can run or observe the behavior.

Never require learners to discover the relevant implementation by
searching the repository themselves.

Example:

```markdown
## Files to Review

Focus on:

`src/app/api/agent/route.ts`

For this lesson, find:

1. the outer agent loop;
2. `openai.responses.create(...)`;
3. handling of `function_call`;
4. creation of `function_call_output`.

You do not need to understand the safety limit yet.

That is covered in `002-006`.
```

Then guide the learner through those regions in execution order.

## 3.6 Follow the Execution

Whenever a lesson involves runtime behavior, show how a request moves
through the real code.

Example:

```text
User input
    ↓
Client submit handler
    ↓
POST /api/agent
    ↓
OpenAI request
    ↓
response.output
    ↓
function_call
    ↓
application tool execution
    ↓
function_call_output
    ↓
next model turn
    ↓
final response
    ↓
UI
```

Connect architecture diagrams to actual filenames and code regions.

A learner should finish a coding lesson able to point to the relevant
implementation and explain the execution flow.

## 3.7 Focused Code Excerpts and Diffs

Use small code excerpts when they improve understanding.

Do not duplicate entire source files in tutorial Markdown unless there
is a strong pedagogical reason.

The repository itself is the source of truth for full code.

Focused diffs can be used when historical evolution clarifies a concept,
but raw Git diffs should not be required for understanding the lesson.

## 3.8 Concept-Only Lessons

Some lessons are primarily conceptual and may have no meaningful code
changes, such as:

- `002-001` What is an Agent?
- `003-001` RAG Overview
- `004-001` Why LangGraph?
- `005-001` MCP Overview
- `007-001` Why Eval?

Do not invent code changes merely to make every lesson look like a
coding lesson.

Clearly say when there is no primary implementation file to review.

A conceptual lesson should still have a tutorial and may have an
infographic when visual explanation is useful.

## 3.9 Exercises

Coding lessons should normally include a small exercise requiring the
learner to interact with the implementation.

Examples:

- add a calculator operation;
- change a safety limit and observe behavior;
- modify a prompt;
- trace a tool call;
- inspect a response object;
- intentionally trigger an error;
- add a test case.

Exercises must reinforce the current concept rather than introduce
future curriculum.

## 3.10 Lesson Completion Check

Each coding tutorial should end with a short comprehension check.

A learner should be able to explain:

- which file contains the behavior;
- what the important code does;
- why it is needed;
- how execution reaches it;
- what happens next.

Prefer understanding over memorization.

## 3.11 Lesson Tutorial Structure

A completed lesson tutorial should normally contain:

```text
Lesson identifier and title

Goal

What You Will Learn

What You Will Build

Before You Begin

Files to Review

Implementation / Guided Code Tour

Execution Flow
    when runtime behavior exists

How to Run / Test the Lesson

Exercise
    when useful

Common Misunderstandings
    when useful

What You Learned

Infographic

Next Lesson
```

Adapt this structure when appropriate.

Do not create empty headings merely to satisfy a template.

## 3.12 Write Tutorials Against Real Code

Do not write detailed implementation tutorials based on code that has
not been built yet.

Tutorials must describe the **actual repository state at that lesson
checkpoint**.

Final paths, function names, behavior, and examples must be verified
against the real implementation.

Preferred flow:

```text
Understand lesson
        ↓
Implement lesson
        ↓
Functionally test
        ↓
pnpm lint
        ↓
pnpm build
        ↓
Create lesson infographic
        ↓
Write/polish lesson tutorial
        ↓
Review Git diff
        ↓
Create lesson checkpoint
        ↓
Continue to next lesson
```

## 3.13 Videos Are Supplemental

Videos are optional.

The GitHub repository must remain a complete course without requiring
YouTube or another external presentation.

The core educational system is:

```text
working code
+ lesson tutorial
+ lesson infographic
+ lesson checkpoint
```

Videos may later provide demonstrations or Thunkx content, but required
course knowledge must remain in the repository.

---

# 4. Incremental Lesson Development

Development proceeds one numbered lesson at a time.

Before implementing a lesson:

1. identify the exact lesson goal;
2. identify what the previous checkpoint already contains;
3. identify the minimum coherent change required;
4. identify concepts deliberately deferred to later lessons.

Do not combine future lessons.

For Section 002, preserve the progression:

```text
002-001  Understand the agent concept

002-002  Model can request tools

002-003  Application can execute one tool

002-004  Basic model → tool → result → model loop

002-005  Multiple tool calls

002-006  Bound the loop

002-007  Expose the completed agent through the UI
```

The code at each checkpoint should accurately represent what has been
taught up to that point.

---

# 5. Lesson Checkpoint Workflow

For each numbered lesson:

```text
Understand lesson goal
        ↓
Implement only that lesson
        ↓
Functional test
        ↓
pnpm lint
        ↓
pnpm build
        ↓
Create/update lesson infographic
        ↓
Create/update lesson tutorial
        ↓
Review Git diff
        ↓
Commit/checkpoint
```

Do not create the final lesson infographic before implementation and
testing are complete.

Do not finalize the lesson tutorial against code that has not been
verified.

Before committing, verify the diff contains no:

- secrets;
- `.env.local`;
- accidental generated files;
- unrelated changes;
- debug artifacts;
- future-lesson code.

Use meaningful commits such as:

```text
lesson-001-001: project setup

lesson-002-004: basic agent loop

lesson-002-006: add agent safety guard
```

When lesson tags/checkpoints are used, keep their names aligned with the
lesson identifier.

---

# 6. Project Setup — 001-001

`001-001 Project Setup` establishes the durable foundation.

It should include the current appropriate versions/configuration of:

- Next.js 16.3+;
- App Router;
- TypeScript;
- `src/`;
- ESLint;
- Tailwind CSS 4;
- `@/*` alias;
- pnpm;
- shadcn/ui using the selected Base UI setup;
- `components.json`;
- `src/lib/utils.ts`;
- global CSS/theme foundation;
- only the small set of shadcn components actually needed;
- `cacheComponents: true`;
- reusable course shell;
- canonical `/` Course Dashboard;
- `CourseLayout`;
- `CourseSidebar`;
- responsive course navigation;
- `/learn/*` namespace;
- shared dark visual foundation;
- environment/security conventions;
- loading/skeleton foundations where genuinely useful;
- `resources/lessons/`;
- `resources/infographics/`.

Do not use:

```text
shadcn add --all
```

## 6.1 001-001 Must Not Implement

Do not implement:

- OpenAI SDK integration;
- `OPENAI_API_KEY` usage;
- model calls;
- Responses API examples;
- streaming;
- chat behavior;
- tool calling;
- agent loops;
- RAG;
- LangGraph;
- MCP;
- evaluation systems.

Those belong to later lessons.

---

# 7. OpenAI Setup — 001-002 and Beyond

`001-002 Connect OpenAI` owns:

- installation of the OpenAI SDK;
- `.env.local` API-key setup;
- server-side `new OpenAI()` configuration;
- the first minimal server-side OpenAI connection.

Use the current OpenAI **Responses API** unless the curriculum
explicitly requires comparison with another API.

Before implementing OpenAI examples, verify current official SDK/API
documentation, model availability, and recommended usage.

Do not blindly copy model names or API syntax from the prototype.

Never expose an API key to browser code.

Never commit `.env.local`.

---

# 8. Next.js Architecture

## 8.1 App Router and Server Components

Use the App Router under:

```text
src/app/
```

Server Components are the default.

Add:

```text
"use client";
```

only when browser-side state, events, browser APIs, or interactive
behavior genuinely require it.

Keep client boundaries as small as practical.

A small interactive child component should not force an entire page or
layout to become a Client Component.

## 8.2 Course Routes

The canonical dashboard is:

```text
/
```

Learning routes use:

```text
/learn/*
```

Expected section routes:

```text
/learn/01-llms
/learn/02-agents
/learn/03-rag
/learn/04-langgraph
/learn/05-mcp
/learn/06-build
/learn/07-eval
```

Lesson routes may be nested beneath sections when useful, for example:

```text
/learn/01-llms/001-006
/learn/02-agents/002-007
```

`/learn` itself does not require a page and may intentionally 404 while
valid section routes work.

Section routes may redirect to a current/final runnable lesson when
appropriate.

Never link nonexistent routes.

## 8.3 Shared Course Shell

Use reusable components such as:

```text
src/components/learn/course-layout.tsx
src/components/learn/course-sidebar.tsx
src/components/learn/course-mobile-nav.tsx
```

or equivalent paths chosen during implementation.

Both `/` and `/learn/*` should share a coherent course visual system.

Branding/navigation should predictably return users to `/`.

---

# 9. Cache Components and Rendering

Enable Cache Components from the project foundation when supported:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

Additional compatible Next.js configuration may be enabled when
appropriate for the project foundation.

Verify exact configuration against current Next.js documentation at
implementation time.

Use caching intentionally.

Do not cache:

- OpenAI model calls;
- agent execution;
- user-specific runtime operations;
- mutable results;

merely because caching exists.

Use Suspense, partial prefetching, and modern Next.js rendering behavior
where relevant, but do not turn caching itself into a lesson before the
curriculum requires it.

---

# 10. Loading and Async UI

Use the loading mechanism appropriate to the operation.

For route-level server work, `loading.tsx` with a meaningful skeleton
may be appropriate.

For asynchronous Server Components, use Suspense where appropriate.

For user-triggered client operations:

- maintain explicit loading state;
- disable controls when appropriate;
- show a spinner, overlay, or progress state when useful;
- show errors clearly.

Do not use Suspense as a replacement for client mutation/loading state.

Do not display fake agent/tool progress unless real data supports it.

---

# 11. UI and Accessibility

Use shadcn/ui as the reusable component foundation where appropriate.

Maintain a coherent dark course theme.

UI should be:

- readable;
- responsive;
- keyboard accessible;
- semantically structured;
- visually consistent.

Prefer existing primitives over unnecessary custom controls.

Do not sacrifice clarity for decorative complexity.

Interactive controls should expose appropriate accessibility state such
as `aria-expanded`, labels, relationships, and keyboard behavior when
needed.

---

# 12. TypeScript

Use strict, meaningful TypeScript.

Avoid `any` unless there is an exceptional and documented reason.

Prefer:

- explicit domain types;
- narrowing;
- discriminated unions when useful;
- SDK-provided types where appropriate.

Do not over-engineer abstractions ahead of the curriculum.

Use current supported framework/library types instead of copying
deprecated patterns.

---

# 13. OpenAI and Agent Architecture

## 13.1 Model vs. Application

Maintain this distinction:

> **The model requests actions. The application executes actions.**

A tool definition tells the model what capability is available.

A tool implementation is application code that performs the action.

Do not describe the model as directly executing local JavaScript tools.

## 13.2 Agent Mental Model

Use:

```text
Agent = Model + Tools + Control Loop
```

Section 002 should build this progressively.

## 13.3 Tool Calls

Treat model-produced tool arguments as untrusted input.

Validate or narrow tool names and arguments before execution.

Never allow arbitrary model output to select unrestricted application
code.

Use explicit tool dispatch.

## 13.4 Agent Loops

Agent loops must have clear termination behavior.

At `002-006`, bound execution with a maximum iteration/model-turn guard.

Be precise:

```text
outer loop
    = model turns / iterations

inner tool loop
    = tool calls returned during one model turn
```

Do not equate tool-call count with model-iteration count.

## 13.5 Non-Determinism

Do not teach one observed model/tool trace as guaranteed behavior.

Label execution traces as examples unless the application explicitly
enforces the sequence.

---

# 14. Security

Never commit or expose:

- API keys;
- access tokens;
- credentials;
- secrets;
- private `.env.local` contents.

Keep server credentials on the server.

Validate user/model input before consequential tool actions.

As tools become more powerful, maintain least privilege and explicit
application-side control.

Prototype/reference archives containing secrets must never be committed
publicly.

---

# 15. API Route Design

Keep route handlers focused.

Make the current lesson concept visible rather than hiding it behind
unnecessary abstraction.

Extract helpers when they improve:

- readability;
- safety;
- reuse;
- testing;
- conceptual separation.

Do not create elaborate service layers before they provide real value.

Educational code should be production-conscious while remaining
teachable.

---

# 16. Error Handling

Handle expected failures deliberately, including:

- missing user input;
- malformed JSON;
- unsupported tools;
- invalid tool arguments;
- API failures;
- iteration-limit exhaustion;
- retrieval failures;
- network errors.

Return useful HTTP statuses and safe error messages.

Do not expose secrets or unnecessarily sensitive internals.

UI errors should explain failures in understandable language.

---

# 17. Comments

Comments should explain **why**, not narrate obvious syntax.

Good:

```ts
// Bound model turns so a malformed or indecisive tool loop
// cannot keep the request running indefinitely.
```

Weak:

```ts
// Increment iteration.
iteration++;
```

Concise conceptual comments are useful in an educational repository.

Long tutorial explanations belong in:

```text
resources/lessons/
```

---

# 18. Historical Lesson Integrity

Each lesson checkpoint represents a historical curriculum stage.

Do not rewrite earlier checkpoints to contain concepts intentionally
introduced later.

Examples:

- `002-003` should not secretly contain the completed agent loop;
- `002-004` should not already teach multiple tool-call handling;
- `002-005` should not already include the `002-006` safety guard.

The evolution itself is educational material.

If a later bug reveals a serious earlier issue, deliberately choose
whether to:

1. preserve and explain the historical limitation; or
2. correct it because it is unsafe or materially wrong.

Do not silently blur lesson boundaries.

Tutorials and infographics for a lesson must accurately represent that
lesson's checkpoint rather than a later repository state.

---

# 19. Verification

Before a lesson checkpoint, run:

```bash
pnpm lint
pnpm build
```

Also perform the relevant functional test.

Examples include:

- rendering a route;
- submitting a prompt;
- inspecting an API response;
- verifying streaming;
- verifying a tool request/result;
- verifying multiple tool calls;
- verifying the safety guard;
- verifying the final UI.

A successful build alone does not prove lesson behavior.

When practical, verify both expected success behavior and the important
failure/safety behavior introduced by the lesson.

---

# 20. Infographics

## 20.1 Storage

Course infographics live under:

```text
resources/infographics/
```

The master roadmap is:

```text
resources/infographics/000.overview.course.png
```

Lesson infographics are grouped by the same major-section names used by
the tutorials:

```text
resources/infographics/
├── 001-llms/
├── 002-agents/
├── 003-rag/
├── 004-langgraph/
├── 005-mcp/
├── 006-build/
└── 007-eval/
```

Use the exact lesson identifier at the beginning of each filename.

Examples:

```text
001-001-project-setup.png
001-002-connect-openai.png
002-004-agent-loop.png
002-006-safety-guard.png
```

Whenever practical, match the corresponding tutorial basename.

Example:

```text
lessons/002-agents/002-004-agent-loop.md
infographics/002-agents/002-004-agent-loop.png
```

## 20.2 Role

Infographics reinforce tutorials.

They do not replace source code or written teaching.

A lesson infographic should normally communicate some combination of:

- lesson goal;
- architecture/execution flow;
- important concepts;
- important files/code concepts when useful;
- how to test/verify;
- Definition of Done;
- what comes next.

The visual should prioritize the concepts most useful for that specific
lesson rather than mechanically including every category.

## 20.3 Timing and Quality

Create the infographic **after** implementation and verification.

It must reflect the actual checkpoint and must not depict future
functionality as though it already exists.

Before committing, inspect for:

- malformed text;
- misspellings;
- incorrect code;
- cropped content;
- duplication;
- misleading arrows;
- architecture mismatches;
- future-lesson functionality shown as current behavior.

Do not accept an attractive image that teaches incorrect behavior.

---

# 21. README

The root `README.md` is the learner's entry point.

Keep it synchronized with the repository.

It should eventually explain:

- what Learn AI Agents is;
- what learners will build;
- the seven-section roadmap;
- prerequisites;
- installation;
- environment setup;
- how to run the app;
- how to navigate numbered lesson tutorials;
- where tutorials and infographics live;
- how lesson checkpoints work;
- technology stack;
- contribution information;
- license;
- Thunkx attribution.

The normal learning path should be obvious without requiring learners to
understand the internal development workflow.

---

# 22. Educational Writing Style

Write for developers learning AI-agent engineering.

Prefer:

- concrete examples;
- precise terminology;
- diagrams;
- execution traces;
- exact file paths;
- exact functions/code regions;
- short focused excerpts;
- clear explanations of why;
- observable tests;
- exercises.

Avoid:

- unexplained jargon;
- giant walls of prose;
- giant duplicated source files;
- treating probabilistic behavior as deterministic;
- vague instructions such as "review the code";
- unnecessary Git ceremony.

When a concept is commonly misunderstood, explicitly contrast incorrect
and correct mental models.

Tutorials should explain the lesson in the context of concepts already
introduced.

Do not casually depend on knowledge from a future lesson.

---

# 23. Dependency and Version Policy

Use current stable versions appropriate at implementation time.

Before introducing an important framework, library, or API:

1. verify current official documentation;
2. verify current package/API names;
3. verify recommended integration patterns;
4. avoid blindly copying the prototype.

Install dependencies only when the curriculum needs them.

Do not pre-install the future stack during setup.

This keeps lesson diffs meaningful and teaches why each dependency
enters the project.

---

# 24. Reference Prototype Policy

A previous prototype may be provided as a ZIP or other reference
artifact.

Treat it as:

> **Reference implementation, not architectural authority.**

Use it to understand:

- previously tested concepts;
- lesson evolution;
- known behavior;
- useful examples;
- issues discovered during prototyping.

Do not blindly copy:

- architecture;
- dependency versions;
- API syntax;
- model names;
- comments;
- routing decisions;
- secrets;
- `.env.local`;
- generated artifacts.

`AGENTS.md` and the master roadmap take precedence when they conflict
with the prototype.

---

# 25. Source-of-Truth Hierarchy

## 1. `AGENTS.md`

Authoritative for:

- engineering rules;
- repository architecture;
- teaching methodology;
- testing;
- checkpoints;
- tutorial workflow;
- infographic workflow;
- scope discipline.

## 2. Master Roadmap

```text
resources/infographics/000.overview.course.png
```

Authoritative for:

- the seven major sections;
- lesson sequence;
- curriculum progression.

## 3. Current Repository Code

Authoritative for the implementation that actually exists:

- exact paths;
- exact functions/components;
- runtime behavior.

Tutorials and infographics must be verified against it.

## 4. Prototype / Historical Reference

Useful for previous experiments but not authoritative for the clean
rebuild.

If sources conflict, do not silently guess.

Resolve the conflict deliberately before implementing.

---

# 26. Scope Control

Before making a change, ask:

1. Which lesson owns this concept?
2. Is it required for the current lesson?
3. Does adding it now prevent a foundational architectural problem?
4. Would adding it now weaken the teaching sequence?
5. Is there a simpler implementation that teaches the same concept?
6. Should the tutorial explain this now or defer it?

When uncertain, prefer the smallest coherent implementation that
preserves the roadmap.

---

# 27. Definition of Done — Lesson

A numbered lesson is complete when:

- its intended concept is implemented or clearly taught;
- future lessons have not been unnecessarily implemented;
- relevant functionality has been functionally tested;
- `pnpm lint` passes;
- `pnpm build` passes;
- its lesson infographic exists and accurately reflects the checkpoint;
- its lesson tutorial exists and accurately reflects the checkpoint;
- tutorial paths, code regions, examples, and behavior have been
  verified against the real code;
- the Git diff has been reviewed;
- no secrets or unrelated changes are present;
- no accidental generated/debug files are present;
- the lesson checkpoint/commit has been created.

For a lesson such as `001-001`, the expected educational artifact pair
is:

```text
resources/lessons/001-llms/001-001-project-setup.md

resources/infographics/001-llms/001-001-project-setup.png
```

---

# 28. Definition of Done — Section

A section is complete when:

- every numbered lesson has a valid checkpoint;
- every numbered lesson has its required tutorial;
- every numbered lesson has its required infographic when applicable;
- the final section implementation is runnable;
- the final implementation has been functionally tested;
- `pnpm lint` passes;
- `pnpm build` passes;
- lesson tutorials identify exact files and code regions where
  appropriate;
- runtime lessons guide learners through real execution paths;
- exercises and common misunderstandings are included where useful;
- tutorial and infographic naming is consistent;
- README navigation is updated when appropriate;
- the completed sequence forms a coherent progression into the next
  section.

---

# 29. Working With the User

This project is developed interactively.

When guiding implementation:

- work one lesson at a time;
- give one step or command at a time when appropriate;
- let the user provide terminal output or screenshots;
- verify the result before continuing;
- do not dump a large batch of shell commands unless requested;
- explain why a command or code change is needed;
- provide full revised files when requested;
- respect user-approved naming and repository conventions;
- do not commit until implementation, testing, infographic review,
  tutorial review, and Git diff review are complete.

The goal is not merely to finish the repository.

The development process itself should produce a course another developer
can genuinely understand and follow.

---

# Final Principle

**Learn AI Agents should be easy to enter, rigorous enough to teach real
engineering, and simple enough that the course mechanics never become
harder than the AI-agent concepts themselves.**

The public learner should see seven clear learning sections.

Inside those sections, every numbered lesson should have a clear,
discoverable relationship between:

```text
concept
+ working code
+ tutorial
+ infographic
+ Git checkpoint
```

The repository should preserve the careful lesson-by-lesson evolution
that makes the course accurate, maintainable, and useful for deeper
study.
