import { CourseLayout } from "@/components/learn/course-layout";
import { courseSections } from "@/lib/course";

/**
 * Lesson 002-004 — Agent Loop
 *
 * PAST — 002-003: Calculator Tool
 * --------------------------------
 * The previous lesson connected a model-requested function call to a real
 * application-side calculator:
 *
 *   Model
 *      ↓
 *   function_call
 *      ↓
 *   calculator(...)
 *      ↓
 *   result
 *      ↓
 *   STOP
 *
 * The missing piece was feedback.
 *
 * The application knew the calculator result, but the model did not receive
 * that result and therefore could not use it to make another decision.
 *
 *
 * NOW — 002-004: Agent Loop
 * --------------------------------
 * We return each tool result to the model as a `function_call_output`.
 *
 *   Model
 *      ↓
 *   function_call
 *      ↓
 *   calculator(...)
 *      ↓
 *   result
 *      ↓
 *   function_call_output
 *      ↓
 *   Model again
 *      ↓
 *     ...
 *
 * The application repeats this cycle until the newest model response contains
 * no function_call. At that point the model has produced its final answer.
 *
 *
 * TEACHING EXAMPLE
 * --------------------------------
 *
 *   "Multiply 27 by 43. Then multiply that result by 10."
 *
 * Runtime:
 *
 *   Model #1
 *      ↓
 *   calculator(27, 43)
 *      ↓
 *   1161
 *      ↓
 *   Model #2
 *      ↓
 *   calculator(1161, 10)
 *      ↓
 *   11610
 *      ↓
 *   Model #3
 *      ↓
 *   Final Answer
 *
 *
 * IMPORTANT IMPLEMENTATION DETAILS
 * --------------------------------
 *
 * 1. `function_call_output`
 *    Turns the application result into an observation for the model.
 *
 * 2. `call_id`
 *    Correlates the observation with the function call that requested it.
 *
 * 3. `previous_response_id`
 *    Continues the previous model interaction so the model can continue
 *    working toward the original goal.
 *
 * 4. `let response`
 *    Each trip around the loop replaces the previous model response.
 *
 * 5. `.find()` instead of `response.output[0]`
 *    `response.output` is heterogeneous. A function call is not guaranteed
 *    to be the first output item.
 *
 * 6. `.find()` instead of `.filter()` for this lesson
 *    002-004 intentionally handles one requested calculator action per loop
 *    iteration. Broader multiple-call/tool handling belongs to 002-005.
 *
 *
 * NEXT — 002-005: Multiple Tool Calls
 * --------------------------------
 * Expand the agent beyond this lesson's single calculator capability and
 * teach richer tool selection and dispatch.
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
              Lesson 002-004
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Agent Loop
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
              A tool result no longer ends the request. Our application returns
              the result to the model as an observation, lets the model decide
              again, and repeats until the model produces its final answer.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              From the previous lesson
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-center">
              <Step>Model</Step>
              <HorizontalArrow />
              <Step>function_call</Step>
              <HorizontalArrow />
              <Step>calculator()</Step>
              <HorizontalArrow />
              <Step>result</Step>
            </div>

            <Arrow />

            <div className="mx-auto max-w-xs">
              <Step>STOP</Step>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              In 002-003, our application could execute a real calculator, but
              the result stopped inside the application. The model never
              observed it.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              What changes in 002-004?
            </p>

            <h3 className="mt-2 text-lg font-semibold">
              The result goes back to the model
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              After executing the calculator, we turn its result into a{" "}
              <Code>function_call_output</Code>. The model receives that
              observation and gets another opportunity to decide what should
              happen next.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <Step>calculator()</Step>
              <HorizontalArrow />
              <Step>result</Step>
              <HorizontalArrow />
              <Step>function_call_output</Step>
            </div>

            <Arrow />

            <div className="mx-auto max-w-xs">
              <Step>Model again</Step>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              The agent loop
            </p>

            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
                <Step>Model</Step>
                <HorizontalArrow />
                <Step>function_call</Step>
                <HorizontalArrow />
                <Step>calculator()</Step>
              </div>

              <Arrow />

              <div className="mx-auto max-w-sm">
                <Step>function_call_output</Step>
              </div>

              <Arrow />

              <div className="mx-auto max-w-sm">
                <Step>Model again ↻</Step>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              We do not know ahead of time how many steps the task will need.
              The loop keeps executing requested actions and returning
              observations until the model stops requesting a tool.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Example · Two calculator actions
            </p>

            <p className="mt-3 leading-7 text-muted-foreground">
              Our test prompt requires the result of the first calculation
              before the second calculation can be performed:
            </p>

            <div className="mt-4 rounded-xl border border-border bg-background p-4 font-mono text-sm leading-6">
              Multiply 27 by 43. Then multiply that result by 10.
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
              <Iteration label="Model #1" action="27 × 43" result="1161" />
              <HorizontalArrow />
              <Iteration label="Model #2" action="1161 × 10" result="11610" />
              <HorizontalArrow />
              <Iteration
                label="Model #3"
                action="No tool request"
                result='Final: "11,610"'
              />
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              The calculator produced <Code>11610</Code>. The model chose to
              present that value as <Code>11,610</Code> in its final answer.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Connecting request → observation
              </p>

              <h3 className="mt-2 font-semibold">call_id</h3>

              <div className="mt-4 space-y-3 font-mono text-sm">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-muted-foreground">function_call</p>
                  <p className="mt-1">call_id: call_abc123</p>
                </div>

                <div className="text-center text-muted-foreground">↓</div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-muted-foreground">function_call_output</p>
                  <p className="mt-1">call_id: call_abc123</p>
                  <p>output: &quot;1161&quot;</p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                The matching ID tells the model which requested function call
                produced this observation.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Continuing the conversation
              </p>

              <h3 className="mt-2 font-semibold">previous_response_id</h3>

              <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
                <code>{`response = await openai.responses.create({
  model: "gpt-5.6-luna",
  previous_response_id: response.id,
  input: [toolOutput],
  tools: [calculatorTool],
});`}</code>
              </pre>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                The next model call continues from the previous response while
                receiving the new tool observation. That is how the model can
                continue working toward the original goal.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              The loop in code
            </p>

            <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`while (true) {
  const toolCall = response.output.find(
    (item) => item.type === "function_call",
  );

  if (!toolCall) {
    return finalAnswer;
  }

  const result = calculator(...);

  const toolOutput = {
    type: "function_call_output",
    call_id: toolCall.call_id,
    output: String(result),
  };

  response = await openai.responses.create({
    previous_response_id: response.id,
    input: [toolOutput],
    tools: [calculatorTool],
  });
}`}</code>
            </pre>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Each assignment to <Code>response</Code> replaces the previous
              model response with the newest decision. Then{" "}
              <Code>while (true)</Code> starts its next iteration.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Why .find() instead of [0]?
              </p>

              <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
                <code>{`response.output.find(
  (item) => item.type === "function_call",
);`}</code>
              </pre>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                <Code>response.output</Code> is heterogeneous. It may contain
                reasoning, messages, and function calls. A{" "}
                <Code>function_call</Code> is not guaranteed to be{" "}
                <Code>output[0]</Code>.
              </p>

              <div className="mt-4 rounded-xl border border-border bg-background p-4 font-mono text-sm leading-6">
                <p>output[0] → reasoning</p>
                <p>output[1] → message</p>
                <p>output[2] → function_call ← found</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Why .find() instead of .filter()?
              </p>

              <div className="mt-4 rounded-xl border border-border bg-background p-4 font-mono text-sm leading-6">
                <p>.find() → one requested action</p>
                <p className="mt-2 text-muted-foreground">
                  .filter() → multiple matching actions
                </p>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                This is a curriculum choice, not a claim that models can only
                request one function. Lesson 002-004 intentionally executes one
                requested calculator action per loop iteration so we can focus
                on the loop itself.
              </p>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Broader multiple-call and multiple-tool handling comes in{" "}
                <Code>002-005</Code>.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              How does while (true) stop?
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <Step>Search for function_call</Step>
              <HorizontalArrow />
              <Step>No function_call found</Step>
            </div>

            <Arrow />

            <div className="mx-auto max-w-sm">
              <Step>return final answer</Step>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Returning the HTTP response exits the Route Handler, so the loop
              ends. The model producing no new function call is our termination
              condition in this lesson.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Current boundary
            </p>

            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <p className="font-medium">
                One calculator capability. Repeated decisions.
              </p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                We now have a real agent loop, but we are deliberately keeping
                the available capability simple. There is still only one
                application tool: the calculator.
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <BoundaryItem>✓ Repeat model decisions</BoundaryItem>
              <BoundaryItem>✓ Return tool observations</BoundaryItem>
              <BoundaryItem>✓ Execute calculator repeatedly</BoundaryItem>
              <BoundaryItem>✓ Stop on final answer</BoundaryItem>
              <BoundaryItem>✗ Multiple tool capabilities</BoundaryItem>
              <BoundaryItem>✗ Safety / maximum-step guard</BoundaryItem>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Next
            </p>

            <h3 className="mt-2 font-semibold">
              002-005 · Multiple Tool Calls
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Now that the model → action → observation → model loop is clear,
              we can expand the agent beyond one calculator capability and teach
              richer tool selection and dispatch.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <Step>calculator()</Step>
              <HorizontalArrow />
              <Step>Model decides again</Step>
              <HorizontalArrow />
              <Step>another tool</Step>
            </div>
          </div>
        </section>
      </div>
    </CourseLayout>
  );
}

function Step({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-background px-4 py-3 text-center font-medium">
      {children}
    </div>
  );
}

function Iteration({
  label,
  action,
  result,
}: {
  label: string;
  action: string;
  result: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-medium">{action}</p>
      <p className="mt-2 font-mono text-sm text-muted-foreground">→ {result}</p>
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
