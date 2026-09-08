# 003-003 --- Chunking

**Section 003 --- RAG**\
**Learn AI Agents · by Thunkx**

> **Learning goal:** Understand why RAG systems split documents into
> smaller pieces, how `chunkSize` and `overlap` control that process,
> and how every chunk preserves metadata from its original document.

------------------------------------------------------------------------

## Where We Are

### PAST --- 003-002: Documents & Loaders

In the previous lesson, we turned a raw source file into a consistent
application representation:

``` text
employee-handbook.txt
        ↓
   loadTextFile()
        ↓
     Document
     ├─ content
     └─ metadata
```

Our `Document` type gave downstream RAG code one predictable shape
regardless of where the knowledge originally came from.

### NOW --- 003-003: Chunking

In this lesson, we take that loaded `Document` and split its content
into smaller, overlapping pieces:

``` text
Document
   ↓
chunkDocument()
   ↓
Chunk[]
├─ Chunk 0
├─ Chunk 1
└─ Chunk 2
```

### NEXT --- 003-004: Embeddings

In the next lesson, each chunk will be converted into an embedding.

``` text
Chunk[]
   ↓
Embeddings
```

### Lesson Boundary

This lesson implements **chunking only**.

We do **not** implement:

-   embeddings
-   a vector store
-   semantic retrieval
-   similarity search
-   a RAG API
-   a RAG chat UI
-   citations
-   agentic RAG

The transformation for this lesson is simply:

``` text
Document → Chunk[]
```

------------------------------------------------------------------------

# 1. Why Do We Need Chunking?

A document can contain many facts, topics, paragraphs, or sections.

Our sample handbook contains both a vacation policy and a remote-work
policy:

``` text
Thunkx Employee Handbook

Vacation Policy

Employees receive 25 vacation days per year.

Remote Work Policy

Employees may work remotely up to 3 days per week with manager approval.
```

In 003-002, we loaded that entire file into one `Document`.

That was the correct first step, but treating an entire large document
as one unit is often too coarse for retrieval.

Suppose a user eventually asks:

``` text
How many vacation days do Thunkx employees receive?
```

The useful knowledge is only a small part of the handbook:

``` text
Employees receive 25 vacation days per year.
```

Chunking gives later RAG stages smaller units to embed, store, compare,
and retrieve.

The mental model is:

``` text
Large Document
      ↓
   Chunking
      ↓
Smaller pieces
      ↓
Later: embed and retrieve relevant pieces
```

A key distinction:

> Chunking does not retrieve anything.

It only prepares the document for later stages.

------------------------------------------------------------------------

# 2. Our Starting `Document`

From 003-002, our application already has this type:

``` ts
export type Document = {
  content: string;
  metadata: {
    source: string;
    type: string;
  };
};
```

For our handbook, the loaded value conceptually looks like:

``` ts
{
  content: "Thunkx Employee Handbook\n\nVacation Policy\n\n...",
  metadata: {
    source: "employee-handbook.txt",
    type: "text/plain",
  },
}
```

The important pieces are:

``` text
Document
├─ content
│  └─ the actual knowledge
│
└─ metadata
   ├─ source
   └─ type
```

Chunking will transform the `content`, but it must not lose the metadata
that tells us where that content came from.

------------------------------------------------------------------------

# 3. Define a `Chunk`

We extend `src/lib/rag/document.ts` with a second type:

``` ts
export type Chunk = {
  content: string;
  metadata: Document["metadata"] & {
    chunkIndex: number;
  };
};
```

A `Chunk` has two responsibilities:

``` text
Chunk
├─ content
│  └─ a smaller piece of the Document
│
└─ metadata
   ├─ source
   ├─ type
   └─ chunkIndex
```

## Why use `Document["metadata"]`?

This TypeScript expression:

``` ts
Document["metadata"]
```

means:

> Use the type of the `metadata` property already defined on `Document`.

Then we intersect it with:

``` ts
{
  chunkIndex: number;
}
```

So:

``` ts
Document["metadata"] & {
  chunkIndex: number;
}
```

means:

``` text
original Document metadata
          +
chunk-specific metadata
```

This avoids duplicating:

``` ts
source: string;
type: string;
```

in two separate type definitions.

If we later change the `Document` metadata shape, `Chunk` automatically
inherits that shared definition.

------------------------------------------------------------------------

# 4. Why Preserve Metadata?

Imagine that a future retrieval step finds this chunk:

``` text
Employees receive 25 vacation days per year.
```

The text is useful, but we also want to know:

``` text
Where did this knowledge come from?
```

Because every chunk preserves the original metadata, we can retain:

``` text
source: employee-handbook.txt
type: text/plain
```

We also add:

``` text
chunkIndex: 0
```

or:

``` text
chunkIndex: 1
```

and so on.

That gives each chunk both **provenance** and **position**.

Conceptually:

``` text
Document metadata
├─ source: employee-handbook.txt
└─ type: text/plain
          │
          │ preserved
          ▼
Chunk metadata
├─ source: employee-handbook.txt
├─ type: text/plain
└─ chunkIndex: 0
```

This becomes increasingly useful later when retrieved chunks need to be
traced back to their source.

------------------------------------------------------------------------

# 5. Our First Chunking Strategy

There are many possible chunking strategies.

For example, production systems may split by:

-   characters
-   tokens
-   sentences
-   paragraphs
-   headings
-   recursive text boundaries
-   semantic structure

For this lesson, we deliberately start with **fixed character-based
chunking**.

Why?

Because it exposes the mechanics directly.

We can see exactly:

-   where a chunk begins
-   how large it is
-   how far the next chunk moves
-   how overlap works
-   what happens at the end of the document

We are learning the mechanism before introducing more sophisticated
abstractions.

------------------------------------------------------------------------

# 6. `chunkSize`

The first parameter is:

``` ts
chunkSize
```

For this lesson:

``` text
chunkSize = 80
```

That means:

> Each chunk contains at most 80 characters.

Conceptually:

``` text
Document content
│
├──────────── 80 characters ────────────┤
│                Chunk 0                │
└───────────────────────────────────────┘
```

The final chunk may contain fewer than 80 characters because the
document may end before the full chunk size is reached.

------------------------------------------------------------------------

# 7. `overlap`

The second parameter is:

``` ts
overlap
```

For this lesson:

``` text
overlap = 20
```

That means adjacent chunks intentionally share 20 characters.

Why?

Because important context may sit near a chunk boundary.

Without overlap:

``` text
Chunk 0
...important phrase begins HERE |

Chunk 1
| and continues over here...
```

A hard boundary can separate related text.

With overlap:

``` text
Chunk 0
----------------------------|
                  shared text
                  ↓↓↓↓↓↓↓↓↓↓
Chunk 1
                  |----------------------------
```

The shared region gives neighboring chunks some common context.

Important:

> Overlap does not guarantee perfect semantic boundaries.

It is simply one mechanism for reducing context loss at arbitrary split
points.

------------------------------------------------------------------------

# 8. Calculate the Step

If each chunk contains 80 characters but the next chunk repeats 20 of
those characters, we should not move forward by 80.

We move forward by:

``` text
step = chunkSize - overlap
```

For our values:

``` text
step = 80 - 20
step = 60
```

Therefore chunk starts occur at:

``` text
Chunk 0 → start 0
Chunk 1 → start 60
Chunk 2 → start 120
...
```

This is the central relationship:

``` text
chunkSize = 80
overlap   = 20
----------------
step      = 60
```

Another way to visualize it:

``` text
Chunk 0: [---------------- 80 ----------------]
                         [----20----]
                              [---------------- 80 ----------------]
                              Chunk 1

Start 0
Start 60
```

The 20-character region is shared.

------------------------------------------------------------------------

# 9. Implement `chunkDocument()`

Create:

``` text
src/lib/rag/chunk-document.ts
```

The completed implementation is:

``` ts
import type { Chunk, Document } from "./document";

/*
 * PAST — 003-002
 * A loader converted a raw source file into a Document.
 *
 * NOW — 003-003
 * This function splits a Document into smaller overlapping chunks
 * while preserving the original document metadata.
 *
 * NEXT — 003-004
 * Each chunk will be converted into an embedding.
 *
 * TEST CASES
 * chunkSize = 80, overlap = 20
 *
 * - Every chunk is at most 80 characters.
 * - Neighboring chunks overlap by 20 characters.
 * - Every chunk preserves source and type metadata.
 * - chunkIndex starts at 0 and increases by 1.
 */

export function chunkDocument(
  document: Document,
  chunkSize = 80,
  overlap = 20,
): Chunk[] {
  if (chunkSize <= 0) {
    throw new Error("chunkSize must be greater than 0.");
  }

  if (overlap < 0 || overlap >= chunkSize) {
    throw new Error(
      "overlap must be greater than or equal to 0 and smaller than chunkSize.",
    );
  }

  const chunks: Chunk[] = [];
  const step = chunkSize - overlap;

  for (
    let start = 0, chunkIndex = 0;
    start < document.content.length;
    start += step, chunkIndex += 1
  ) {
    const content = document.content.slice(start, start + chunkSize);

    chunks.push({
      content,
      metadata: {
        ...document.metadata,
        chunkIndex,
      },
    });

    if (start + chunkSize >= document.content.length) {
      break;
    }
  }

  return chunks;
}
```

Let's examine this piece by piece.

------------------------------------------------------------------------

# 10. Validate `chunkSize`

First:

``` ts
if (chunkSize <= 0) {
  throw new Error("chunkSize must be greater than 0.");
}
```

A chunk size of zero or a negative number cannot produce a meaningful
forward-moving chunking process.

So these are invalid:

``` text
chunkSize = 0
chunkSize = -10
```

The function fails immediately rather than allowing an invalid
configuration to continue.

------------------------------------------------------------------------

# 11. Validate `overlap`

Next:

``` ts
if (overlap < 0 || overlap >= chunkSize) {
  throw new Error(
    "overlap must be greater than or equal to 0 and smaller than chunkSize.",
  );
}
```

Valid:

``` text
chunkSize = 80
overlap   = 20
```

Also valid:

``` text
chunkSize = 80
overlap   = 0
```

Invalid:

``` text
chunkSize = 80
overlap   = 80
```

Why must overlap be smaller than chunk size?

Recall:

``` text
step = chunkSize - overlap
```

If:

``` text
chunkSize = 80
overlap   = 80
```

then:

``` text
step = 0
```

The loop would never move forward.

If overlap were larger than chunk size, the step would become negative.

The guard therefore guarantees:

``` text
step > 0
```

------------------------------------------------------------------------

# 12. Create the Result Array

We initialize:

``` ts
const chunks: Chunk[] = [];
```

This array will collect each generated `Chunk`.

At the end:

``` ts
return chunks;
```

So the transformation is:

``` text
Document
   ↓
chunkDocument()
   ↓
Chunk[]
```

------------------------------------------------------------------------

# 13. Calculate `step`

Next:

``` ts
const step = chunkSize - overlap;
```

With our defaults:

``` text
80 - 20 = 60
```

So every loop iteration advances by 60 characters.

That creates the intentional 20-character overlap between 80-character
chunks.

------------------------------------------------------------------------

# 14. Walk Through the Document

Our loop is:

``` ts
for (
  let start = 0, chunkIndex = 0;
  start < document.content.length;
  start += step, chunkIndex += 1
) {
  // ...
}
```

We track two values.

### `start`

The character position where the current chunk begins.

It evolves like:

``` text
0
60
120
...
```

### `chunkIndex`

The logical index assigned to each chunk:

``` text
0
1
2
...
```

The two values serve different purposes:

``` text
start
→ tells us where to slice the string

chunkIndex
→ tells us which chunk this is
```

------------------------------------------------------------------------

# 15. Slice the Content

Inside the loop:

``` ts
const content = document.content.slice(start, start + chunkSize);
```

For Chunk 0:

``` text
start = 0
chunkSize = 80

slice(0, 80)
```

For Chunk 1:

``` text
start = 60

slice(60, 140)
```

For Chunk 2:

``` text
start = 120

slice(120, 200)
```

If the document ends before the requested end position, JavaScript
simply returns the remaining characters.

That is why the final chunk can be shorter than `chunkSize`.

------------------------------------------------------------------------

# 16. Preserve Metadata

Each chunk is created with:

``` ts
chunks.push({
  content,
  metadata: {
    ...document.metadata,
    chunkIndex,
  },
});
```

This line:

``` ts
...document.metadata
```

copies:

``` text
source
type
```

from the original `Document`.

Then:

``` ts
chunkIndex
```

adds the chunk-specific position.

So a generated chunk looks like:

``` ts
{
  content: "...",
  metadata: {
    source: "employee-handbook.txt",
    type: "text/plain",
    chunkIndex: 0,
  },
}
```

This is a critical RAG habit:

> Derived pieces of knowledge should retain enough metadata to trace
> them back to their source.

------------------------------------------------------------------------

# 17. A Bug We Found During Testing

Our first implementation did not include this condition:

``` ts
if (start + chunkSize >= document.content.length) {
  break;
}
```

The loop only depended on:

``` ts
start < document.content.length
```

At first that seems reasonable.

But our real handbook test exposed a problem.

The initial output contained:

``` text
Chunk 0
Chunk 1
Chunk 2
Chunk 3
```

Chunk 3 contained only:

``` text
.
```

plus a newline.

Why?

Because Chunk 2 had already reached the end of the document.

However, after producing Chunk 2, the loop still advanced by another 60
characters.

The new starting position was technically still inside the document, so
the loop generated another chunk.

That final chunk contained only characters already present in the
overlap of Chunk 2.

Conceptually:

``` text
Chunk 2
[------------------ final useful content ------------------]
                                                     ↑
                                             reaches the end

loop advances again
        ↓

Chunk 3
[overlap only]
```

Chunk 3 contributed no new information.

------------------------------------------------------------------------

# 18. Fix the Trailing-Overlap Bug

We added:

``` ts
if (start + chunkSize >= document.content.length) {
  break;
}
```

Now the algorithm asks:

``` text
Did the chunk we just created reach the end?

NO
 ↓
advance by step
 ↓
create another chunk

YES
 ↓
STOP
```

This gives us an important rule:

> Overlap should preserve context between useful chunks, not create a
> final chunk containing only information already included in the
> previous chunk.

After the fix, our handbook produces exactly three useful chunks.

------------------------------------------------------------------------

# 19. Real Output from the Handbook

We tested:

``` ts
const chunks = chunkDocument(document, 80, 20);
```

The actual result was three chunks.

## Chunk 0

``` text
Thunkx Employee Handbook

Vacation Policy

Employees receive 25 vacation days pe
```

Metadata:

``` text
source: employee-handbook.txt
type: text/plain
chunkIndex: 0
```

## Chunk 1

``` text
 25 vacation days per year.

Remote Work Policy

Employees may work remotely up
```

Metadata:

``` text
source: employee-handbook.txt
type: text/plain
chunkIndex: 1
```

## Chunk 2

``` text
ay work remotely up to 3 days per week with manager approval.
```

Metadata:

``` text
source: employee-handbook.txt
type: text/plain
chunkIndex: 2
```

The result is:

``` text
Document
   ↓
chunkDocument(document, 80, 20)
   ↓
3 chunks
├─ index 0
├─ index 1
└─ index 2
```

------------------------------------------------------------------------

# 20. Notice the Deliberately Imperfect Boundaries

Our output reveals something important.

Chunk 0 ends with:

``` text
days pe
```

Chunk 1 contains:

``` text
25 vacation days per year.
```

Likewise, Chunk 1 ends with:

``` text
remotely up
```

while Chunk 2 begins with:

``` text
ay work remotely up to 3 days...
```

This is not beautiful text segmentation.

But it is useful for learning.

Why?

Because fixed-character chunking does exactly what we told it to do:

``` text
Take 80 characters.
Move forward 60.
Take another 80.
Repeat.
```

It does not understand:

-   words
-   sentences
-   paragraphs
-   topics
-   semantic meaning

That distinction is important.

------------------------------------------------------------------------

# 21. Character Chunking vs. Smarter Chunking

Our lesson implementation is:

``` text
fixed character boundaries
```

A more advanced system might instead try to split around:

``` text
paragraphs
     ↓
sentences
     ↓
words / tokens
```

Or use recursive rules such as:

``` text
Try paragraph boundary
        ↓
If too large, try sentence boundary
        ↓
If still too large, try smaller boundary
```

Other systems may use semantic chunking, where boundaries are influenced
by meaning.

Those approaches may produce cleaner retrieval units.

But implementing them now would hide the foundational mechanics behind
another abstraction.

For 003-003, the important understanding is:

``` text
Document
   ↓
choose chunk size
   ↓
choose overlap
   ↓
move a window through content
   ↓
preserve metadata
   ↓
Chunk[]
```

------------------------------------------------------------------------

# 22. Is `80` a Good Production Chunk Size?

Not necessarily.

We use:

``` text
80 characters
```

because our sample handbook is tiny and we want several chunks to be
visible on the lesson page.

In a real application, chunk size is a design choice influenced by
factors such as:

-   source structure
-   expected question granularity
-   embedding model behavior
-   retrieval quality
-   amount of surrounding context needed
-   downstream context limits

So do not memorize:

``` text
80 characters = correct RAG chunk size
```

Instead remember:

> Chunk size controls the amount of content represented by each
> retrieval unit.

Our `80` is a teaching value.

------------------------------------------------------------------------

# 23. Is `20` the Correct Overlap?

Again, not universally.

Our:

``` text
overlap = 20
```

is chosen because it makes the relationship easy to see:

``` text
chunkSize = 80
overlap   = 20
step      = 60
```

The general tradeoff is:

### Too little overlap

You may lose useful context across boundaries.

### More overlap

Neighboring chunks preserve more shared context, but you also duplicate
more content.

So overlap is another design parameter, not a universal constant.

------------------------------------------------------------------------

# 24. Integrate Chunking into the Lesson Page

Our RAG page already loads the handbook:

``` ts
const handbook = await loadTextFile(
  path.join(process.cwd(), "resources/documents/employee-handbook.txt"),
);
```

003-003 adds:

``` ts
const chunks = chunkDocument(handbook, 80, 20);
```

The complete progression is now:

``` text
resources/documents/employee-handbook.txt
                    ↓
             loadTextFile()
                    ↓
                Document
                    ↓
        chunkDocument(handbook, 80, 20)
                    ↓
                 Chunk[]
```

This is important because the lesson page is not displaying fake
hardcoded chunk examples.

It executes the real application code and renders the resulting chunks.

------------------------------------------------------------------------

# 25. Server-Side Execution

The page remains a Server Component.

We do not add:

``` ts
"use client";
```

Chunking does not require browser state or event handlers.

The server can:

1.  load the project resource
2.  create the `Document`
3.  chunk the `Document`
4.  render the results

Conceptually:

``` text
Server Component
      ↓
loadTextFile()
      ↓
Document
      ↓
chunkDocument()
      ↓
Chunk[]
      ↓
render HTML
```

This keeps client-side JavaScript unnecessary for this lesson.

------------------------------------------------------------------------

# 26. Cache Boundary

From 003-002, `loadTextFile()` contains:

``` ts
"use cache";
```

That is needed because this project uses Next.js Cache Components and
the local resource is read during prerendering.

Our new:

``` ts
chunkDocument()
```

is simply a synchronous transformation of the already-loaded `Document`.

It does not perform:

-   network I/O
-   OpenAI calls
-   model inference
-   dynamic user-specific work

The important distinction remains:

``` text
CACHE DOCUMENT RESOURCE
        ≠
CACHE AI RUNTIME
```

003-003 does not introduce any AI runtime request at all.

------------------------------------------------------------------------

# 27. Guardrail Tests

We explicitly tested invalid configurations.

## Test 1 --- Invalid chunk size

Input:

``` text
chunkSize = 0
overlap = 0
```

Result:

``` text
chunkSize must be greater than 0.
```

## Test 2 --- Invalid overlap

Input:

``` text
chunkSize = 80
overlap = 80
```

Result:

``` text
overlap must be greater than or equal to 0 and smaller than chunkSize.
```

These tests confirm that the function rejects configurations that would
make the chunking loop invalid.

------------------------------------------------------------------------

# 28. Runtime Test

We also executed the chunker directly against the real handbook.

The expected properties were:

``` text
✓ multiple chunks are created
✓ each chunk is at most 80 characters
✓ neighboring chunks overlap by 20 characters
✓ source metadata is preserved
✓ type metadata is preserved
✓ chunkIndex starts at 0
✓ chunkIndex increments by 1
✓ no redundant trailing chunk
```

After fixing the trailing-overlap issue, the handbook produced:

``` text
3 chunks
```

exactly as expected.

------------------------------------------------------------------------

# 29. TypeScript Verification

We ran:

``` bash
pnpm exec tsc --noEmit
```

It completed with no TypeScript errors.

That verifies the relationship between:

``` text
Document
Chunk
chunkDocument()
```

is type-correct.

------------------------------------------------------------------------

# 30. Lint Verification

We ran:

``` bash
pnpm lint
```

Result:

``` text
0 errors
0 warnings
```

This confirms the new chunking implementation and evolved lesson page
satisfy the project's lint rules.

------------------------------------------------------------------------

# 31. Production Build Verification

We ran:

``` bash
pnpm build
```

The production build completed successfully.

The RAG route remained:

``` text
○ /learn/03-rag    15m    1y
```

and Next.js reported it as statically prerendered content.

That means adding:

``` ts
chunkDocument()
```

did not force the lesson page into dynamic rendering.

------------------------------------------------------------------------

# 32. Browser Verification

The completed lesson page was reviewed in the browser.

We verified:

-   the header shows **Lesson 003-003 --- Chunking**
-   the existing course sidebar remains intact
-   the previous RAG and loader concepts remain available
-   chunk size is shown as `80`
-   overlap is shown as `20`
-   step is shown as `60`
-   the real handbook renders as exactly three chunks
-   each chunk preserves `employee-handbook.txt`
-   each chunk preserves `text/plain`
-   `003-003 Chunking` is marked as the current roadmap lesson
-   the next lesson is **003-004 --- Embeddings**

------------------------------------------------------------------------

# 33. What We Added in 003-003

The main implementation additions are:

``` text
src/lib/rag/document.ts
```

which now defines:

``` text
Document
Chunk
```

and:

``` text
src/lib/rag/chunk-document.ts
```

which defines:

``` text
chunkDocument()
```

The RAG lesson page now executes:

``` text
loadTextFile()
      ↓
Document
      ↓
chunkDocument()
      ↓
Chunk[]
```

------------------------------------------------------------------------

# 34. What We Deliberately Did Not Add

It is important to recognize what is **not** in the code yet.

There is no:

``` text
OpenAI embedding request
```

There is no:

``` text
vector database
```

There is no:

``` text
cosine similarity
```

There is no:

``` text
semantic search
```

There is no:

``` text
retriever
```

There is no:

``` text
/api/rag
```

There is no:

``` text
RAG chat interface
```

And the chunks are not sent to an LLM.

Those are later lessons.

------------------------------------------------------------------------

# 35. RAG Pipeline Progress

Our Section 003 progression is now:

``` text
003-001  Overview
         Why RAG exists
              ↓
003-002  Documents & Loaders
         Source → Document
              ↓
003-003  Chunking
         Document → Chunk[]        ← NOW
              ↓
003-004  Embeddings
         Chunk → Vector
              ↓
003-005  Vector Store
         Store vectors
              ↓
003-006  Retrieval
         Question → relevant chunks
              ↓
003-007  RAG in Next.js
         Chat + retrieval + citations
```

The implementation currently stops here:

``` text
employee-handbook.txt
        ↓
loadTextFile()
        ↓
Document
        ↓
chunkDocument()
        ↓
Chunk[]
        ↓
       STOP
```

------------------------------------------------------------------------

# 36. The Most Important Mental Model

If you remember only one diagram from this lesson, remember this:

``` text
DOCUMENT
   │
   │ content
   ▼
CHUNK DOCUMENT
   │
   ├── chunkSize = 80
   ├── overlap   = 20
   └── step      = 60
   │
   ▼
CHUNKS
   │
   ├── Chunk 0
   │   ├── content
   │   ├── source
   │   ├── type
   │   └── chunkIndex: 0
   │
   ├── Chunk 1
   │   ├── content
   │   ├── source
   │   ├── type
   │   └── chunkIndex: 1
   │
   └── Chunk 2
       ├── content
       ├── source
       ├── type
       └── chunkIndex: 2
```

Chunking changes the **granularity** of our knowledge.

It does not yet give the application the ability to understand which
chunk is relevant.

That comes later.

------------------------------------------------------------------------

# 37. Key Takeaways

1.  A `Document` may be too large or broad to use as one retrieval unit.
2.  Chunking splits document content into smaller pieces.
3.  `chunkSize` controls the maximum size of each chunk.
4.  `overlap` lets neighboring chunks share context.
5.  `step = chunkSize - overlap`.
6.  With `chunkSize = 80` and `overlap = 20`, our step is `60`.
7.  Each chunk preserves the original document metadata.
8.  `chunkIndex` identifies the chunk's position.
9.  Fixed-character chunking can split words and sentences.
10. Our simple implementation is intentional so the mechanics remain
    visible.
11. We stop once the current chunk reaches the document end to avoid a
    redundant overlap-only chunk.
12. Chunking does **not** perform retrieval.
13. Chunking does **not** create embeddings.
14. Chunking does **not** call an LLM.
15. The output of 003-003 is `Chunk[]`.

------------------------------------------------------------------------

# 38. Next --- 003-004: Embeddings

We now have smaller pieces of knowledge:

``` text
Chunk 0
Chunk 1
Chunk 2
```

But the application still has no semantic representation of what those
chunks mean.

The next question is:

> How can we represent the meaning of a chunk numerically so a computer
> can compare it with a user's question?

That leads directly to:

``` text
003-004 — Embeddings
```

The next transformation will be:

``` text
Chunk
  ↓
Embedding model
  ↓
Vector
```

For now, our lesson stops at:

``` text
Document → Chunk[]
```

**Learn by building.**
