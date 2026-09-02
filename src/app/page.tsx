import Link from "next/link";

import { CourseLayout } from "@/components/learn/course-layout";
import { courseSections } from "@/lib/course";

export default function Home() {
  return (
    <CourseLayout>
      <div className="space-y-12">
        <header className="space-y-4">
          <p className="font-mono text-sm text-muted-foreground">
            Open-source course by Thunkx
          </p>

          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Learn AI Agents
            </h1>

            <p className="text-xl text-muted-foreground">Learn by building.</p>
          </div>

          <p className="max-w-2xl leading-7 text-muted-foreground">
            Learn modern AI-agent engineering step by step, from language models
            and tool calling to RAG, LangGraph, MCP, production applications,
            and evaluation.
          </p>
        </header>

        <section aria-labelledby="course-sections">
          <div className="mb-6 space-y-1">
            <h2
              id="course-sections"
              className="text-2xl font-semibold tracking-tight"
            >
              Course
            </h2>

            <p className="text-sm text-muted-foreground">
              Seven sections. Build one concept at a time.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {courseSections.map((section) => (
              <Link
                key={section.number}
                href={section.href}
                className="group flex items-center gap-4 rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
              >
                <span className="font-mono text-sm text-muted-foreground">
                  {section.number}
                </span>

                <span className="font-medium group-hover:text-accent-foreground">
                  {section.title}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </CourseLayout>
  );
}
