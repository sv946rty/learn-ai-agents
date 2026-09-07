import { AgentDemo } from "@/components/learn/agent-demo";
import { CourseLayout } from "@/components/learn/course-layout";
import { courseSections } from "@/lib/course";

/**
 * Lesson 002-007 — Agent UI
 *
 * PAST — 002-006: Safety Guard
 * --------------------------------
 * The backend agent is now complete for Section 002:
 *
 *   User prompt
 *       ↓
 *   Model
 *       ↓
 *   Tool calls?
 *       ↓
 *   Safety guard
 *       ↓
 *   Execute all requested tools
 *       ↓
 *   Observations
 *       ↓
 *   Model again
 *
 * It supports:
 *
 *   - calculator + format_number
 *   - dependent tool rounds
 *   - multiple tool calls in one round
 *   - MAX_TOOL_ROUNDS = 5
 *   - normal completion after the fifth round
 *   - 422 when a sixth tool round is requested
 *
 * Until now, we interacted with that backend mainly through curl.
 *
 *
 * NOW — 002-007: Agent UI
 * --------------------------------
 * This lesson gives the existing agent a browser interface.
 *
 * The important architecture is:
 *
 *   page.tsx
 *   Server Component
 *       ↓
 *   <AgentDemo />
 *   Client Component
 *       ↓
 *   React state
 *       ↓
 *   fetch("/api/agents")
 *       ↓
 *   Existing agent backend
 *       ↓
 *   JSON response
 *       ↓
 *   React state
 *       ↓
 *   UI re-renders
 *
 * The browser does NOT contain the agent loop.
 *
 * It does NOT:
 *
 *   - call OpenAI directly
 *   - execute calculator
 *   - execute format_number
 *   - control tool rounds
 *   - enforce MAX_TOOL_ROUNDS
 *
 * Those responsibilities remain on the server.
 *
 *
 * TEST CASES
 * --------------------------------
 * Empty prompt:
 *
 *   → Run Agent disabled
 *
 * Whitespace-only prompt:
 *
 *   → Run Agent disabled
 *
 * Dependent multi-tool prompt:
 *
 *   calculator(27, 43)
 *       ↓
 *   calculator(1161, 10)
 *       ↓
 *   format_number(11610)
 *       ↓
 *   UI → "11,610"
 *
 * Safety-boundary prompt:
 *
 *   five rounds execute
 *       ↓
 *   sixth round requested
 *       ↓
 *   API → 422
 *       ↓
 *   UI → "Agent stopped after 5 tool rounds."
 *
 *
 * NEXT
 * --------------------------------
 * Section 002 is complete.
 *
 * The browser now exposes the bounded tool-using agent through a usable
 * interface. The next section moves from tool use into retrieval-augmented
 * generation (RAG).
 */

export default function AgentsPage() {
  const section = courseSections[1];

  return (
    <CourseLayout>
      <div className="space-y-8">
        <header className="space-y-3">
          <p className="font-mono text-sm text-muted-foreground">
            Section {section.number}
          </p>

          <h1 className="text-4xl font-semibold tracking-tight">
            {section.title}
          </h1>

          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            {section.description}
          </p>
        </header>

        <section className="max-w-4xl space-y-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Lesson 002-007
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Agent UI
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
              Our agent can already reason across tool rounds, execute multiple
              tool calls, and stop at an application-defined safety boundary.
              Now we will make that agent usable from the browser.
            </p>
          </div>

          <AgentDemo />

          <LessonCard label="From the previous lesson">
            <h3 className="text-lg font-semibold">
              The agent backend is already complete
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Lesson 002-006 bounded the depth of the agent loop with{" "}
              <Code>MAX_TOOL_ROUNDS</Code>. We do not need to redesign that
              backend just because we are adding a browser interface.
            </p>

            <div className="mt-5 space-y-3">
              <Step>User prompt</Step>
              <Arrow />
              <Step>Model</Step>
              <Arrow />
              <Step>Tool calls?</Step>
              <Arrow />
              <Step>Safety guard</Step>
              <Arrow />
              <Step>Execute tools → observations</Step>
              <Arrow />
              <Step>Model again ↻</Step>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <BoundaryItem>✓ calculator + format_number</BoundaryItem>
              <BoundaryItem>✓ Dependent tool rounds</BoundaryItem>
              <BoundaryItem>✓ Multiple calls per round</BoundaryItem>
              <BoundaryItem>✓ .filter() → toolCalls[]</BoundaryItem>
              <BoundaryItem>✓ .map() → toolOutputs[]</BoundaryItem>
              <BoundaryItem>✓ MAX_TOOL_ROUNDS = 5</BoundaryItem>
              <BoundaryItem>✓ Normal final answer → 200</BoundaryItem>
              <BoundaryItem>✓ Sixth requested round → 422</BoundaryItem>
            </div>
          </LessonCard>

          <LessonCard label="The problem">
            <h3 className="text-lg font-semibold">
              curl is useful for developers, not end users
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Until now, curl gave us a direct way to inspect and test the agent
              API. That was ideal while we were building the agent loop, but a
              real user should not need a terminal command to ask the agent a
              question.
            </p>

            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`curl -X POST http://localhost:3000/api/agents \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt":
      "Use the calculator tool to multiply 27 by 43."
  }'`}</code>
            </pre>

            <Arrow />

            <div className="grid gap-4 md:grid-cols-2">
              <ConceptCard title="Developer interface">
                <p className="font-mono text-sm">curl → /api/agents</p>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Excellent for seeing HTTP requests and testing the backend
                  directly.
                </p>
              </ConceptCard>

              <ConceptCard title="User interface">
                <p className="font-mono text-sm">textarea → button → answer</p>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Gives a human a simple browser interface without exposing
                  agent implementation details.
                </p>
              </ConceptCard>
            </div>
          </LessonCard>

          <LessonCard label="What changes in 002-007?">
            <h3 className="text-lg font-semibold">
              Add a presentation layer — not another agent
            </h3>

            <div className="mt-5">
              <Step>Browser UI</Step>
              <Arrow />
              <Step>POST /api/agents</Step>
              <Arrow />
              <Step>Existing bounded agent</Step>
              <Arrow />
              <Step>JSON response</Step>
              <Arrow />
              <Step>Browser UI re-renders</Step>
            </div>

            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              The key design decision is separation of responsibilities. The
              browser collects input and displays state. The server remains
              responsible for agent execution.
            </p>
          </LessonCard>

          <LessonCard label="Architecture">
            <h3 className="text-lg font-semibold">
              Keep the lesson page on the server
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The lesson page itself does not need browser state or event
              handlers, so it remains a Server Component. Only the interactive{" "}
              <Code>AgentDemo</Code> needs <Code>&quot;use client&quot;</Code>.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ConceptCard title="page.tsx · Server Component">
                <div className="space-y-3 text-sm">
                  <BoundaryItem>✓ Lesson explanation</BoundaryItem>
                  <BoundaryItem>✓ Architecture diagrams</BoundaryItem>
                  <BoundaryItem>✓ Code walkthrough</BoundaryItem>
                  <BoundaryItem>✓ Renders &lt;AgentDemo /&gt;</BoundaryItem>
                </div>
              </ConceptCard>

              <ConceptCard title="AgentDemo · Client Component">
                <div className="space-y-3 text-sm">
                  <BoundaryItem>✓ React state</BoundaryItem>
                  <BoundaryItem>✓ textarea onChange</BoundaryItem>
                  <BoundaryItem>✓ button onClick</BoundaryItem>
                  <BoundaryItem>✓ fetch()</BoundaryItem>
                </div>
              </ConceptCard>
            </div>

            <div className="mt-5">
              <Step>page.tsx · SERVER</Step>
              <Arrow />
              <Step>&lt;AgentDemo /&gt; · CLIENT</Step>
              <Arrow />
              <Step>/api/agents · SERVER</Step>
            </div>
          </LessonCard>

          <LessonCard label="Why a Client Component?">
            <h3 className="text-lg font-semibold">
              Browser interaction requires client-side state
            </h3>

            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`"use client";

import { useState } from "react";`}</code>
            </pre>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              <Code>&quot;use client&quot;</Code> creates the client boundary.
              It is needed here because this component responds to typing,
              button clicks, request progress, and HTTP results.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <BoundaryItem>Typing changes state</BoundaryItem>
              <BoundaryItem>Clicking starts a request</BoundaryItem>
              <BoundaryItem>Loading changes the interface</BoundaryItem>
              <BoundaryItem>Results trigger a re-render</BoundaryItem>
            </div>

            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              We do not add <Code>&quot;use client&quot;</Code> to the whole
              lesson page. The interactive requirement is local, so the client
              boundary stays local too.
            </p>
          </LessonCard>

          <LessonCard label="The four UI states">
            <h3 className="text-lg font-semibold">
              The interface needs more than just the prompt
            </h3>

            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`const [prompt, setPrompt] = useState("");
const [answer, setAnswer] = useState("");
const [error, setError] = useState("");
const [isLoading, setIsLoading] = useState(false);`}</code>
            </pre>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <StateCard
                name="prompt"
                initial='""'
                detail="The text currently entered by the user."
              />

              <StateCard
                name="answer"
                initial='""'
                detail="The successful final answer returned by the agent API."
              />

              <StateCard
                name="error"
                initial='""'
                detail="An API or network error that should be shown to the user."
              />

              <StateCard
                name="isLoading"
                initial="false"
                detail="Whether the browser is currently waiting for the agent."
              />
            </div>
          </LessonCard>

          <LessonCard label="Controlled input">
            <h3 className="text-lg font-semibold">
              React owns the textarea value
            </h3>

            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`<textarea
  id="agent-prompt"
  value={prompt}
  onChange={(event) => setPrompt(event.target.value)}
  placeholder="Ask the agent to use its tools..."
  rows={5}
/>`}</code>
            </pre>

            <div className="mt-5">
              <Step>User types</Step>
              <Arrow />
              <Step>onChange(event)</Step>
              <Arrow />
              <Step>setPrompt(event.target.value)</Step>
              <Arrow />
              <Step>prompt state changes</Step>
              <Arrow />
              <Step>React renders value=&#123;prompt&#125;</Step>
            </div>

            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              This is a controlled input: React state is the source of truth for
              what appears in the textarea.
            </p>
          </LessonCard>

          <LessonCard label="Starting the request">
            <h3 className="text-lg font-semibold">
              One click begins the browser → server flow
            </h3>

            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`async function runAgent() {
  setIsLoading(true);
  setAnswer("");
  setError("");

  try {
    // POST to /api/agents
  } finally {
    setIsLoading(false);
  }
}`}</code>
            </pre>

            <div className="mt-5 space-y-3">
              <FlowRow number="1" title="Enter loading state">
                The UI immediately records that work is in progress.
              </FlowRow>

              <FlowRow number="2" title="Clear the previous answer">
                A new request should not leave an old result looking current.
              </FlowRow>

              <FlowRow number="3" title="Clear the previous error">
                A successful retry should not continue displaying an old
                failure.
              </FlowRow>

              <FlowRow number="4" title="Always leave loading state">
                The finally block runs after either success or failure.
              </FlowRow>
            </div>
          </LessonCard>

          <LessonCard label="Calling the agent API">
            <h3 className="text-lg font-semibold">
              fetch() replaces the curl command
            </h3>

            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`const response = await fetch("/api/agents", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ prompt }),
});`}</code>
            </pre>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ConceptCard title="curl">
                <p className="font-mono text-sm">
                  POST /api/agents
                  <br />
                  Content-Type: application/json
                  <br />
                  &#123; prompt: ... &#125;
                </p>
              </ConceptCard>

              <ConceptCard title="fetch()">
                <p className="font-mono text-sm">
                  method: POST
                  <br />
                  Content-Type: application/json
                  <br />
                  JSON.stringify(&#123; prompt &#125;)
                </p>
              </ConceptCard>
            </div>

            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              The transport changed from a terminal command to browser
              JavaScript, but the API contract did not change.
            </p>
          </LessonCard>

          <LessonCard label="What happens on the server?">
            <h3 className="text-lg font-semibold">
              The UI does not need to know the internal agent steps
            </h3>

            <div className="mt-5">
              <Step>fetch(&quot;/api/agents&quot;)</Step>
              <Arrow />
              <Step>Model decides what to do</Step>
              <Arrow />

              <div className="grid gap-3 sm:grid-cols-2">
                <ConceptCard title="Tool requested">
                  <p className="font-mono text-sm">
                    guard → execute → observe → model again
                  </p>
                </ConceptCard>

                <ConceptCard title="No tool requested">
                  <p className="font-mono text-sm">return final answer</p>
                </ConceptCard>
              </div>

              <Arrow />
              <Step>Response.json(...)</Step>
            </div>

            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              This is an important abstraction boundary. The UI asks the server
              to run the agent. It does not reproduce the agent loop in the
              browser.
            </p>
          </LessonCard>

          <LessonCard label="Reading JSON">
            <h3 className="text-lg font-semibold">
              One response shape can represent success or failure
            </h3>

            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`const data = (await response.json()) as {
  text?: string;
  error?: string;
};`}</code>
            </pre>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ResponseCard
                status="200"
                body='{ "text": "11,610" }'
                meaning="The agent completed normally."
              />

              <ResponseCard
                status="422"
                body='{ "error": "Agent stopped after 5 tool rounds." }'
                meaning="The application safety boundary stopped execution."
              />
            </div>

            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              The properties are optional in this small UI type because the
              server returns different JSON shapes for different outcomes.
            </p>
          </LessonCard>

          <LessonCard label="HTTP success vs failure">
            <h3 className="text-lg font-semibold">
              response.ok tells the UI which state to update
            </h3>

            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`if (!response.ok) {
  setError(data.error ?? "The agent request failed.");
  return;
}

setAnswer(data.text ?? "");`}</code>
            </pre>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <OutcomeCard
                title="response.ok === true"
                status="setAnswer(...)"
                detail="Store the successful agent response so React can display it."
              />

              <OutcomeCard
                title="response.ok === false"
                status="setError(...)"
                detail="Store the server error instead of pretending it is a successful answer."
              />
            </div>
          </LessonCard>

          <LessonCard label="Network failure">
            <h3 className="text-lg font-semibold">
              Not every failure comes from the agent
            </h3>

            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`} catch {
  setError("Unable to reach the agent.");
} finally {
  setIsLoading(false);
}`}</code>
            </pre>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ConceptCard title="HTTP error">
                <p className="text-sm leading-6 text-muted-foreground">
                  The server responded, but the response was not successful,
                  such as the agent&apos;s 422 safety stop.
                </p>
              </ConceptCard>

              <ConceptCard title="Request failure">
                <p className="text-sm leading-6 text-muted-foreground">
                  The request itself could not complete normally, so the catch
                  block provides a browser-facing fallback message.
                </p>
              </ConceptCard>
            </div>
          </LessonCard>

          <LessonCard label="Loading UX">
            <h3 className="text-lg font-semibold">
              Agent work can take longer than one model call
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              A tool-using agent may need several model and tool rounds before
              it has a final answer. The interface should immediately show that
              the request is still active.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ConceptCard title="Button state">
                <div className="rounded-lg border border-border bg-card px-4 py-3 text-center text-sm font-medium opacity-60">
                  Running...
                </div>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  The disabled button prevents accidental duplicate clicks while
                  the current request is running.
                </p>
              </ConceptCard>

              <ConceptCard title="Status state">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                  <div
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
                  />

                  <div>
                    <p className="text-sm font-medium">Agent is working...</p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      It may use several tools before returning a final answer.
                    </p>
                  </div>
                </div>
              </ConceptCard>
            </div>

            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              The status message does not claim to visualize individual tool
              calls. It simply tells the user that the overall agent request is
              still running.
            </p>
          </LessonCard>

          <LessonCard label="Accessible status">
            <h3 className="text-lg font-semibold">
              Loading feedback should not be visual-only
            </h3>

            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`<div
  role="status"
  aria-live="polite"
>
  Agent is working...
</div>`}</code>
            </pre>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              <Code>role=&quot;status&quot;</Code> and{" "}
              <Code>aria-live=&quot;polite&quot;</Code> allow assistive
              technology to announce the changing status without requiring the
              user to find it visually.
            </p>
          </LessonCard>

          <LessonCard label="Rendering the answer">
            <h3 className="text-lg font-semibold">
              State determines what appears on screen
            </h3>

            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`{answer && (
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
)}`}</code>
            </pre>

            <div className="mt-5">
              <Step>HTTP response</Step>
              <Arrow />

              <div className="grid gap-3 sm:grid-cols-2">
                <Step>setAnswer(...)</Step>
                <Step>setError(...)</Step>
              </div>

              <Arrow />

              <div className="grid gap-3 sm:grid-cols-2">
                <Step>Answer panel</Step>
                <Step>Error panel</Step>
              </div>
            </div>
          </LessonCard>

          <LessonCard label="Client-side validation">
            <h3 className="text-lg font-semibold">
              Do not send an obviously empty request
            </h3>

            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`disabled={isLoading || !prompt.trim()}`}</code>
            </pre>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <ValidationCard
                input='""'
                result="Disabled"
                detail="Nothing was entered."
              />

              <ValidationCard
                input='"   "'
                result="Disabled"
                detail="trim() removes the whitespace."
              />

              <ValidationCard
                input='"Hello"'
                result="Enabled"
                detail="A meaningful prompt exists."
              />
            </div>
          </LessonCard>

          <LessonCard label="Why keep server validation?">
            <h3 className="text-lg font-semibold">
              The browser is not a correctness boundary
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Disabling the button improves the user experience, but it does not
              replace validation inside <Code>/api/agents</Code>.
            </p>

            <div className="mt-5">
              <Step>Browser UI</Step>
              <Arrow />
              <Step>Empty prompt → button disabled</Step>

              <div className="my-5 rounded-xl border border-border bg-background p-4 text-center">
                <p className="font-mono text-sm text-muted-foreground">
                  But the API can also be called directly...
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Step>curl</Step>
                <Step>Another application</Step>
              </div>

              <Arrow />
              <Step>/api/agents validates again → 400 if invalid</Step>
            </div>

            <div className="mt-5 rounded-xl border border-border bg-background p-4 text-center">
              <p className="font-mono font-medium">
                Client validation = UX · Server validation = API correctness
              </p>
            </div>
          </LessonCard>

          <LessonCard label="End-to-end test · dependent tools">
            <h3 className="text-lg font-semibold">
              The browser can drive the complete agent loop
            </h3>

            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Prompt
              </p>

              <p className="mt-3 text-sm leading-6">
                Use the calculator tool to multiply 27 by 43. Then multiply that
                result by 10. Finally, use the format_number tool to format that
                result.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <Step>UI → POST /api/agents</Step>
              <Arrow />
              <Step>calculator(27, 43) → 1161</Step>
              <Arrow />
              <Step>calculator(1161, 10) → 11610</Step>
              <Arrow />
              <Step>format_number(11610) → &quot;11,610&quot;</Step>
              <Arrow />
              <Step>Final model response → &quot;11,610&quot;</Step>
              <Arrow />
              <Step>UI Answer → 11,610</Step>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Metric value="200" label="HTTP status" />
              <Metric value="3" label="Tool rounds" />
              <Metric value="11,610" label="Displayed answer" />
            </div>
          </LessonCard>

          <LessonCard label="End-to-end test · safety stop">
            <h3 className="text-lg font-semibold">
              A 422 becomes useful UI feedback
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              We also tested a prompt that deliberately required a sixth
              dependent calculator round.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-5">
              <MiniRound label="#1" result="4" />
              <MiniRound label="#2" result="8" />
              <MiniRound label="#3" result="16" />
              <MiniRound label="#4" result="32" />
              <MiniRound label="#5" result="64" />
            </div>

            <Arrow />

            <Step>Model requests Round #6</Step>

            <Arrow />

            <Step>MAX_TOOL_ROUNDS → STOP</Step>

            <Arrow />

            <div className="rounded-xl border border-border bg-background p-4">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Error
              </p>

              <p className="mt-2 text-sm">Agent stopped after 5 tool rounds.</p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Metric value="422" label="HTTP status" />
              <Metric value="5" label="Executed rounds" />
              <Metric value="0" label="Sixth-round executions" />
            </div>
          </LessonCard>

          <LessonCard label="Why 422 is not a UI crash">
            <h3 className="text-lg font-semibold">
              Expected application outcomes can still be failures
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The server intentionally refuses to execute the sixth requested
              tool round. The UI should represent that decision clearly rather
              than crash or silently discard it.
            </p>

            <div className="mt-5">
              <Step>Agent reaches application boundary</Step>
              <Arrow />
              <Step>Server returns HTTP 422 + error JSON</Step>
              <Arrow />
              <Step>response.ok === false</Step>
              <Arrow />
              <Step>setError(...)</Step>
              <Arrow />
              <Step>User sees the reason execution stopped</Step>
            </div>
          </LessonCard>

          <LessonCard label="finally matters">
            <h3 className="text-lg font-semibold">
              Loading ends after success or failure
            </h3>

            <div className="mt-5">
              <Step>setIsLoading(true)</Step>
              <Arrow />

              <div className="grid gap-4 md:grid-cols-2">
                <OutcomeCard
                  title="Success"
                  status="setAnswer(...)"
                  detail="The agent returns a normal final answer."
                />

                <OutcomeCard
                  title="Failure"
                  status="setError(...)"
                  detail="The API returns an error or the request throws."
                />
              </div>

              <Arrow />

              <Step>finally → setIsLoading(false)</Step>
            </div>

            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              This guarantees that <strong>Running...</strong> and the loading
              panel disappear even when the request does not succeed.
            </p>
          </LessonCard>

          <LessonCard label="The complete browser flow">
            <div className="space-y-3">
              <Step>User types a prompt</Step>
              <Arrow />
              <Step>prompt state updates</Step>
              <Arrow />
              <Step>User clicks Run Agent</Step>
              <Arrow />
              <Step>isLoading = true</Step>
              <Arrow />
              <Step>POST /api/agents</Step>
              <Arrow />
              <Step>Existing server-side agent runs</Step>
              <Arrow />

              <div className="grid gap-4 md:grid-cols-2">
                <ConceptCard title="Success">
                  <p className="font-mono text-sm">
                    200 → text → setAnswer(...)
                  </p>
                </ConceptCard>

                <ConceptCard title="Failure">
                  <p className="font-mono text-sm">
                    !response.ok → error → setError(...)
                  </p>
                </ConceptCard>
              </div>

              <Arrow />
              <Step>finally → isLoading = false</Step>
              <Arrow />
              <Step>React re-renders the result</Step>
            </div>
          </LessonCard>

          <LessonCard label="What stays on the server?">
            <h3 className="text-lg font-semibold">
              The browser is intentionally thin
            </h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ConceptCard title="Browser responsibilities">
                <div className="space-y-3 text-sm">
                  <BoundaryItem>✓ Collect prompt</BoundaryItem>
                  <BoundaryItem>✓ Show loading state</BoundaryItem>
                  <BoundaryItem>✓ Send HTTP request</BoundaryItem>
                  <BoundaryItem>✓ Show answer</BoundaryItem>
                  <BoundaryItem>✓ Show error</BoundaryItem>
                </div>
              </ConceptCard>

              <ConceptCard title="Server responsibilities">
                <div className="space-y-3 text-sm">
                  <BoundaryItem>✓ Call the model</BoundaryItem>
                  <BoundaryItem>✓ Expose tool definitions</BoundaryItem>
                  <BoundaryItem>✓ Execute tools</BoundaryItem>
                  <BoundaryItem>✓ Continue the agent loop</BoundaryItem>
                  <BoundaryItem>✓ Enforce safety boundary</BoundaryItem>
                </div>
              </ConceptCard>
            </div>
          </LessonCard>

          <LessonCard label="What the browser must not own">
            <div className="grid gap-3 sm:grid-cols-2">
              <BoundaryItem>✗ OpenAI API key</BoundaryItem>
              <BoundaryItem>✗ Direct OpenAI SDK execution</BoundaryItem>
              <BoundaryItem>✗ Calculator dispatch</BoundaryItem>
              <BoundaryItem>✗ format_number dispatch</BoundaryItem>
              <BoundaryItem>✗ Agent while loop</BoundaryItem>
              <BoundaryItem>✗ MAX_TOOL_ROUNDS enforcement</BoundaryItem>
            </div>

            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              The UI can request agent work and display its outcome. It should
              not become a second implementation of the agent runtime.
            </p>
          </LessonCard>

          <LessonCard label="001-006 vs 002-007">
            <h3 className="text-lg font-semibold">
              Same UI pattern, more capable backend
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Lesson 001-006 gave a basic LLM a browser interface. This lesson
              applies the same separation to a much more capable backend: an
              agent that can take actions, observe results, continue across
              turns, and stop at a safety boundary.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ConceptCard title="001-006 · Simple LLM Chat UI">
                <div className="space-y-3">
                  <Step>User</Step>
                  <Arrow />
                  <Step>LLM API</Step>
                  <Arrow />
                  <Step>Answer</Step>
                </div>
              </ConceptCard>

              <ConceptCard title="002-007 · Agent UI">
                <div className="space-y-3">
                  <Step>User</Step>
                  <Arrow />
                  <Step>Agent API</Step>
                  <Arrow />
                  <Step>Model ↔ Tools ↻</Step>
                  <Arrow />
                  <Step>Answer / Safety Stop</Step>
                </div>
              </ConceptCard>
            </div>
          </LessonCard>

          <LessonCard label="What 002-007 adds">
            <div className="grid gap-4 md:grid-cols-2">
              <ConceptCard title="Added now">
                <div className="space-y-3 text-sm">
                  <BoundaryItem>✓ AgentDemo Client Component</BoundaryItem>
                  <BoundaryItem>✓ Controlled prompt input</BoundaryItem>
                  <BoundaryItem>✓ Answer state</BoundaryItem>
                  <BoundaryItem>✓ Error state</BoundaryItem>
                  <BoundaryItem>✓ Loading state</BoundaryItem>
                  <BoundaryItem>✓ POST with fetch()</BoundaryItem>
                  <BoundaryItem>✓ Loading spinner + status</BoundaryItem>
                  <BoundaryItem>✓ 422 error presentation</BoundaryItem>
                  <BoundaryItem>✓ Empty-prompt UI guard</BoundaryItem>
                </div>
              </ConceptCard>

              <ConceptCard title="Deliberately still out of scope">
                <div className="space-y-3 text-sm">
                  <BoundaryItem>✗ Tool-call visualization</BoundaryItem>
                  <BoundaryItem>✗ Conversation history</BoundaryItem>
                  <BoundaryItem>✗ Persistent conversations</BoundaryItem>
                  <BoundaryItem>✗ Database storage</BoundaryItem>
                  <BoundaryItem>✗ Rich agent event streaming</BoundaryItem>
                  <BoundaryItem>✗ New agent architecture</BoundaryItem>
                  <BoundaryItem>✗ Advanced runtime safety</BoundaryItem>
                </div>
              </ConceptCard>
            </div>

            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              Keeping those features out of this lesson lets us see the
              browser/server boundary clearly before building a larger agent
              application later in the course.
            </p>
          </LessonCard>

          <LessonCard label="Verified behavior">
            <h3 className="text-lg font-semibold">
              The browser interface preserves the existing agent
            </h3>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <BoundaryItem>✓ Controlled prompt input</BoundaryItem>
              <BoundaryItem>✓ Empty prompt → disabled</BoundaryItem>
              <BoundaryItem>✓ Whitespace prompt → disabled</BoundaryItem>
              <BoundaryItem>✓ Valid prompt → enabled</BoundaryItem>
              <BoundaryItem>✓ Loading message appears</BoundaryItem>
              <BoundaryItem>✓ Button shows Running...</BoundaryItem>
              <BoundaryItem>✓ Dependent tools → 11,610</BoundaryItem>
              <BoundaryItem>✓ Safety stop → visible 422 error</BoundaryItem>
              <BoundaryItem>✓ Loading clears after success</BoundaryItem>
              <BoundaryItem>✓ Loading clears after error</BoundaryItem>
              <BoundaryItem>✓ Existing /api/agents unchanged</BoundaryItem>
              <BoundaryItem>✓ pnpm lint passes</BoundaryItem>
            </div>
          </LessonCard>

          <LessonCard label="Current boundary">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="font-medium">
                Section 002 now has a complete vertical slice.
              </p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A user can enter a task in the browser, the server-side agent
                can decide and execute tool actions across bounded rounds, and
                the final outcome returns to the browser as either an answer or
                a clear application error.
              </p>
            </div>

            <div className="mt-5">
              <Step>User interface</Step>
              <Arrow />
              <Step>Agent API</Step>
              <Arrow />
              <Step>Model reasoning</Step>
              <Arrow />
              <Step>Tool execution</Step>
              <Arrow />
              <Step>Safety boundary</Step>
              <Arrow />
              <Step>Final outcome</Step>
              <Arrow />
              <Step>User interface</Step>
            </div>
          </LessonCard>

          <LessonCard label="Takeaway">
            <div className="rounded-xl border border-border bg-background p-5 text-center">
              <p className="font-mono text-lg font-semibold">
                The UI does not become the agent.
              </p>

              <p className="mt-2 font-mono text-lg font-semibold">
                The UI gives the existing agent an interface.
              </p>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                React owns browser interaction and presentation. The server
                continues to own model calls, tool execution, the agent loop,
                and its safety boundary.
              </p>
            </div>
          </LessonCard>

          <LessonCard label="Section 002 complete">
            <h3 className="text-lg font-semibold">
              From function calls to a usable agent
            </h3>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Milestone
                lesson="002-001"
                title="What is an Agent?"
                detail="Model + actions + observations + repeated decisions."
              />

              <Milestone
                lesson="002-002"
                title="Function / Tool Calling"
                detail="Let the model request structured application actions."
              />

              <Milestone
                lesson="002-003"
                title="Calculator Tool"
                detail="Execute a real tool and return its observation."
              />

              <Milestone
                lesson="002-004"
                title="Agent Loop"
                detail="Continue model → tool → observation → model."
              />

              <Milestone
                lesson="002-005"
                title="Multiple Tool Calls"
                detail="Handle breadth as well as dependent depth."
              />

              <Milestone
                lesson="002-006"
                title="Safety Guard"
                detail="Bound how many tool rounds may execute."
              />

              <Milestone
                lesson="002-007"
                title="Agent UI"
                detail="Expose the bounded agent through the browser."
              />
            </div>
          </LessonCard>

          <LessonCard label="Next">
            <h3 className="text-lg font-semibold">Section 003 · RAG</h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Our agent can now use application tools and expose that behavior
              through a browser interface. Next we move into retrieval:
              connecting model responses to information supplied by our
              application.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <Step>LLMs</Step>
              <HorizontalArrow />
              <Step>Agents</Step>
              <HorizontalArrow />
              <Step>RAG</Step>
            </div>
          </LessonCard>
        </section>
      </div>
    </CourseLayout>
  );
}

function LessonCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <div className="mt-2">{children}</div>
    </div>
  );
}

function Step({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background px-4 py-3 text-center font-medium">
      {children}
    </div>
  );
}

function ConceptCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="font-medium">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function StateCard({
  name,
  initial,
  detail,
}: {
  name: string;
  initial: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="font-mono font-semibold">{name}</p>
      <p className="mt-2 font-mono text-sm text-muted-foreground">
        initial → {initial}
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

function ResponseCard({
  status,
  body,
  meaning,
}: {
  status: string;
  body: string;
  meaning: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="font-mono text-lg font-semibold">HTTP {status}</p>
      <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-card p-3 text-xs leading-5">
        <code>{body}</code>
      </pre>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{meaning}</p>
    </div>
  );
}

function ValidationCard({
  input,
  result,
  detail,
}: {
  input: string;
  result: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="font-mono text-sm">{input}</p>
      <p className="mt-3 font-medium">{result}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 text-center">
      <p className="font-mono text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function FlowRow({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-[auto_1fr]">
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border font-mono text-sm">
        {number}
      </div>

      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {children}
        </p>
      </div>
    </div>
  );
}

function OutcomeCard({
  title,
  status,
  detail,
}: {
  title: string;
  status: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="font-medium">{title}</p>
      <p className="mt-3 font-mono text-lg font-semibold">{status}</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

function MiniRound({ label, result }: { label: string; result: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3 text-center">
      <p className="font-mono text-xs text-muted-foreground">Round {label}</p>
      <p className="mt-2 font-mono font-medium">→ {result}</p>
    </div>
  );
}

function Milestone({
  lesson,
  title,
  detail,
}: {
  lesson: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {lesson}
      </p>
      <p className="mt-2 font-medium">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

function BoundaryItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm">
      {children}
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-sm text-foreground">{children}</span>;
}

function Arrow() {
  return (
    <div
      aria-hidden="true"
      className="my-3 text-center font-mono text-muted-foreground"
    >
      ↓
    </div>
  );
}

function HorizontalArrow() {
  return (
    <div
      aria-hidden="true"
      className="hidden text-center font-mono text-muted-foreground sm:block"
    >
      →
    </div>
  );
}
