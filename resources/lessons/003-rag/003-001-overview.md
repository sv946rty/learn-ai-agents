# 003-001 — RAG Overview

> **Section 003 · RAG**  
> **Learn AI Agents** · by Thunkx  
> **Learn by building.**

## Learning Goal

Understand what **Retrieval-Augmented Generation (RAG)** is, why an AI application may need it, and the high-level flow:

```text
Retrieve → Augment → Generate
```

This lesson is intentionally conceptual. We build the mental model before implementing document loading, chunking, embeddings, vector storage, or retrieval.

---

## PAST — Section 002: Agents

In Section 002, we gave the model the ability to **take actions** through tools:

```text
User → Model → Tool calls → Observations → Model again
```

That solved an **action** problem. Section 003 introduces a different problem: **knowledge**.

---

## NOW — 003-001: RAG Overview

An application may depend on information the base model does not automatically have: private company documents, internal policies, customer files, proprietary documentation, application data, or external documents.

An LLM can answer using information from its training and the context supplied in the current request. But information existing somewhere in our application does not automatically make it available to the model.

That is the problem RAG addresses.

## 1. The Problem: The Model Does Not Know Everything

Imagine a private Thunkx employee handbook containing:

```text
Thunkx Employee Handbook

Employees receive 25 vacation days per year.
```

A user asks:

```text
How many vacation days do Thunkx employees receive?
```

The information exists in our private document, but unless the application provides the relevant information to the model, we should not assume the model knows that private policy.

```text
Information exists
        ≠
Information is available in the model's current context
```

Common knowledge sources include **private knowledge**, **application data**, and **external documents**.

---

## 2. Without RAG

```text
User question
     ↓
    LLM
     ↓
Answer using what is already available
```

For our example, the private handbook was never supplied. The missing piece is **context**.

---

## 3. What Is RAG?

**RAG** stands for **Retrieval-Augmented Generation**. At a high level, RAG adds a retrieval step so relevant external information can be supplied to the model before it generates an answer.

### Retrieve
Find information relevant to the user's question.

### Augment
Add the retrieved information to the context supplied to the model.

### Generate
Let the model generate an answer using the question and supplied context.

```text
Question
   ↓
Retrieve
   ↓
Augment
   ↓
Generate
   ↓
Answer
```

---

## 4. Walking Through the Example

**Retrieve:** find the relevant handbook information:

```text
Employees receive 25 vacation days per year.
```

At this lesson boundary, we are **not implementing how retrieval works**. That belongs later in Section 003.

**Augment:** conceptually supply both the retrieved context and question:

```text
Retrieved context:
Employees receive 25 vacation days per year.

Question:
How many vacation days do Thunkx employees receive?
```

**Generate:** the model can answer using that supplied context:

```text
Thunkx employees receive 25 vacation days per year.
```

The model was not retrained. The application changed the information available in the request.

---

## 5. What Does “Augment” Mean?

To **augment** means to add to or enhance something.

```text
Before: Question

After:  Retrieved context + Question
```

A simplified model input might contain system instructions, the user question, and retrieved context. The exact structure can vary; the key idea is that retrieved knowledge becomes available to the model when it answers.

---

## 6. RAG Does Not Retrain the Model

This distinction is fundamental.

### Training / Fine-tuning

```text
Change the model
```

Training or fine-tuning changes model behavior or learned parameters through a training process.

### RAG

```text
Change the context
```

RAG retrieves relevant information and supplies it at request time.

> **RAG changes the information available to the model for a request, not the model's trained weights.**

---

## 7. Agents vs RAG

### Agents = actions

```text
Model → Tool call → Action → Observation
```

Agents give the model a way to request **actions**.

### RAG = knowledge

```text
Question → Retrieve → Context → Answer
```

RAG gives the model relevant **knowledge**.

These ideas can later be combined, but we keep them separate here so the RAG pipeline is easy to understand.

---

## 8. The RAG Pipeline We Will Build

| Lesson | Topic | Purpose |
|---|---|---|
| **003-001** | **Overview** | Understand what RAG is and when to use it. |
| 003-002 | Documents & Loaders | Load documents such as PDF, TXT, MD, and web content. |
| 003-003 | Chunking | Split documents into chunks. |
| 003-004 | Embeddings | Create embeddings with OpenAI. |
| 003-005 | Vector Store | Store embeddings in a vector database. |
| 003-006 | Retrieval | Retrieve relevant chunks for a user's question. |
| 003-007 | RAG in Next.js | Build a RAG app with chat and citations. |

Section payoff:

> **A RAG chatbot that knows your documents.**

---

## 9. What 003-001 Does Not Build

This lesson establishes the mental model only. We deliberately do **not** implement:

- document loaders,
- chunking,
- embeddings,
- a vector store,
- semantic retrieval,
- `/api/rag`,
- a RAG chat UI,
- citations, or
- agentic RAG / LangGraph integration.

We also avoid a toy hard-coded retrieval algorithm because retrieval implementation belongs to **003-006 — Retrieval**.

```text
WHY?
The LLM does not automatically know
our private / application documents.

                 ↓

RETRIEVE
Find relevant information

                 ↓

AUGMENT
Add it to the model's context

                 ↓

GENERATE
Answer using that context
```

---

## 10. Why There Is No RAG API Yet

`003-001` is conceptual. There is no retrieval runtime to execute yet, so we deliberately do not create `/api/rag`.

The lesson page remains a Server Component and can be statically prerendered. During verification, the production build showed:

```text
○ /learn/03-rag
```

That is appropriate for the current lesson boundary.

---

## 11. The Mental Model to Remember

```text
QUESTION
   ↓
RETRIEVE RELEVANT KNOWLEDGE
   ↓
ADD KNOWLEDGE TO CONTEXT
   ↓
GENERATE ANSWER
```

Or simply:

```text
Retrieve → Augment → Generate
```

RAG gives an AI application a way to bring **relevant external knowledge into the model's context at request time**.

---

## PAST → NOW → NEXT

### PAST — Section 002
We built an agent that can **ACT** through tools and loops.

### NOW — 003-001
We understand how an application can give an LLM relevant **KNOWLEDGE** at request time.

### NEXT — 003-002: Documents & Loaders
We begin building the actual pipeline by learning how an application loads PDF, TXT, MD, and web content.

---

## Lesson Boundary Check

After 003-001, you should be able to explain:

1. Why an LLM does not automatically know private application documents.
2. What **RAG** stands for.
3. What happens during **Retrieve**.
4. What happens during **Augment**.
5. What happens during **Generate**.
6. Why RAG changes context rather than model weights.
7. The difference between **Agents = actions** and **RAG = knowledge**.
8. Why loaders, embeddings, vector storage, and retrieval are not implemented yet.

---

## Key Takeaway

```text
RAG does not retrain the model.

Retrieve relevant external information
                ↓
Add it to the model's context
                ↓
Generate an answer using that context
```

**Retrieve → Augment → Generate**

That is the foundation for the rest of Section 003.

---

**Learn AI Agents** · by **Thunkx**  
*Learn by building.*
