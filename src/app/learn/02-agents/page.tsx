import { CourseLayout } from "@/components/learn/course-layout";
import { courseSections } from "@/lib/course";

/**
 * Lesson 002-006 — Safety Guard
 *
 * PAST — 002-005: Multiple Tool Calls
 * --------------------------------
 * The previous lesson gave the agent two dimensions:
 *
 *   while (true)       = DEPTH across tool rounds
 *   toolCalls.map(...) = BREADTH inside one tool round
 *
 * The agent can use multiple tool types, execute every function call
 * requested in one response, and continue across dependent model turns.
 *
 * But the depth was still unbounded:
 *
 *   Model → Tools → Model → Tools → Model → ...
 *
 *
 * NOW — 002-006: Safety Guard
 * --------------------------------
 * This lesson adds one application policy:
 *
 *   MAX_TOOL_ROUNDS = 5
 *
 * We count TOOL ROUNDS rather than individual tool calls.
 *
 * One tool round means:
 *
 *   one model response requests one or more tools
 *       ↓
 *   application executes all requested tools
 *       ↓
 *   observations go back to the model
 *
 * The guard is checked only when another tool round is requested.
 *
 * Normal completion is checked FIRST so a model that finishes after the
 * fifth permitted round can still return its final answer.
 *
 *
 * TESTED BOUNDARY
 * --------------------------------
 * Exactly five rounds then final answer:
 *
 *   → 200 OK
 *
 * Five rounds then request Round #6:
 *
 *   → 422
 *   → Round #6 does not execute
 *
 *
 * NEXT — 002-007: Agent UI
 * --------------------------------
 * The backend agent now has bounded execution depth.
 *
 * The next lesson adds the user-facing Agent UI.
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
              Lesson 002-006
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Safety Guard
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
              Our agent can already continue across model turns and execute
              multiple tool calls. Now the application puts a deliberate limit
              on how deep that execution may go.
            </p>
          </div>

          <LessonCard label="From the previous lesson">
            <h3 className="text-lg font-semibold">
              Depth and breadth are different dimensions
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Lesson 002-005 taught us that <Code>while (true)</Code> and{" "}
              <Code>toolCalls.map(...)</Code> solve different problems.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ConceptCard title="while (true) · DEPTH">
                <div className="space-y-2 font-mono text-sm">
                  <Step>Model #1</Step>
                  <Arrow />
                  <Step>Model #2</Step>
                  <Arrow />
                  <Step>Model #3</Step>
                  <Arrow />
                  <Step>...</Step>
                </div>

                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Keeps the agent moving across model decisions as new tool
                  observations become available.
                </p>
              </ConceptCard>

              <ConceptCard title="toolCalls.map(...) · BREADTH">
                <Step>One Model Response</Step>

                <Arrow />

                <div className="grid grid-cols-2 gap-2">
                  <Step>call_A</Step>
                  <Step>call_B</Step>
                </div>

                <Arrow />

                <div className="grid grid-cols-2 gap-2">
                  <Step>output_A</Step>
                  <Step>output_B</Step>
                </div>

                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Handles every tool call requested together in one model
                  response.
                </p>
              </ConceptCard>
            </div>

            <div className="mt-5 rounded-xl border border-border bg-background p-4 text-center">
              <p className="font-mono font-medium">
                while = DEPTH · map = BREADTH
              </p>
            </div>
          </LessonCard>

          <LessonCard label="The problem">
            <h3 className="text-lg font-semibold">
              Our depth is still unbounded
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Until this lesson, the application trusted the model/tool cycle to
              eventually terminate.
            </p>

            <div className="mt-5">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
                <Step>Model</Step>
                <HorizontalArrow />
                <Step>Tools</Step>
                <HorizontalArrow />
                <Step>Observations</Step>
              </div>

              <Arrow />

              <div className="mx-auto max-w-sm">
                <Step>Model again ↻</Step>
              </div>
            </div>

            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`while (true) {
  // keep going until the model stops
}`}</code>
            </pre>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              That loop is useful because we cannot know in advance how many
              dependent decisions a task requires. But useful depth should still
              have an application-defined boundary.
            </p>
          </LessonCard>

          <LessonCard label="What changes in 002-006?">
            <h3 className="text-lg font-semibold">
              Add one explicit safety policy
            </h3>

            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`const MAX_TOOL_ROUNDS = 5;
let toolRound = 0;`}</code>
            </pre>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ConceptCard title="MAX_TOOL_ROUNDS">
                <p className="font-mono text-3xl font-semibold">5</p>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Application policy: this request may execute at most five tool
                  rounds.
                </p>
              </ConceptCard>

              <ConceptCard title="toolRound">
                <p className="font-mono text-3xl font-semibold">0 → 5</p>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Per-request runtime state: how many tool rounds have already
                  been permitted to execute.
                </p>
              </ConceptCard>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Five is a course-friendly demonstration value, not a universal
              production recommendation.
            </p>
          </LessonCard>

          <LessonCard label="What exactly are we counting?">
            <h3 className="text-lg font-semibold">
              Model calls ≠ tool rounds ≠ individual tool calls
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The word &quot;step&quot; can become ambiguous in an agent loop,
              so this lesson uses more precise names.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <CountCard
                count="1"
                label="Model call"
                detail="One request to the AI model."
              />

              <CountCard
                count="1"
                label="Tool round"
                detail="One model response whose requested tools are executed and observed."
              />

              <CountCard
                count="1+"
                label="Tool calls"
                detail="The individual functions executed inside that tool round."
              />
            </div>
          </LessonCard>

          <LessonCard label="Example · no tools">
            <h3 className="text-lg font-semibold">
              A normal answer uses zero tool rounds
            </h3>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <Step>“Say hello.”</Step>
              <HorizontalArrow />
              <Step>Model → “Hello!”</Step>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Metric value="1" label="Model call" />
              <Metric value="0" label="Tool rounds" />
              <Metric value="0" label="Tool calls" />
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              The safety guard limits tool execution depth. It does not require
              every model response to use a tool.
            </p>
          </LessonCard>

          <LessonCard label="Example · one tool">
            <h3 className="text-lg font-semibold">
              One tool request creates one tool round
            </h3>

            <div className="mt-5 space-y-3">
              <Step>Model #1</Step>
              <Arrow />
              <Step>calculator(27, 43)</Step>
              <Arrow />
              <Step>TOOL RESULT → 1161</Step>
              <Arrow />
              <Step>Model #2 → Final Answer</Step>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Metric value="2" label="Model calls" />
              <Metric value="1" label="Tool round" />
              <Metric value="1" label="Tool call" />
            </div>
          </LessonCard>

          <LessonCard label="Example · breadth">
            <h3 className="text-lg font-semibold">
              Two tool calls can still be one round
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              If one model response requests two independent calculations,{" "}
              <Code>.map()</Code> executes both inside the same permitted tool
              round.
            </p>

            <div className="mt-5">
              <div className="mx-auto max-w-sm">
                <Step>Model #1</Step>
              </div>

              <Arrow />

              <div className="grid gap-3 sm:grid-cols-2">
                <CallCard action="calculator(27, 43)" result="1161" />

                <CallCard action="calculator(15, 20)" result="300" />
              </div>

              <Arrow />

              <div className="mx-auto max-w-sm">
                <Step>Model #2 → Final Answer</Step>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Metric value="2" label="Model calls" />
              <Metric value="1" label="Tool round" />
              <Metric value="2" label="Tool calls" />
            </div>

            <div className="mt-5 rounded-xl border border-border bg-background p-4 text-center">
              <p className="font-mono font-medium">
                Safety guard → DEPTH · .map() → BREADTH
              </p>
            </div>
          </LessonCard>

          <LessonCard label="Example · depth">
            <h3 className="text-lg font-semibold">
              Dependent actions create multiple tool rounds
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Our calculator → calculator → formatter example requires each
              later action to observe the previous result.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <RoundCard
                round="Round #1"
                action="calculator(27, 43)"
                result="1161"
              />

              <RoundCard
                round="Round #2"
                action="calculator(1161, 10)"
                result="11610"
              />

              <RoundCard
                round="Round #3"
                action="format_number(11610)"
                result='"11,610"'
              />

              <RoundCard
                round="Finish"
                action="Model #4"
                result='Final: "11,610"'
              />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <Metric value="4" label="Model calls" />
              <Metric value="3" label="Tool rounds" />
              <Metric value="3" label="Tool calls" />
            </div>
          </LessonCard>

          <LessonCard label="The guard">
            <h3 className="text-lg font-semibold">
              Check before executing another tool round
            </h3>

            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`if (toolCalls.length === 0) {
  return Response.json({
    type: "message",
    text: response.output_text,
    output: response.output,
  });
}

if (toolRound >= MAX_TOOL_ROUNDS) {
  return Response.json(
    {
      error:
        \`Agent stopped after \${MAX_TOOL_ROUNDS} tool rounds.\`,
    },
    { status: 422 },
  );
}

toolRound++;`}</code>
            </pre>

            <div className="mt-5 space-y-3">
              <FlowRow number="1" title="Collect toolCalls[]">
                Inspect the current model response.
              </FlowRow>

              <FlowRow number="2" title="No calls? Finish normally.">
                A final answer wins before the safety-limit check.
              </FlowRow>

              <FlowRow number="3" title="Limit reached? Stop.">
                Do not execute another requested tool round.
              </FlowRow>

              <FlowRow number="4" title="Otherwise permit the round.">
                Increment the round counter once and execute every requested
                call.
              </FlowRow>
            </div>
          </LessonCard>

          <LessonCard label="Why this order matters">
            <h3 className="text-lg font-semibold">
              Reaching five rounds is not itself an error
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              After Round #5, the model still needs an opportunity to observe
              those tool results and decide whether it is finished.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <OutcomeCard
                title="5 rounds + FINISH"
                status="200 OK"
                detail="The next model response contains no function_call, so the final answer is returned normally."
              />

              <OutcomeCard
                title="5 rounds + request #6"
                status="422 STOP"
                detail="The next model response requests more tools, so the application blocks the sixth round before execution."
              />
            </div>

            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <p className="font-mono text-sm text-center">
                check final answer → check guard → execute round
              </p>
            </div>
          </LessonCard>

          <LessonCard label="Boundary test · exactly five rounds">
            <h3 className="text-lg font-semibold">Five rounds are allowed</h3>

            <div className="mt-5 grid gap-3 sm:grid-cols-5">
              <MiniRound label="#1" result="4" />
              <MiniRound label="#2" result="8" />
              <MiniRound label="#3" result="16" />
              <MiniRound label="#4" result="32" />
              <MiniRound label="#5" result="64" />
            </div>

            <Arrow />

            <Step>Model → no tool calls → Final Answer “64”</Step>

            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <p className="font-mono text-sm">HTTP 200 · PASS ✓</p>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              This test proves that the guard does not accidentally reject a
              valid final answer merely because the fifth round has completed.
            </p>
          </LessonCard>

          <LessonCard label="Safety test · request round #6">
            <h3 className="text-lg font-semibold">
              The sixth requested round never executes
            </h3>

            <div className="mt-5 grid gap-3 sm:grid-cols-5">
              <MiniRound label="#1" result="4" />
              <MiniRound label="#2" result="8" />
              <MiniRound label="#3" result="16" />
              <MiniRound label="#4" result="32" />
              <MiniRound label="#5" result="64" />
            </div>

            <Arrow />

            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <Step>Model requests calculator(64, 2)</Step>
              <HorizontalArrow />
              <Step>5 ≥ 5 → STOP</Step>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ConceptCard title="Requested">
                <p className="font-mono text-sm">calculator(64, 2)</p>
              </ConceptCard>

              <ConceptCard title="Never happened">
                <p className="font-mono text-sm">
                  TOOL RESULT: calculator 128 ✗
                </p>
              </ConceptCard>
            </div>

            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <p className="font-mono text-sm">
                HTTP 422 · Agent stopped after 5 tool rounds.
              </p>
            </div>
          </LessonCard>

          <LessonCard label="The complete 002-006 loop">
            <pre className="overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`const MAX_TOOL_ROUNDS = 5;
let toolRound = 0;

while (true) {
  const toolCalls = response.output.filter(
    (item) => item.type === "function_call",
  );

  if (toolCalls.length === 0) {
    return finalAnswer;
  }

  if (toolRound >= MAX_TOOL_ROUNDS) {
    return safetyStop;
  }

  toolRound++;

  const toolOutputs = toolCalls.map((toolCall) => {
    // dispatch and execute every requested tool
    return functionCallOutput;
  });

  response = await openai.responses.create({
    previous_response_id: response.id,
    input: toolOutputs,
    tools: [calculatorTool, formatNumberTool],
  });
}`}</code>
            </pre>

            <div className="mt-5">
              <Step>Model Response</Step>
              <Arrow />
              <Step>filter → toolCalls[]</Step>
              <Arrow />

              <div className="grid gap-3 md:grid-cols-2">
                <ConceptCard title="0 calls">
                  <p className="font-mono text-sm">Final Answer → 200</p>
                </ConceptCard>

                <ConceptCard title="1+ calls">
                  <p className="font-mono text-sm">Check MAX_TOOL_ROUNDS</p>
                </ConceptCard>
              </div>

              <Arrow />

              <Step>
                Allowed → map all calls → toolOutputs[] → Model again ↻
              </Step>
            </div>
          </LessonCard>

          <LessonCard label="What the guard does — and does not do">
            <div className="grid gap-4 md:grid-cols-2">
              <ConceptCard title="002-006 adds">
                <div className="space-y-3 text-sm">
                  <BoundaryItem>✓ Maximum tool-round policy</BoundaryItem>
                  <BoundaryItem>✓ Per-request round counter</BoundaryItem>
                  <BoundaryItem>✓ Guard before next round</BoundaryItem>
                  <BoundaryItem>✓ 422 safety stop</BoundaryItem>
                  <BoundaryItem>✓ Normal finish at the boundary</BoundaryItem>
                </div>
              </ConceptCard>

              <ConceptCard title="Still out of scope">
                <div className="space-y-3 text-sm">
                  <BoundaryItem>✗ Runtime schema validation</BoundaryItem>
                  <BoundaryItem>✗ Token budget</BoundaryItem>
                  <BoundaryItem>✗ Cost budget</BoundaryItem>
                  <BoundaryItem>✗ Time budget</BoundaryItem>
                  <BoundaryItem>✗ Promise.all / concurrency</BoundaryItem>
                  <BoundaryItem>✗ Agent UI</BoundaryItem>
                </div>
              </ConceptCard>
            </div>

            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              Production agents may use several independent safety limits. This
              lesson deliberately introduces only one so the mechanism stays
              easy to see.
            </p>
          </LessonCard>

          <LessonCard label="Regression verification">
            <h3 className="text-lg font-semibold">
              Earlier agent behavior still works
            </h3>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <BoundaryItem>✓ No-tool response → “Hello!”</BoundaryItem>
              <BoundaryItem>✓ One calculator → 1161</BoundaryItem>
              <BoundaryItem>
                ✓ Dependent calculator → calculator → formatter
              </BoundaryItem>
              <BoundaryItem>
                ✓ Two independent calls in one response
              </BoundaryItem>
              <BoundaryItem>✓ Empty prompt → 400</BoundaryItem>
              <BoundaryItem>✓ Whitespace prompt → 400</BoundaryItem>
              <BoundaryItem>✓ Non-string prompt → 400</BoundaryItem>
              <BoundaryItem>✓ Round #6 blocked → 422</BoundaryItem>
            </div>
          </LessonCard>

          <LessonCard label="Current boundary">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="font-medium">
                The agent loop now has bounded depth.
              </p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                We kept the multiple-tool architecture from 002-005 and added
                one explicit policy around the outer execution loop.
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <BoundaryItem>✓ calculator + format_number</BoundaryItem>
              <BoundaryItem>✓ Dependent tool rounds</BoundaryItem>
              <BoundaryItem>✓ Multiple calls per round</BoundaryItem>
              <BoundaryItem>✓ .filter() → toolCalls[]</BoundaryItem>
              <BoundaryItem>✓ .map() → toolOutputs[]</BoundaryItem>
              <BoundaryItem>✓ MAX_TOOL_ROUNDS = 5</BoundaryItem>
              <BoundaryItem>✓ 5 rounds + finish → 200</BoundaryItem>
              <BoundaryItem>✓ Request Round #6 → 422</BoundaryItem>
              <BoundaryItem>✗ Runtime schema validation</BoundaryItem>
              <BoundaryItem>✗ Agent UI</BoundaryItem>
            </div>
          </LessonCard>

          <LessonCard label="Takeaway">
            <div className="rounded-xl border border-border bg-background p-5 text-center">
              <p className="font-mono text-lg font-semibold">
                while gives the agent depth.
              </p>

              <p className="mt-2 font-mono text-lg font-semibold">
                MAX_TOOL_ROUNDS bounds that depth.
              </p>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                The model decides what action it wants next. The application
                decides whether another round is still allowed.
              </p>
            </div>
          </LessonCard>

          <LessonCard label="Next">
            <h3 className="text-lg font-semibold">002-007 · Agent UI</h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The backend agent can now use tools repeatedly, handle multiple
              calls, and stop at an application-defined safety boundary. Next we
              will make that agent accessible through a user-facing interface.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <Step>Agent loop</Step>
              <HorizontalArrow />
              <Step>Safety boundary</Step>
              <HorizontalArrow />
              <Step>Agent UI</Step>
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

function CountCard({
  count,
  label,
  detail,
}: {
  count: string;
  label: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="font-mono text-2xl font-semibold">{count}</p>
      <p className="mt-2 font-medium">{label}</p>
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

function RoundCard({
  round,
  action,
  result,
}: {
  round: string;
  action: string;
  result: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {round}
      </p>

      <p className="mt-3 font-mono text-sm">{action}</p>
      <p className="mt-2 font-mono text-sm text-muted-foreground">→ {result}</p>
    </div>
  );
}

function CallCard({ action, result }: { action: string; result: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="font-mono text-sm">{action}</p>

      <div className="my-3 text-center font-mono text-muted-foreground">↓</div>

      <p className="font-mono text-sm">function_call_output: {result}</p>
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
