# 001-001 — Project Setup

## Goal

Build the application foundation for **Learn AI Agents**.

This lesson does not connect to an AI model yet. Instead, we establish the Next.js application, course structure, visual system, responsive navigation, and repository conventions that later lessons will build upon.

By the end of this lesson, the project has a working course dashboard with seven section routes and a reusable responsive course shell.

---

## What You Will Learn

In this lesson, you will learn how the project uses:

- Next.js 16 and the App Router
- React and TypeScript
- Tailwind CSS 4
- shadcn/ui with Base UI
- Server Components by default
- a small Client Component boundary for interactive navigation
- shared course data
- reusable layouts
- responsive desktop and mobile navigation
- Cache Components as part of the Next.js foundation

You will also see an important principle that applies throughout this course:

> Build the foundation you need now, but do not implement future lessons early.

---

## What You Will Build

The application begins with a course dashboard:

```text
/
```

and seven major course routes:

```text
/learn/01-llms
/learn/02-agents
/learn/03-rag
/learn/04-langgraph
/learn/05-mcp
/learn/06-build
/learn/07-eval
```

These routes establish the course architecture.

They do **not** mean those systems have already been implemented.

For example:

```text
/learn/02-agents
```

exists, but we have not built an agent yet.

Likewise:

```text
/learn/03-rag
```

exists, but no RAG system exists yet.

Those concepts belong to later lessons.

---

## Before You Begin

Install the project dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Then open:

```text
http://localhost:3000
```

---

# 1. Project Structure

The important parts of the application currently look like this:

```text
learn-ai-agents/
├── resources/
│   ├── infographics/
│   │   ├── 000.overview.course.png
│   │   └── 001-llms/
│   │       └── 001-001-project-setup.png
│   └── lessons/
│       └── 001-llms/
│           └── 001-001-project-setup.md
├── src/
│   ├── app/
│   │   ├── learn/
│   │   │   ├── 01-llms/
│   │   │   ├── 02-agents/
│   │   │   ├── 03-rag/
│   │   │   ├── 04-langgraph/
│   │   │   ├── 05-mcp/
│   │   │   ├── 06-build/
│   │   │   └── 07-eval/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── learn/
│   │   │   ├── course-layout.tsx
│   │   │   ├── course-mobile-nav.tsx
│   │   │   ├── course-section-placeholder.tsx
│   │   │   └── course-sidebar.tsx
│   │   └── ui/
│   │       └── button.tsx
│   └── lib/
│       ├── course.ts
│       ├── fonts.ts
│       └── utils.ts
├── AGENTS.md
├── components.json
├── next.config.ts
├── package.json
└── README.md
```

The Git repository root is also the Next.js application root.

There is no second nested application directory.

---

# 2. Next.js Configuration

## File to Review

Open:

```text
next.config.ts
```

Find the `nextConfig` object.

The project enables:

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
};
```

`cacheComponents` establishes the modern caching and rendering foundation that we can use as the application grows.

We are enabling the capability now because it is part of the application architecture.

We are **not teaching caching behavior yet**.

Likewise, enabling caching does not mean future OpenAI requests or agent executions should automatically be cached.

Those decisions belong to the runtime behavior of later lessons.

The React Compiler is also enabled as part of the React application foundation.

---

# 3. Root Layout

## File to Review

Open:

```text
src/app/layout.tsx
```

This is the root layout for the application.

Find:

```tsx
<html
  lang="en"
  className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
>
```

The `dark` class establishes the default dark visual foundation for the course.

The font variables come from:

```text
src/lib/fonts.ts
```

The body then provides the minimum page structure:

```tsx
<body className="min-h-full flex flex-col">{children}</body>
```

The root layout should remain concerned with application-wide concerns such as metadata, fonts, global styles, and document structure.

Course-specific navigation belongs elsewhere.

---

# 4. Fonts

## File to Review

Open:

```text
src/lib/fonts.ts
```

The project configures:

```text
Geist
Geist Mono
```

through `next/font`.

The fonts are exposed as CSS variables:

```text
--font-geist-sans
--font-geist-mono
```

and connected to the Tailwind theme in:

```text
src/app/globals.css
```

Centralizing font configuration prevents individual pages from configuring the same fonts repeatedly.

---

# 5. shadcn/ui and the Design Foundation

The project initializes shadcn/ui using Base UI.

Important generated foundation files include:

```text
components.json
src/lib/utils.ts
src/components/ui/button.tsx
```

We intentionally do **not** install every shadcn component.

Components should enter the repository when the application actually needs them.

The global theme uses semantic utilities such as:

```text
bg-background
text-foreground
text-muted-foreground
border-border
bg-card
bg-accent
```

This is preferable to scattering hard-coded colors throughout the course interface.

---

# 6. Shared Course Data

## File to Review

Open:

```text
src/lib/course.ts
```

Find:

```ts
export const courseSections = [
  // ...
] as const;
```

This array defines the seven major course sections.

Each entry contains information such as:

```text
number
title
href
description
```

The same data can then drive multiple parts of the interface:

```text
courseSections
      │
      ├── Course Dashboard
      ├── Desktop Sidebar
      ├── Mobile Navigation
      └── Section Pages
```

Without this shared data, we could easily end up maintaining several separate copies of the course navigation.

For example, changing a section title would require updating the dashboard, desktop navigation, and mobile navigation independently.

Centralizing the roadmap prevents that duplication.

---

# 7. The Shared Course Layout

## File to Review

Open:

```text
src/components/learn/course-layout.tsx
```

The layout establishes the reusable course shell.

Conceptually:

```text
CourseLayout
│
├── CourseMobileNav
│
└── Main layout
    │
    ├── CourseSidebar
    │
    └── Page content
```

Pages provide their lesson or section content as `children`.

The layout handles the common structure around that content.

This prevents every page from rebuilding navigation, width constraints, spacing, and responsive behavior.

---

# 8. Server Components by Default

One of the important architectural decisions in this project is to keep Server Components as the default.

Consider:

```text
src/components/learn/course-sidebar.tsx
```

The sidebar renders course navigation links.

It does not require:

```tsx
"use client";
```

because it does not own browser-side state.

That means there is no reason to turn it into a Client Component.

The same principle applies throughout the course:

> Add a client boundary because browser interaction requires it, not simply because a component is part of the UI.

---

# 9. Mobile Navigation and the Client Boundary

## File to Review

Open:

```text
src/components/learn/course-mobile-nav.tsx
```

Unlike the desktop sidebar, the mobile navigation needs interactive state.

At the top of the file you will find:

```tsx
"use client";
```

and inside the component:

```tsx
const [isOpen, setIsOpen] = useState(false);
```

The browser needs to remember whether the menu is open or closed.

That interaction requires a Client Component.

The important architectural point is what we **didn't** do.

We did not turn the entire `CourseLayout` into a Client Component.

Instead:

```text
CourseLayout
    │
    ├── CourseSidebar
    │       Server Component
    │
    └── CourseMobileNav
            Client Component
```

The client boundary stays close to the interaction that requires it.

---

# 10. Closing the Mobile Menu

Inside the mobile navigation, each course link closes the menu when selected:

```tsx
onClick={() => setIsOpen(false)}
```

Without this behavior, navigating to another course section could leave the expanded mobile navigation visible after the route changes.

The menu button also exposes its state through:

```tsx
aria-expanded={isOpen}
```

and connects itself to the navigation region with:

```tsx
aria-controls="mobile-course-navigation"
```

These attributes help assistive technologies understand the relationship between the button and the expandable navigation.

---

# 11. Mobile Menu Transition

The mobile navigation should not abruptly appear and disappear.

Its container transitions between a collapsed and expanded grid row.

Conceptually:

```text
closed
grid-template-rows: 0fr
        ↓
transition
        ↓
open
grid-template-rows: 1fr
```

The inner container uses overflow clipping so the navigation smoothly expands and collapses.

This gives us a transition without introducing an animation dependency.

It also avoids calculating the menu's pixel height in JavaScript.

---

# 12. Desktop and Mobile Navigation

The two navigation components are complementary.

On larger screens:

```text
CourseSidebar      visible
CourseMobileNav    hidden
```

On smaller screens:

```text
CourseSidebar      hidden
CourseMobileNav    visible
```

This is more usable than placing the entire seven-item desktop sidebar above the page content on a phone.

Responsive design is not simply about making elements fit on a smaller screen.

Sometimes the interaction itself should change.

---

# 13. Course Section Pages

The seven major routes are established under:

```text
src/app/learn/
```

For example:

```text
src/app/learn/01-llms/page.tsx
```

maps to:

```text
/learn/01-llms
```

The current section pages reuse:

```text
src/components/learn/course-section-placeholder.tsx
```

This gives the course a complete navigation structure without implementing future curriculum early.

That distinction is important:

```text
Route exists
    ≠
Feature is implemented
```

The Agents page existing does not mean we have implemented agents.

The RAG page existing does not mean we have implemented RAG.

We are building the **course shell**, not skipping ahead in the curriculum.

---

# 14. Course Dashboard

## File to Review

Open:

```text
src/app/page.tsx
```

This is the canonical entry point:

```text
/
```

The dashboard introduces Learn AI Agents and renders links to the seven course sections using the same shared `courseSections` data used by navigation.

This gives learners one predictable place to enter the course.

---

# 15. Environment and Secret Safety

The repository's `.gitignore` includes:

```text
.env*
```

Environment files therefore remain outside Git by default.

We do not create an OpenAI API key during this lesson because we do not need one yet.

That belongs to:

```text
001-002 — Connect OpenAI
```

When credentials enter the project, they must remain server-side and outside version control.

---

# 16. What We Deliberately Did Not Build

At the end of `001-001`, there is still no AI runtime functionality.

We have not added:

```text
OpenAI SDK
API key configuration
model calls
Responses API usage
streaming
chat behavior
tool calling
agent loops
RAG
LangGraph
MCP
evaluation
```

This is intentional.

A good incremental course does not merely ask:

> What could we build now?

It also asks:

> Which lesson should teach this concept?

For this lesson, our responsibility is the application foundation.

---

# 17. Run the Application

Start the development server:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

Verify the dashboard loads.

Then visit several course sections, for example:

```text
http://localhost:3000/learn/01-llms
http://localhost:3000/learn/02-agents
```

On desktop, verify the sidebar navigation works.

Using a narrow browser viewport, verify:

- the desktop sidebar disappears;
- the mobile navigation appears;
- Menu opens the navigation;
- Close collapses it;
- selecting a section closes the menu;
- the expansion/collapse transition is smooth;
- the selected route loads correctly.

---

# 18. Verify the Project

Run:

```bash
pnpm lint
```

The project should complete without ESLint errors.

Then run:

```bash
pnpm build
```

At this checkpoint, the production build should successfully compile the application and generate the course routes.

The current course pages can be prerendered as static content because they do not yet depend on dynamic AI runtime behavior.

---

# Exercise

Open:

```text
src/lib/course.ts
```

Choose one section description and temporarily change its wording.

Reload the dashboard and the corresponding section page.

Observe where the shared data appears.

Then restore the original description.

The goal is to understand why the course roadmap is centralized rather than duplicated across components.

---

# Common Misunderstandings

## "Why create routes for Agents and RAG before building them?"

We are establishing durable navigation, not implementing those concepts.

Creating:

```text
/learn/03-rag
```

does not require us to build retrieval in `001-001`.

---

## "Why isn't CourseLayout a Client Component?"

The layout itself does not need browser state.

Only the mobile navigation needs interactive state, so the client boundary stays there.

---

## "Does cacheComponents mean our future OpenAI calls are cached?"

No.

Enabling the Next.js caching foundation does not mean every operation should be cached.

AI runtime behavior must be considered separately.

---

## "Why don't we install the OpenAI SDK now?"

Because installation and the first OpenAI connection are part of the concept taught by `001-002`.

Adding it during `001-001` would weaken the lesson boundary.

---

# What You Learned

You now have the application foundation for Learn AI Agents.

You should be able to explain:

- how App Router maps files to course routes;
- why course metadata lives in `src/lib/course.ts`;
- what `CourseLayout` is responsible for;
- why `CourseSidebar` can remain a Server Component;
- why `CourseMobileNav` needs a Client Component boundary;
- how desktop and mobile navigation differ;
- why future AI dependencies are deliberately absent;
- how lint and production builds verify the foundation.

The important architecture is:

```text
Learn AI Agents
      │
      ├── Next.js App Router
      │
      ├── Shared Course Data
      │
      ├── CourseLayout
      │   ├── Desktop Sidebar
      │   └── Mobile Navigation
      │
      ├── Seven Course Sections
      │
      └── Lesson Resources
          ├── Tutorial
          └── Infographic
```

---

# Infographic

The visual companion for this lesson is:

```text
resources/infographics/001-llms/001-001-project-setup.png
```

It summarizes the foundation established in this checkpoint.

---

# Next Lesson

## 001-002 — Connect OpenAI

Now that the application foundation is in place, the next lesson introduces the first AI-specific dependency.

We will add the OpenAI SDK, configure the API key securely on the server, create an OpenAI client, and make the application's first connection to OpenAI.
