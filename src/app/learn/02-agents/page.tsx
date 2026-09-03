import { CourseLayout } from "@/components/learn/course-layout";
import { courseSections } from "@/lib/course";

/**
 * Lesson 002-003 — Calculator Tool
 *
 * PAST — 002-002: Function/Tool Calling
 * --------------------------------
 * The model learned how to request a structured action:
 *
 *   Model
 *      ↓
 *   function_call
 *      ↓
 *   STOP
 *
 * A function_call was only a REQUEST. The application did not execute
 * the teaching-only get_weather tool.
 *
 *
 * NOW — 002-003: Calculator Tool
 * --------------------------------
 * We replace the teaching-only tool with a real calculator.
 *
 *   Model
 *      ↓
 *   function_call
 *      ↓
 *   JSON.parse(arguments)
 *      ↓
 *   calculator(...)
 *      ↓
 *   result
 *      ↓
 *   STOP
 *
 * The model decides WHAT action to request.
 * The application executes HOW that action works.
 *
 * Tool definition and tool implementation are separate:
 *
 *   MODEL SIDE                  APPLICATION SIDE
 *
 *   name: calculator           calculator(...)
 *   operation                  switch(operation)
 *   a                          real arithmetic
 *   b
 *
 * The string "calculator" does not automatically execute our TypeScript
 * function. The Route Handler explicitly parses the requested arguments
 * and calls calculator().
 *
 *
 * CURRENT APPLICATION FLOW
 * --------------------------------
 *
 *   User Prompt
 *       ↓
 *   /api/agents
 *       ↓
 *   OpenAI Responses API
 *       ↓
 *   Model Decision
 *      ┌┴───────────────┐
 *      ↓                ↓
 * function_call       message
 *      ↓                ↓
 * JSON.parse()        normal answer
 *      ↓
 * calculator(...)
 *      ↓
 * real result
 *      ↓
 *     STOP
 *
 *
 * NEXT — 002-004 Agent Loop
 * --------------------------------
 * The next lesson sends the calculator result back to the model as an
 * observation so the model can decide what to do next.
 *
 *   Model
 *      ↓
 *   calculator()
 *      ↓
 *   result
 *      ↓
 *   Model again
 *
 * That repeating model → tool → observation → model flow is the agent loop.
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
              Lesson 002-003
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Calculator Tool
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
              A function call is only a request. Now our application will read
              the requested arguments, execute a real deterministic calculator,
              and return the result.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              From the previous lesson
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <Step>Model</Step>
              <HorizontalArrow />
              <Step>function_call</Step>
              <HorizontalArrow />
              <Step>STOP</Step>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              In 002-002, the model could request an action, but our application
              did not execute it. This lesson adds that missing execution step.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Model side · Tool definition
              </p>

              <div className="mt-5 rounded-xl border border-border bg-background p-4 font-mono text-sm leading-6">
                <p>type: function</p>
                <p>name: calculator</p>
                <p>operation: add | subtract | multiply | divide</p>
                <p>a: number</p>
                <p>b: number</p>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                This schema tells the model what capability exists and how to
                request it. It does not perform the arithmetic.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Application side · Tool implementation
              </p>

              <div className="mt-5 rounded-xl border border-border bg-background p-4 font-mono text-sm leading-6">
                <p>calculator(operation, a, b)</p>
                <p className="mt-2 text-muted-foreground">switch (operation)</p>
                <p>→ real JavaScript arithmetic</p>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                This is ordinary TypeScript running in our application. The
                Route Handler explicitly calls it after reading the model&apos;s
                request.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Example · Multiply 27 by 43
            </p>

            <p className="mt-3 leading-7 text-muted-foreground">
              The model requests the calculator with structured arguments:
            </p>

            <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`{
  "type": "function_call",
  "name": "calculator",
  "arguments": {
    "operation": "multiply",
    "a": 27,
    "b": 43
  },
  "result": 1161,
  "callId": "call_..."
}`}</code>
            </pre>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              The model requested the operation and numbers. The{" "}
              <span className="font-mono text-foreground">1161</span> result was
              produced by our TypeScript calculator, not by automatic tool
              execution inside OpenAI.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Request → execution
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <Step>function_call</Step>
              <HorizontalArrow />
              <Step>JSON.parse()</Step>
              <HorizontalArrow />
              <Step>calculator()</Step>
            </div>

            <Arrow />

            <div className="mx-auto max-w-xs">
              <Step>result: 1161</Step>
            </div>

            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <h3 className="font-semibold">
                Tool definition ≠ tool implementation
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Naming a tool{" "}
                <span className="font-mono text-foreground">
                  &quot;calculator&quot;
                </span>{" "}
                does not magically call a JavaScript function with the same
                name. Our application parses the arguments and explicitly calls{" "}
                <span className="font-mono text-foreground">
                  calculator(...)
                </span>
                .
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Current boundary
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

            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <h3 className="font-semibold">We still stop after execution</h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The calculator produced a real result, but we have not sent that
                result back to the model. The model cannot observe{" "}
                <span className="font-mono text-foreground">1161</span> and
                decide what to do next yet.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Next
            </p>

            <h3 className="mt-2 font-semibold">002-004 · Agent Loop</h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Next we will send the tool result back to the model as an
              observation. That lets the model decide again: use the calculator
              another time or produce the final answer.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <Step>result: 1161</Step>
              <HorizontalArrow />
              <Step>Model again</Step>
              <HorizontalArrow />
              <Step>next decision</Step>
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
