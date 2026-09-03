import { CourseLayout } from "@/components/learn/course-layout";

/**
 * Temporary course-section scaffolding.
 *
 * PAST — 001-001 Project Setup
 * --------------------------------
 * At the beginning of the course, every unfinished section used this
 * component:
 *
 *   01 LLMs
 *   02 Agents
 *   03 RAG
 *   04 LangGraph
 *   05 MCP
 *   06 Build
 *   07 Eval
 *
 * This gave every section a consistent layout before its real lesson
 * content existed.
 *
 *
 * NOW — 001-006 Simple LLM Chat UI
 * --------------------------------
 * Section 01 has graduated from this placeholder.
 *
 *   01 LLMs
 *      ↓
 *   CourseLayout
 *      ↓
 *   real LLM content
 *      ↓
 *   LlmChat
 *
 * The unfinished sections still use this component:
 *
 *   02 Agents
 *   03 RAG
 *   04 LangGraph
 *   05 MCP
 *   06 Build
 *   07 Eval
 *
 *
 * NEXT
 * --------------------------------
 * As each course section gains real content, its page should graduate
 * from <CourseSectionPlaceholder /> and compose its own content inside
 * <CourseLayout />.
 *
 * Eventually, when no sections use this component anymore, it can be
 * deleted as dead code.
 *
 * Do NOT put section-specific features such as <LlmChat /> inside this
 * generic placeholder.
 */

type CourseSectionPlaceholderProps = {
  number: string;
  title: string;
  description: string;
};

export function CourseSectionPlaceholder({
  number,
  title,
  description,
}: CourseSectionPlaceholderProps) {
  return (
    <CourseLayout>
      <div className="space-y-10">
        <header className="space-y-4">
          <p className="font-mono text-sm text-muted-foreground">
            Section {number}
          </p>

          <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            {description}
          </p>
        </header>

        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-sm leading-7 text-muted-foreground">
          This section will be built incrementally as the course progresses.
        </div>
      </div>
    </CourseLayout>
  );
}
