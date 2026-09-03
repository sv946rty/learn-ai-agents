import { CourseLayout } from "@/components/learn/course-layout";
import { LlmChat } from "@/components/llm/llm-chat";
import { courseSections } from "@/lib/course";

/**
 * Lesson 001-006 — Simple LLM Chat UI
 *
 * PAST — 001-001 Project Setup
 * --------------------------------
 * The LLM section originally used <CourseSectionPlaceholder /> while
 * the section did not yet have real lesson content.
 *
 * <CourseSectionPlaceholder /> provided:
 *
 *   CourseLayout
 *      ↓
 *   section heading
 *      ↓
 *   temporary placeholder content
 *
 *
 * NOW — 001-006 Simple LLM Chat UI
 * --------------------------------
 * Section 01 now graduates from the generic placeholder and owns its
 * real content inside <CourseLayout>.
 *
 *   LLMsPage
 *   Server Component
 *        ↓
 *   CourseLayout
 *        ├── section heading
 *        └── LlmChat
 *            Client Component
 *
 * <LlmChat /> owns the browser-side interactive behavior:
 *
 *   useState()
 *   event handlers
 *   fetch()
 *   response.body.getReader()
 *   TextDecoder
 *   progressive React state updates
 *
 *
 * SERVER / CLIENT COMPONENT BOUNDARY
 * --------------------------------
 *
 * This page remains a Server Component.
 *
 * We do NOT add:
 *
 *   "use client"
 *
 * to this file.
 *
 * Only the interactive <LlmChat /> subtree needs to cross the
 * Client Component boundary.
 *
 *   LLMsPage
 *   Server Component
 *        │
 *        ▼
 *   CourseLayout
 *   Server Component
 *        │
 *        ├── Section 01
 *        ├── LLMs
 *        ├── description
 *        │
 *        └── LlmChat
 *            Client Component
 *                 │
 *                 ├── useState()
 *                 ├── onChange
 *                 ├── onClick
 *                 ├── onSubmit
 *                 ├── fetch()
 *                 ├── stream reader
 *                 └── progressive rendering
 *
 *
 * COURSE ARCHITECTURE EVOLUTION
 * --------------------------------
 * <CourseSectionPlaceholder /> is NOT deleted.
 *
 * Section 01 no longer needs it because the LLM section now has real
 * content.
 *
 * The unfinished sections still use the placeholder:
 *
 *   02 Agents
 *   03 RAG
 *   04 LangGraph
 *   05 MCP
 *   06 Build
 *   07 Eval
 *
 * As future sections gain real content, they can graduate from the
 * placeholder in the same way.
 *
 *
 * LAYOUT
 * --------------------------------
 * Keep the section heading compact so the interactive playground and
 * streamed model response remain visible within a normal desktop
 * viewport as much as possible.
 *
 * The streaming response is the main teaching focus of this lesson,
 * so we intentionally reserve more vertical space for it.
 */

export default function LLMsPage() {
  const section = courseSections[0];

  return (
    <CourseLayout>
      <div className="space-y-5">
        <header className="space-y-2">
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

        <LlmChat />
      </div>
    </CourseLayout>
  );
}
