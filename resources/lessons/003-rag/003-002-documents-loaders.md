# 003-002 --- Documents & Loaders

**Section:** 003 --- RAG\
**Course:** Learn AI Agents\
**Publisher:** Thunkx\
**Tagline:** Learn by building.

------------------------------------------------------------------------

## Learning Goal

In 003-001, we learned **why RAG exists**:

``` text
Question
   ↓
Retrieve
   ↓
Augment
   ↓
Generate
```

RAG lets an application give an LLM relevant external knowledge at
request time without retraining the model.

Now we begin building that pipeline. The question for 003-002 is:

> **How does our RAG application get documents into a usable in-memory
> representation?**

By the end of this lesson, we load a real text file and convert it into
a consistent `Document` containing `content` and `metadata`.

``` text
Source → Loader → Document
```

------------------------------------------------------------------------

## PAST → NOW → NEXT

### PAST --- 003-001: RAG Overview

We learned that RAG supplies external knowledge to the model's context:

``` text
Private / external knowledge
            ↓
Retrieve → Augment → Generate
```

We also established:

``` text
Agents → give the model actions
RAG    → gives the model knowledge
```

In 003-001, the Thunkx Employee Handbook was a conceptual example.

### NOW --- 003-002: Documents & Loaders

We turn that example into a real project resource:

``` text
employee-handbook.txt
        ↓
loadTextFile()
        ↓
Document
  ├── content
  └── metadata
```

### NEXT --- 003-003: Chunking

Next we split the loaded document into smaller chunks. We do **not**
chunk anything in this lesson.

------------------------------------------------------------------------

## 1. Where Does RAG Knowledge Come From?

Before an application can retrieve knowledge, that knowledge must enter
the application.

Sources may include TXT, Markdown, PDF, and web content. Their raw
formats differ, so we need a boundary between source-specific input and
the rest of the RAG application:

``` text
SOURCE
   ↓
LOADER
   ↓
DOCUMENT
```

A **source** is where knowledge lives. A **loader** reads a source and
converts it into the representation our application expects. A
**Document** is that consistent application-level representation.

------------------------------------------------------------------------

## 2. Create Our First Real Knowledge Source

We add:

``` text
resources/documents/employee-handbook.txt
```

with:

``` text
Thunkx Employee Handbook

Vacation Policy

Employees receive 25 vacation days per year.

Remote Work Policy

Employees may work remotely up to 3 days per week with manager approval.
```

This is fictional course data.

The important progression is:

``` text
003-001
Hard-coded conceptual example

003-002
Real source file
      ↓
Real loader
      ↓
Document in memory
```

------------------------------------------------------------------------

## 3. Define a Standard Document Shape

Create:

``` text
src/lib/rag/document.ts
```

``` ts
/*
 * PAST — 003-001
 * We learned that RAG gives an LLM relevant external knowledge at request time.
 *
 * NOW — 003-002
 * A Document gives loaded source content a consistent shape inside our application.
 *
 * NEXT — 003-003
 * Loaded documents will be split into smaller chunks.
 */

export type Document = {
  content: string;
  metadata: {
    source: string;
    type: string;
  };
};
```

`content` is the textual knowledge loaded from the source.

`metadata` describes where the document came from. For our file:

``` json
{
  "source": "employee-handbook.txt",
  "type": "text/plain"
}
```

Preserving source metadata now will be useful later when the course
reaches citations, but **citations are not implemented in 003-002**.

------------------------------------------------------------------------

## 4. Build the Text Loader

Create:

``` text
src/lib/rag/load-text-file.ts
```

``` ts
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Document } from "./document";

/*
 * PAST
 * Our knowledge exists as a raw .txt file on disk.
 *
 * NOW — 003-002
 * This loader reads that source and converts it into our
 * application's standard Document representation.
 *
 * Because this project uses Next.js Cache Components, the loader
 * uses "use cache" so this project resource can be read during
 * prerendering without making the lesson page runtime-dynamic.
 *
 * The cache applies to loading the document resource.
 * It does not cache any LLM or AI runtime request.
 *
 * NEXT — 003-003
 * The loaded Document will be split into chunks.
 */

export async function loadTextFile(filePath: string): Promise<Document> {
    "use cache";

    const content = await readFile(filePath, "utf8");

    return {
        content,
        metadata: {
            source: path.basename(filePath),
            type: "text/plain",
        },
    };
}
```

The mechanics are deliberately visible:

``` text
read source
    ↓
extract content
    ↓
attach metadata
    ↓
return Document
```

We avoid adding a large loader framework at this lesson boundary because
a tiny TypeScript loader makes the abstraction easier to understand.

------------------------------------------------------------------------

## 5. What Does `readFile()` Do?

``` ts
const content = await readFile(filePath, "utf8");
```

`readFile()` reads the raw file from disk. `"utf8"` returns its contents
as text.

At this point:

``` text
RAW FILE
   ↓
readFile(...)
   ↓
STRING
```

The loader then wraps that string in our standard `Document`
representation.

------------------------------------------------------------------------

## 6. Why `path.basename(filePath)`?

Instead of preserving a machine-specific path such as:

``` text
/Users/.../learn-ai-agents/resources/documents/employee-handbook.txt
```

we use:

``` ts
path.basename(filePath)
```

to preserve:

``` text
employee-handbook.txt
```

That gives us portable, meaningful source metadata rather than leaking a
local filesystem path into the document representation.

------------------------------------------------------------------------

## 7. Why Does the Loader Use `"use cache"`?

This project has Next.js Cache Components enabled.

When the page first used uncached filesystem access, compilation and
TypeScript succeeded, but production prerendering rejected the runtime
data access.

The loader therefore declares:

``` ts
"use cache";
```

inside `loadTextFile()`.

This lets the project resource participate in caching and allows
`/learn/03-rag` to remain prerenderable.

The distinction is important:

``` text
CACHE DOCUMENT RESOURCE
        ≠
CACHE AI RUNTIME
```

We are caching the loading of a project document. We are **not** caching
an LLM request or AI runtime behavior.

------------------------------------------------------------------------

## 8. Load the Handbook in the RAG Page

The page imports:

``` ts
import path from "node:path";
import { loadTextFile } from "@/lib/rag/load-text-file";
```

The Server Component is asynchronous:

``` ts
export default async function RAGPage() {
```

and loads the handbook:

``` ts
const handbook = await loadTextFile(
    path.join(process.cwd(), "resources/documents/employee-handbook.txt"),
);
```

The flow is now real:

``` text
resources/documents/employee-handbook.txt
                  ↓
           loadTextFile()
                  ↓
              handbook
                  ↓
              Document
```

------------------------------------------------------------------------

## 9. Render the Real Document

The page displays:

``` tsx
{handbook.content}
```

and:

``` tsx
{handbook.metadata.source}
{handbook.metadata.type}
```

The result includes:

``` text
source  employee-handbook.txt
type    text/plain
```

So the application now has both the knowledge and information describing
where it came from.

------------------------------------------------------------------------

## 10. One Representation, Many Source Types

The larger design is:

``` text
TXT ─────→ Text Loader ────┐
                           │
MD  ─────→ MD Loader ──────┤
                           ├──→ Document
PDF ─────→ PDF Loader ─────┤      ├── content
                           │      └── metadata
Web ─────→ Web Loader ─────┘
```

TXT is the only concrete loader implemented in 003-002.

Markdown, PDF, and Web are discussed as additional loader types, but we
do **not** falsely claim to have implemented them.

The architectural benefit is that downstream RAG stages can operate on a
normalized `Document` instead of knowing every original source format.

------------------------------------------------------------------------

## 11. Functional Verification

### Lint

``` bash
pnpm lint
```

Passed with **0 errors and 0 warnings**.

### Production build

``` bash
pnpm build
```

Passed successfully.

The build reports:

``` text
○ /learn/03-rag    15m    1y
```

and identifies the route as statically prerendered.

### Browser review

The lesson page was reviewed in the browser and confirmed to show:

-   **Documents & Loaders**
-   the real handbook content
-   `employee-handbook.txt`
-   `text/plain`
-   the existing course sidebar/layout

------------------------------------------------------------------------

## 12. What Changed From 003-001?

The page remains cumulative.

We retain the 003-001 foundation:

``` text
Why RAG exists
Retrieve → Augment → Generate
RAG changes context, not model weights
Agents = actions
RAG = knowledge
```

Then 003-002 adds:

``` text
Source
   ↓
Loader
   ↓
Document
```

The roadmap advances to:

``` text
003-001 Overview
003-002 Documents & Loaders ← NOW
003-003 Chunking
003-004 Embeddings
003-005 Vector Store
003-006 Retrieval
003-007 RAG in Next.js
```

------------------------------------------------------------------------

## 13. What This Lesson Does NOT Do

003-002 deliberately does **not** implement:

-   chunking
-   embeddings
-   vector storage
-   semantic retrieval
-   RAG answer generation
-   `/api/rag`
-   RAG chat
-   citations
-   agentic RAG
-   LangGraph

Our pipeline stops here:

``` text
SOURCE
   ↓
LOADER
   ↓
DOCUMENT
   ↓
  STOP
```

The document exists in memory, but it has not been split, embedded,
stored, searched, or sent to an LLM.

------------------------------------------------------------------------

## 14. Why Not Chunk Yet?

003-002 asks:

> How does knowledge enter our application?

003-003 asks:

> Once a document is loaded, how should we divide it into useful pieces?

Keeping those responsibilities separate gives us a clean progression:

``` text
003-001  Why RAG?
             ↓
003-002  Load documents
             ↓
003-003  Chunk documents
             ↓
003-004  Create embeddings
             ↓
003-005  Store vectors
             ↓
003-006  Retrieve relevant chunks
             ↓
003-007  Build RAG app
```

------------------------------------------------------------------------

## 15. Mental Model to Remember

``` text
REAL-WORLD SOURCE
       ↓
SOURCE-SPECIFIC LOADER
       ↓
STANDARD DOCUMENT
  ├── content
  └── metadata
```

Or simply:

``` text
Source → Loader → Document
```

A loader:

1.  reads the source,
2.  extracts its content,
3.  attaches useful metadata,
4.  returns a consistent `Document`.

A loader does **not** decide which part is relevant to a user's
question. Retrieval comes later.

------------------------------------------------------------------------

## Key Takeaway

Before RAG can retrieve external knowledge, the application must first
**load and normalize that knowledge**.

In 003-002 we turned:

``` text
resources/documents/employee-handbook.txt
```

into:

``` text
Document
├── content
└── metadata
    ├── source: "employee-handbook.txt"
    └── type: "text/plain"
```

using `loadTextFile()`.

We now have our first real RAG document in memory.

Next, in **003-003 --- Chunking**, we will split the loaded document
into smaller pieces.

------------------------------------------------------------------------

## Lesson Boundary Check

At the end of 003-002:

``` text
✓ Real source file
✓ Document type
✓ TXT loader
✓ Content loaded
✓ Metadata preserved
✓ Page renders the real Document
✓ Cache Components-compatible resource loading

✗ No chunking
✗ No embeddings
✗ No vector store
✗ No retrieval
✗ No RAG generation
✗ No citations
```

**Next: 003-003 --- Chunking**
