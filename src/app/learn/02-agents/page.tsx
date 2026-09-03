import { CourseLayout } from "@/components/learn/course-layout";
import { courseSections } from "@/lib/course";

/**
 * Lesson 002-001 — What is an Agent?
 *
 * PAST — Section 001: LLMs
 * --------------------------------
 * Section 001 built the complete LLM foundation:
 *
 *   Prompt
 *      ↓
 *   Model
 *      ↓
 *   Streamed Answer
 *
 * The application asks the model for text and displays the result.
 *
 *
 * NOW — 002-001: What is an Agent?
 * --------------------------------
 * We introduce the mental model behind an AI agent:
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
 * This lesson is conceptual. We are NOT implementing OpenAI tool
 * calling yet.
 *
 *
 * COURSE ARCHITECTURE EVOLUTION
 * --------------------------------
 * Section 02 now graduates from <CourseSectionPlaceholder /> and owns
 * its real content inside <CourseLayout />.
 *
 * Sections 03–07 remain on the generic placeholder until their
 * respective sections begin.
 *
 *
 * NEXT — 002-002 Function/Tool Calling
 * --------------------------------
 * The next lesson will give the model a mechanism for requesting
 * actions through tool/function calling.
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

        <section className="max-w-3xl space-y-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Lesson 002-001
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              What is an Agent?
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
              An LLM produces a response. An agent uses an LLM inside a larger
              system that can decide what to do next, take actions, observe the
              results, and continue working toward a goal.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                LLM
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <Step>Prompt</Step>
                <Arrow />
                <Step>Model</Step>
                <Arrow />
                <Step>Answer</Step>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Agent
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <Step>Goal</Step>
                <Arrow />
                <Step>Model</Step>
                <Arrow />
                <Step>Decision</Step>
                <Arrow />
                <Step>Action</Step>
                <Arrow />
                <Step>Observation</Step>

                <p className="pt-2 text-center font-mono text-xs text-muted-foreground">
                  ↳ continue until the goal is complete
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <h3 className="font-semibold">The important difference</h3>

            <p className="mt-2 leading-7 text-muted-foreground">
              The model is still the reasoning engine, but the surrounding
              application gives it a way to choose actions, receive
              observations, and decide what should happen next.
            </p>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              We are only establishing this mental model in 002-001. Tool
              calling begins in 002-002.
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
