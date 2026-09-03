import { CourseLayout } from "@/components/learn/course-layout";
import { courseSections } from "@/lib/course";

/**
 * Lesson 002-002 — Function/Tool Calling
 *
 * PAST — 002-001: What is an Agent?
 * --------------------------------
 * We introduced the mental model:
 *
 *   Goal
 *      ↓
 *   Model
 *      ↓
 *   Decision
 *      ↓
 *   Action
 *      ↓
 *   Observation
 *      ↓
 *   Model
 *      ↓
 *   ...
 *      ↓
 *   Final Answer
 *
 * But the model still had no structured mechanism for telling our
 * application which action it wanted to perform.
 *
 *
 * NOW — 002-002: Function/Tool Calling
 * --------------------------------
 * We give the model a tool definition:
 *
 *   get_weather
 *
 * The model can now decide between:
 *
 *                     Model
 *                       ↓
 *                    Decision
 *                  ┌────┴────┐
 *                  ↓         ↓
 *           function_call   message
 *                  ↓         ↓
 *          request action   answer directly
 *
 * A function_call is only a structured REQUEST.
 *
 * The application does NOT execute get_weather in this lesson.
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
 *       ↓
 *   ┌──────────────────┐
 *   │                  │
 *   ▼                  ▼
 * function_call      message
 *   │                  │
 *   ▼                  ▼
 * structured          normal
 * tool request        answer
 *
 *
 * NEXT — 002-003 Calculator Tool
 * --------------------------------
 * The next lesson will move one step further:
 *
 *   function_call
 *       ↓
 *   application reads arguments
 *       ↓
 *   application executes real code
 *       ↓
 *   tool result
 *
 * The complete repeating agent loop still belongs to 002-004.
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
              Lesson 002-002
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Function/Tool Calling
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
              Tool calling gives the model a structured way to request an action
              from our application. The model can decide to request an available
              tool or answer the user directly.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              From the previous lesson
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <Step>Goal</Step>
              <HorizontalArrow />
              <Step>Model</Step>
              <HorizontalArrow />
              <Step>Decision</Step>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              In 002-001, we learned that an agent needs to make decisions about
              what to do next. Now we are giving the model a structured way to
              communicate one of those decisions.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Tool available
              </p>

              <div className="mt-5 rounded-xl border border-border bg-background p-4 font-mono text-sm leading-6">
                <p>type: function</p>
                <p>name: get_weather</p>
                <p>argument: location</p>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                This definition describes a capability to the model. It does not
                implement or execute a weather lookup.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Model decision
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <Step>Model</Step>
                <Arrow />
                <Step>Decision</Step>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Step>function_call</Step>
                  <Step>message</Step>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center font-mono text-xs text-muted-foreground">
                  <span>request action</span>
                  <span>answer directly</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Example function call
            </p>

            <p className="mt-3 leading-7 text-muted-foreground">
              When we ask for the weather in San Jose, the model can return a
              structured request like this:
            </p>

            <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-background p-4 text-sm leading-6">
              <code>{`{
  "type": "function_call",
  "name": "get_weather",
  "arguments": "{\\"location\\":\\"San Jose, CA\\"}",
  "callId": "call_..."
}`}</code>
            </pre>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              The arguments are returned as a JSON string, and the call ID
              identifies this particular requested function call.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Current boundary
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <Step>Model</Step>
              <HorizontalArrow />
              <Step>function_call</Step>
              <HorizontalArrow />
              <Step>STOP</Step>
            </div>

            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <h3 className="font-semibold">Tool request ≠ tool execution</h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The model has requested get_weather, but our application has not
                executed any weather code. No temperature, forecast, or weather
                observation has been produced.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Next
            </p>

            <h3 className="mt-2 font-semibold">002-003 · Calculator Tool</h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Next we will let the application read a requested tool call and
              execute real deterministic code. The complete model → tool →
              observation → model loop still comes later in 002-004.
            </p>
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
      className="text-center font-mono text-muted-foreground"
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
