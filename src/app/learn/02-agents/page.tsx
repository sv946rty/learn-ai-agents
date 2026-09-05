import { CourseLayout } from "@/components/learn/course-layout";
import { courseSections } from "@/lib/course";

/**
 * Lesson 002-005 — Multiple Tool Calls
 *
 * PAST — 002-004: Agent Loop
 * --------------------------------
 * The previous lesson taught the repeating agent loop:
 *
 *   Model
 *      ↓
 *   function_call
 *      ↓
 *   calculator(...)
 *      ↓
 *   function_call_output
 *      ↓
 *   Model again
 *      ↓
 *   repeat
 *
 * But 002-004 deliberately handled one requested action at a time with:
 *
 *   response.output.find(...)
 *
 *
 * NOW — 002-005: Multiple Tool Calls
 * --------------------------------
 * This lesson expands the loop in two related but different ways:
 *
 *   1. MULTIPLE TOOL TYPES
 *
 *      calculator
 *      format_number
 *
 *   2. MULTIPLE FUNCTION CALLS IN ONE MODEL RESPONSE
 *
 *      function_call #1
 *      function_call #2
 *
 * These are not the same concept.
 *
 * Multiple tool types means the model can choose between different
 * application capabilities.
 *
 * Multiple function calls means one model response can request more than
 * one action before the next model turn.
 *
 *
 * DEPENDENT CALLS
 * --------------------------------
 * Some calls require earlier observations:
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
 *   format_number(11610)
 *      ↓
 *   "11,610"
 *      ↓
 *   Model #4
 *      ↓
 *   Final Answer
 *
 * These calls happen across multiple model turns because later arguments
 * depend on earlier tool results.
 *
 *
 * INDEPENDENT CALLS
 * --------------------------------
 * Other calls already have all required arguments:
 *
 *   calculator(27, 43)
 *   calculator(15, 20)
 *
 * One model response may therefore contain BOTH function calls.
 *
 * The application must execute both and return both observations before
 * asking the model to decide again.
 *
 *
 * `.find()` → `.filter()`
 * --------------------------------
 * 002-004:
 *
 *   response.output
 *       ↓
 *   .find(...)
 *       ↓
 *   toolCall
 *
 * 002-005:
 *
 *   response.output
 *       ↓
 *   .filter(...)
 *       ↓
 *   toolCalls[]
 *       ↓
 *   .map(...)
 *       ↓
 *   toolOutputs[]
 *
 * Our experiment proved why this matters.
 *
 * When the model requested two independent calculator calls and the
 * application still used `.find()`, only the first call received an output.
 *
 * OpenAI rejected the continuation:
 *
 *   400 No tool output found for function call ...
 *
 *
 * TOOL DISPATCH
 * --------------------------------
 * The model-facing tool name must be explicitly connected to the real
 * application-side implementation:
 *
 *   "calculator"    → calculator()
 *   "format_number" → formatNumber()
 *
 * Tool definition and tool implementation remain separate concepts.
 *
 *
 * CORRECT-LOOKING ANSWERS CAN HIDE BROKEN EXECUTION
 * --------------------------------
 * During development, format_number was accidentally dispatched through
 * calculator().
 *
 * The application produced:
 *
 *   undefined
 *
 * but the model still eventually returned:
 *
 *   "11,610"
 *
 * Therefore a correct-looking final answer does not prove that the tool
 * pipeline executed correctly.
 *
 * The temporary TOOL CALLS and TOOL RESULT logs let us inspect what really
 * happened.
 *
 *
 * MULTIPLE CALLS ≠ PARALLEL JAVASCRIPT
 * --------------------------------
 * `toolCalls.map(...)` executes the deterministic tools synchronously in
 * this lesson.
 *
 * We are teaching multiple actions requested in one model response, not
 * concurrent or asynchronous JavaScript execution.
 *
 *
 * NEXT — 002-006: Safety Guard
 * --------------------------------
 * The agent still uses:
 *
 *   while (true)
 *
 * with no maximum-iteration guard.
 *
 * Bounding the loop belongs to 002-006.
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
              Lesson 002-005
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Multiple Tool Calls
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
              Our agent loop can now choose between different tool capabilities
              and handle every function call returned together in one model
              response.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              From the previous lesson
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <Step>Model</Step>
              <HorizontalArrow />
              <Step>one function_call</Step>
              <HorizontalArrow />
              <Step>calculator()</Step>
            </div>

            <Arrow />

            <div className="mx-auto max-w-sm">
              <Step>function_call_output → Model again ↻</Step>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Lesson 002-004 gave us the agent loop, but intentionally handled
              one requested calculator action at a time with{" "}
              <Code>.find()</Code>.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              What changes in 002-005?
            </p>

            <h3 className="mt-2 text-lg font-semibold">
              Two upgrades to the same agent loop
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Multiple tool types and multiple calls in one response are
              related, but they are different ideas.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ConceptCard title="1 · Multiple tool types">
                <div className="space-y-2 font-mono text-sm">
                  <p>calculator</p>
                  <p>format_number</p>
                </div>

                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  The model can choose between different application
                  capabilities.
                </p>
              </ConceptCard>

              <ConceptCard title="2 · Multiple calls in one response">
                <div className="space-y-2 font-mono text-sm">
                  <p>function_call #1</p>
                  <p>function_call #2</p>
                </div>

                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  One model decision can request several actions before the next
                  model turn.
                </p>
              </ConceptCard>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Multiple tool types
            </p>

            <h3 className="mt-2 text-lg font-semibold">
              The model chooses what capability it needs
            </h3>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <Step>Model function_call</Step>
              <HorizontalArrow />
              <div className="grid gap-3">
                <Step>calculator</Step>
                <Step>format_number</Step>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              The model requests a tool by its model-facing name. Our
              application must explicitly dispatch that name to the correct
              TypeScript implementation.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ToolMapping
                modelName="calculator"
                implementation="calculator()"
              />
              <ToolMapping
                modelName="format_number"
                implementation="formatNumber()"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Dependent · sequential calls
            </p>

            <h3 className="mt-2 text-lg font-semibold">
              Later actions need earlier observations
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Consider the prompt we tested:
            </p>

            <div className="mt-4 rounded-xl border border-border bg-background p-4 font-mono text-sm leading-6">
              Use the calculator tool to multiply 27 by 43. Then multiply that
              result by 10. Finally, use the format_number tool to format that
              result.
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Iteration
                label="Model #1"
                action="calculator(27, 43)"
                result="1161"
              />
              <Iteration
                label="Model #2"
                action="calculator(1161, 10)"
                result="11610"
              />
              <Iteration
                label="Model #3"
                action="format_number(11610)"
                result='"11,610"'
              />
              <Iteration
                label="Model #4"
                action="No tool request"
                result='Final: "11,610"'
              />
            </div>

            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <p className="font-medium">Why multiple model turns?</p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Model #2 cannot request <Code>calculator(1161, 10)</Code> until
                it has observed <Code>1161</Code>. Model #3 cannot request{" "}
                <Code>format_number(11610)</Code> until it has observed{" "}
                <Code>11610</Code>.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Independent calls
            </p>

            <h3 className="mt-2 text-lg font-semibold">
              One response can request more than one action
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Now compare the independent-calculations prompt:
            </p>

            <div className="mt-4 rounded-xl border border-border bg-background p-4 font-mono text-sm leading-6">
              Use the calculator tool to do two independent calculations: (1)
              multiply 27 by 43, and (2) multiply 15 by 20. Give me both
              results.
            </div>

            <div className="mt-5">
              <div className="mx-auto max-w-sm">
                <Step>One Model Response</Step>
              </div>

              <Arrow />

              <div className="grid gap-3 sm:grid-cols-2">
                <CallCard
                  callId="call_A"
                  action="calculator(27, 43)"
                  result="1161"
                />
                <CallCard
                  callId="call_B"
                  action="calculator(15, 20)"
                  result="300"
                />
              </div>

              <Arrow />

              <div className="mx-auto max-w-sm">
                <Step>Return both observations → Model again</Step>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Neither calculation depends on the other, so the model already
              knows all the arguments and can request both actions in the same
              response.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              The key code evolution
            </p>

            <h3 className="mt-2 text-lg font-semibold">
              .find() becomes .filter()
            </h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ConceptCard title="002-004 · singular">
                <pre className="overflow-x-auto text-sm leading-6">
                  <code>{`const toolCall =
  response.output.find(
    (item) =>
      item.type === "function_call",
  );`}</code>
                </pre>

                <div className="mt-4 font-mono text-sm leading-6 text-muted-foreground">
                  <p>response.output</p>
                  <p>↓</p>
                  <p>.find()</p>
                  <p>↓</p>
                  <p>toolCall</p>
                </div>
              </ConceptCard>

              <ConceptCard title="002-005 · plural">
                <pre className="overflow-x-auto text-sm leading-6">
                  <code>{`const toolCalls =
  response.output.filter(
    (item) =>
      item.type === "function_call",
  );`}</code>
                </pre>

                <div className="mt-4 font-mono text-sm leading-6 text-muted-foreground">
                  <p>response.output</p>
                  <p>↓</p>
                  <p>.filter()</p>
                  <p>↓</p>
                  <p>toolCalls[]</p>
                </div>
              </ConceptCard>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              We still search <Code>response.output</Code> by type because the
              array is heterogeneous. The difference is that we now preserve{" "}
              <strong className="font-medium text-foreground">every</strong>{" "}
              matching function call instead of stopping after the first one.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Why .find() failed
            </p>

            <h3 className="mt-2 text-lg font-semibold">
              Every requested call needs an observation
            </h3>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Model requested
                </p>

                <div className="mt-4 space-y-3 font-mono text-sm">
                  <p>call_A → calculator(27, 43)</p>
                  <p>call_B → calculator(15, 20)</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Old application returned
                </p>

                <div className="mt-4 space-y-3 font-mono text-sm">
                  <p>call_A → output 1161 ✓</p>
                  <p>call_B → nothing ✗</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-background p-4">
              <p className="font-mono text-sm">
                400 No tool output found for function call ...
              </p>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              This was not a theoretical concern. We reproduced this failure
              during development. The model had requested two calls, but{" "}
              <Code>.find()</Code> caused our application to execute and answer
              only the first.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Tool outputs · plural
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <Step>toolCalls[]</Step>
              <HorizontalArrow />
              <Step>.map()</Step>
              <HorizontalArrow />
              <Step>toolOutputs[]</Step>
            </div>

            <pre className="mt-5 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`const toolOutputs = toolCalls.map((toolCall) => {
  // dispatch and execute the requested tool

  return {
    type: "function_call_output",
    call_id: toolCall.call_id,
    output: String(result),
  };
});`}</code>
            </pre>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Each requested action becomes exactly one corresponding{" "}
              <Code>function_call_output</Code>. We then send the complete{" "}
              <Code>toolOutputs</Code> array back to the model.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Correlation
              </p>

              <h3 className="mt-2 font-semibold">
                call_id matters even more now
              </h3>

              <div className="mt-4 space-y-3 font-mono text-sm">
                <div className="rounded-xl border border-border bg-background p-4">
                  call_A → output_A
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  call_B → output_B
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Every output preserves the <Code>call_id</Code> of the exact
                function request that produced it.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Continue the loop
              </p>

              <h3 className="mt-2 font-semibold">
                Send all observations together
              </h3>

              <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
                <code>{`response =
  await openai.responses.create({
    model: "gpt-5.6-luna",
    previous_response_id: response.id,
    input: toolOutputs,
    tools: [
      calculatorTool,
      formatNumberTool,
    ],
  });`}</code>
              </pre>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Notice the evolution from <Code>input: [toolOutput]</Code> to{" "}
                <Code>input: toolOutputs</Code>.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              A debugging lesson
            </p>

            <h3 className="mt-2 text-lg font-semibold">
              Correct-looking final answer ≠ correct pipeline
            </h3>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <Step>format_number(11610)</Step>
              <HorizontalArrow />
              <Step>wrong dispatch → undefined</Step>
              <HorizontalArrow />
              <Step>Model still said “11,610”</Step>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              We actually observed this while building the lesson. Before tool
              dispatch was fixed, <Code>format_number</Code> was accidentally
              treated as a calculator call. The application produced{" "}
              <Code>undefined</Code>, yet the model recovered and returned the
              expected-looking answer.
            </p>

            <div className="mt-4 rounded-xl border border-border bg-background p-4">
              <p className="font-medium">
                Do not validate an agent only by reading its final answer.
              </p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                During development, inspect the requested tool, arguments,
                application result, observation, and next model decision.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Why while AND .map()?
            </p>

            <h3 className="mt-2 text-lg font-semibold">
              They solve two different dimensions of the agent loop
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Both <Code>while (true)</Code> and <Code>toolCalls.map(...)</Code>{" "}
              repeat work, but they repeat at different levels.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ConceptCard title="while (true) · depth">
                <p className="text-sm leading-6 text-muted-foreground">
                  Keeps the agent moving across{" "}
                  <strong className="font-medium text-foreground">
                    multiple model turns
                  </strong>
                  .
                </p>

                <div className="mt-4 space-y-2 font-mono text-sm">
                  <div className="rounded-lg border border-border bg-card/40 px-3 py-2">
                    Model #1
                  </div>

                  <div className="text-center text-muted-foreground">↓</div>

                  <div className="rounded-lg border border-border bg-card/40 px-3 py-2">
                    Model #2
                  </div>

                  <div className="text-center text-muted-foreground">↓</div>

                  <div className="rounded-lg border border-border bg-card/40 px-3 py-2">
                    Model #3
                  </div>

                  <div className="text-center text-muted-foreground">↓</div>

                  <div className="rounded-lg border border-border bg-card/40 px-3 py-2">
                    Model #4
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Think:
                </p>

                <p className="mt-2 font-mono text-sm">
                  Does the agent need another model turn?
                </p>
              </ConceptCard>

              <ConceptCard title="toolCalls.map(...) · breadth">
                <p className="text-sm leading-6 text-muted-foreground">
                  Handles{" "}
                  <strong className="font-medium text-foreground">
                    every tool call inside one model response
                  </strong>
                  .
                </p>

                <div className="mt-4 font-mono text-sm">
                  <div className="rounded-lg border border-border bg-card/40 px-3 py-2 text-center">
                    Model #1
                  </div>

                  <div className="my-2 text-center text-muted-foreground">
                    ↓
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border bg-card/40 px-3 py-2 text-center">
                      call_A
                    </div>

                    <div className="rounded-lg border border-border bg-card/40 px-3 py-2 text-center">
                      call_B
                    </div>
                  </div>

                  <div className="my-2 grid grid-cols-2 gap-2 text-center text-muted-foreground">
                    <div>↓</div>
                    <div>↓</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border bg-card/40 px-3 py-2 text-center">
                      output_A
                    </div>

                    <div className="rounded-lg border border-border bg-card/40 px-3 py-2 text-center">
                      output_B
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Think:
                </p>

                <p className="mt-2 font-mono text-sm">
                  What do we do with all calls in this turn?
                </p>
              </ConceptCard>
            </div>

            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <p className="font-medium">
                Why can&apos;t one replace the other?
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="font-mono text-sm">Why not only while?</p>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Because one model response may already contain several tool
                    calls. Every requested call needs its own output before we
                    continue to the next model turn.
                  </p>
                </div>

                <div>
                  <p className="font-mono text-sm">Why not only .map()?</p>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Because <Code>.map()</Code> can process only calls that
                    already exist. It cannot ask the model to observe the
                    results and make its next decision.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Example · both dimensions together
              </p>

              <div className="mt-4 space-y-3">
                <Step>while iteration #1 · Model #1</Step>

                <Arrow />

                <div className="grid gap-3 sm:grid-cols-2">
                  <CallCard
                    callId="call_A"
                    action="calculator(27, 43)"
                    result="1161"
                  />

                  <CallCard
                    callId="call_B"
                    action="calculator(15, 20)"
                    result="300"
                  />
                </div>

                <Arrow />

                <Step>toolOutputs[] → Model again</Step>

                <Arrow />

                <Step>while iteration #2 · Model #2</Step>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Depth
                </p>

                <p className="mt-2 font-semibold">while (true)</p>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Model → observation → Model → observation → Model...
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Breadth
                </p>

                <p className="mt-2 font-semibold">toolCalls.map(...)</p>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  call_A + call_B + ... → output_A + output_B + ...
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-border bg-background p-4 text-center">
              <p className="font-mono font-medium">
                while = DEPTH · map = BREADTH
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Multiple calls ≠ parallel JavaScript
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ConceptCard title="What we are teaching">
                <p className="font-mono text-sm leading-6">
                  one model response
                  <br />↓<br />
                  multiple function_call items
                </p>
              </ConceptCard>

              <ConceptCard title="What we are not teaching">
                <p className="font-mono text-sm leading-6">
                  Promise.all(...)
                  <br />
                  async concurrency
                  <br />
                  parallel JavaScript
                </p>
              </ConceptCard>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Our calculator and formatter are synchronous.{" "}
              <Code>toolCalls.map(...)</Code> simply ensures that every
              requested call is handled before observations are returned.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              The 002-005 loop
            </p>

            <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`while (true) {
  const toolCalls = response.output.filter(
    (item) => item.type === "function_call",
  );

  if (toolCalls.length === 0) {
    return finalAnswer;
  }

  const toolOutputs = toolCalls.map((toolCall) => {
    // dispatch by toolCall.name
    // execute calculator() or formatNumber()

    return {
      type: "function_call_output",
      call_id: toolCall.call_id,
      output: String(result),
    };
  });

  response = await openai.responses.create({
    previous_response_id: response.id,
    input: toolOutputs,
    tools: [calculatorTool, formatNumberTool],
  });
}`}</code>
            </pre>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <Step>filter → toolCalls[]</Step>
              <HorizontalArrow />
              <Step>map → toolOutputs[]</Step>
              <HorizontalArrow />
              <Step>Model again ↻</Step>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Zero · one · many
            </p>

            <h3 className="mt-2 text-lg font-semibold">
              One architecture handles all three cases
            </h3>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <CountCard
                count="0"
                label="No tool calls"
                detail="Return the final answer."
              />
              <CountCard
                count="1"
                label="One tool call"
                detail="Map one call to one output."
              />
              <CountCard
                count="2+"
                label="Multiple calls"
                detail="Map every call to its output."
              />
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              This is why the plural design is useful even for simple cases. A
              single function call is just an array containing one item.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Current boundary
            </p>

            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <p className="font-medium">
                Multiple capabilities. Multiple requested actions. Same agent
                loop.
              </p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                We have expanded the agent loop without introducing the safety
                guard or Agent UI that belong to later lessons.
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <BoundaryItem>✓ calculator + format_number</BoundaryItem>
              <BoundaryItem>✓ Dispatch by toolCall.name</BoundaryItem>
              <BoundaryItem>✓ Dependent calls across turns</BoundaryItem>
              <BoundaryItem>✓ Independent calls in one response</BoundaryItem>
              <BoundaryItem>✓ .filter() → toolCalls[]</BoundaryItem>
              <BoundaryItem>✓ .map() → toolOutputs[]</BoundaryItem>
              <BoundaryItem>✓ call_id correlation</BoundaryItem>
              <BoundaryItem>✗ Maximum-iteration safety guard</BoundaryItem>
              <BoundaryItem>✗ Runtime schema validation</BoundaryItem>
              <BoundaryItem>✗ Agent UI</BoundaryItem>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Next
            </p>

            <h3 className="mt-2 font-semibold">002-006 · Safety Guard</h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Our agent can now execute increasingly rich sequences of actions,
              but <Code>while (true)</Code> still has no maximum-step boundary.
              The next lesson makes that loop safer by limiting how long an
              agent may continue requesting actions.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <Step>Agent loop</Step>
              <HorizontalArrow />
              <Step>Maximum iterations</Step>
              <HorizontalArrow />
              <Step>Bounded execution</Step>
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

function ToolMapping({
  modelName,
  implementation,
}: {
  modelName: string;
  implementation: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Model → Application
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-sm">
        <span>{modelName}</span>
        <span className="text-muted-foreground">→</span>
        <span>{implementation}</span>
      </div>
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

function CallCard({
  callId,
  action,
  result,
}: {
  callId: string;
  action: string;
  result: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {callId}
      </p>

      <p className="mt-3 font-mono text-sm">{action}</p>

      <div className="my-3 text-center font-mono text-muted-foreground">↓</div>

      <p className="font-mono text-sm">function_call_output: {result}</p>
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
