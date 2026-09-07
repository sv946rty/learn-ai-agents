import { CourseLayout } from "@/components/learn/course-layout";
import { courseSections } from "@/lib/course";

import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  Database,
  FileText,
  Lightbulb,
  Search,
  Sparkles,
  User,
} from "lucide-react";

/**
 * Lesson 003-001 — RAG Overview
 *
 * PAST — Section 002: Agents
 * --------------------------------
 * We gave the model the ability to take actions through tools:
 *
 *   User
 *     ↓
 *   Model
 *     ↓
 *   Tool calls
 *     ↓
 *   Observations
 *     ↓
 *   Model again
 *
 *
 * NOW — 003-001: RAG Overview
 * --------------------------------
 * We introduce a different capability:
 *
 *   Give the model relevant external knowledge at request time.
 *
 *   Question
 *      ↓
 *   Retrieve
 *      ↓
 *   Augment
 *      ↓
 *   Generate
 *
 * RAG does not retrain the model.
 * It changes the information available in the model's context.
 *
 *
 * NEXT — 003-002: Documents & Loaders
 * --------------------------------
 * Learn how applications load real documents such as PDF, TXT, MD,
 * and web content.
 *
 *
 * LESSON BOUNDARY
 * --------------------------------
 * This lesson explains the RAG mental model only.
 *
 * No document loaders.
 * No chunking.
 * No embeddings.
 * No vector store.
 * No retrieval implementation.
 * No RAG API or chat UI yet.
 */

export default function RAGPage() {
  const section = courseSections[2];

  return (
    <CourseLayout>
      <div className="space-y-8">
        <header className="mb-12">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-medium text-emerald-400">
            <span>
              Section {section.number} · {section.title}
            </span>
            <span className="text-muted-foreground">/</span>
            <span>Lesson 003-001</span>
          </div>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
            RAG Overview
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
            Agents gave our application the ability to take actions. RAG gives
            our application a way to bring relevant external knowledge into the
            model&apos;s context before it generates an answer.
          </p>

          <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">
              Learning goal
            </p>

            <p className="mt-2 text-lg leading-8">
              Understand what{" "}
              <strong className="text-foreground">
                Retrieval-Augmented Generation
              </strong>{" "}
              is, why we need it, and how{" "}
              <strong className="text-foreground">
                Retrieve → Augment → Generate
              </strong>{" "}
              changes what information an LLM can use when answering.
            </p>
          </div>
        </header>

        <section className="space-y-6">
          <Step
            number="1"
            title="The Problem: The Model Does Not Know Everything"
          >
            <p>
              An LLM can answer using information available from its training
              and the context we give it in the current request.
            </p>

            <p>
              But our application may depend on information the model does not
              automatically have.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              <ConceptCard
                icon={<FileText className="h-5 w-5" />}
                title="Private knowledge"
              >
                Internal policies, company documents, customer files, or
                proprietary documentation.
              </ConceptCard>

              <ConceptCard
                icon={<Database className="h-5 w-5" />}
                title="Application data"
              >
                Information stored by our own application rather than inside the
                model.
              </ConceptCard>

              <ConceptCard
                icon={<BookOpen className="h-5 w-5" />}
                title="External documents"
              >
                Documents or other sources that we want the model to use when
                answering.
              </ConceptCard>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-5">
              <p className="font-semibold">Example</p>

              <div className="mt-4 rounded-xl border border-border bg-background p-4 font-mono text-sm leading-7">
                Thunkx Employee Handbook
                <br />
                <br />
                Employees receive 25 vacation days per year.
              </div>

              <p className="mt-4 text-muted-foreground">
                Imagine this is private information available to our
                application. We should not assume the base model already knows
                it.
              </p>
            </div>
          </Step>

          <Step number="2" title="Without RAG">
            <p>
              Suppose a user asks a question whose answer depends on that
              private document:
            </p>

            <FlowRow
              left={
                <FlowBox
                  icon={<User className="h-5 w-5" />}
                  label="Question"
                  text="How many vacation days do Thunkx employees receive?"
                />
              }
              right={
                <FlowBox
                  icon={<Brain className="h-5 w-5" />}
                  label="LLM"
                  text="The model was not given the private handbook."
                />
              }
            />

            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
              <div className="flex gap-3">
                <Lightbulb className="mt-1 h-5 w-5 shrink-0 text-amber-400" />

                <div>
                  <p className="font-semibold text-amber-300">
                    The missing piece is context.
                  </p>

                  <p className="mt-2 text-muted-foreground">
                    The information exists, but we have not supplied the
                    relevant information to the model for this request.
                  </p>
                </div>
              </div>
            </div>
          </Step>

          <Step number="3" title="RAG: Retrieval-Augmented Generation">
            <p>
              RAG adds a knowledge-retrieval step before generation. The name
              describes the process:
            </p>

            <div className="grid gap-4 lg:grid-cols-3">
              <RAGStage
                letter="R"
                title="Retrieve"
                icon={<Search className="h-6 w-6" />}
              >
                Find information relevant to the user&apos;s question.
              </RAGStage>

              <RAGStage
                letter="A"
                title="Augment"
                icon={<Sparkles className="h-6 w-6" />}
              >
                Add the retrieved information to the context sent to the model.
              </RAGStage>

              <RAGStage
                letter="G"
                title="Generate"
                icon={<Bot className="h-6 w-6" />}
              >
                Let the model generate an answer using the question and supplied
                context.
              </RAGStage>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <FlowNode title="USER QUESTION">
                  How many vacation days do Thunkx employees receive?
                </FlowNode>

                <ArrowDown className="h-5 w-5 text-emerald-400" />

                <FlowNode title="RETRIEVE">
                  Find relevant information from our knowledge source.
                </FlowNode>

                <ArrowDown className="h-5 w-5 text-emerald-400" />

                <FlowNode title="AUGMENT">
                  Question + &quot;Employees receive 25 vacation days per
                  year.&quot;
                </FlowNode>

                <ArrowDown className="h-5 w-5 text-emerald-400" />

                <FlowNode title="GENERATE">
                  The LLM answers using the supplied context.
                </FlowNode>

                <ArrowDown className="h-5 w-5 text-emerald-400" />

                <div className="w-full max-w-xl rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                    Answer
                  </p>

                  <p className="mt-2 font-semibold">
                    Thunkx employees receive 25 vacation days per year.
                  </p>
                </div>
              </div>
            </div>
          </Step>

          <Step number="4" title="What Does “Augment” Mean?">
            <p>
              The word <strong>augment</strong> means to add to or enhance
              something.
            </p>

            <p>
              In RAG, we augment the model&apos;s request with retrieved
              information.
            </p>

            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <ContextBox title="Before augmentation">
                <Code>Question</Code>
              </ContextBox>

              <div className="flex justify-center">
                <ArrowRight className="hidden h-6 w-6 text-emerald-400 md:block" />
                <ArrowDown className="h-6 w-6 text-emerald-400 md:hidden" />
              </div>

              <ContextBox title="After augmentation">
                <div className="space-y-2">
                  <Code>Retrieved context</Code>
                  <div className="text-center text-muted-foreground">+</div>
                  <Code>Question</Code>
                </div>
              </ContextBox>
            </div>

            <p className="text-muted-foreground">
              The model can now generate from a request containing information
              it did not previously have in that conversation.
            </p>
          </Step>

          <Step number="5" title="RAG Is Not Model Training">
            <p>
              This distinction is fundamental. RAG does not teach new facts by
              changing the model&apos;s trained weights.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <ComparisonCard
                title="Training / Fine-tuning"
                icon={<Brain className="h-5 w-5" />}
              >
                <p>
                  Changes model behavior or learned parameters through training.
                </p>
                <p className="mt-3 text-muted-foreground">
                  Think: change the model.
                </p>
              </ComparisonCard>

              <ComparisonCard
                title="RAG"
                icon={<Search className="h-5 w-5" />}
                accent
              >
                <p>
                  Retrieves relevant information and supplies it as context at
                  request time.
                </p>
                <p className="mt-3 text-emerald-300">
                  Think: change the context.
                </p>
              </ComparisonCard>
            </div>

            <Takeaway>
              RAG changes the information available to the model for a request,
              not the model&apos;s trained weights.
            </Takeaway>
          </Step>

          <Step number="6" title="Agents vs RAG">
            <p>
              Section 002 and Section 003 give our AI application two different
              kinds of capability.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <CapabilityCard
                title="Agents"
                subtitle="Give the model actions"
                icon={<Bot className="h-6 w-6" />}
              >
                <div className="font-mono text-sm leading-7">
                  Model
                  <br />
                  ↓
                  <br />
                  Tool call
                  <br />
                  ↓
                  <br />
                  Action
                  <br />
                  ↓
                  <br />
                  Observation
                </div>
              </CapabilityCard>

              <CapabilityCard
                title="RAG"
                subtitle="Give the model knowledge"
                icon={<BookOpen className="h-6 w-6" />}
                accent
              >
                <div className="font-mono text-sm leading-7">
                  Question
                  <br />
                  ↓
                  <br />
                  Retrieve
                  <br />
                  ↓
                  <br />
                  Context
                  <br />
                  ↓
                  <br />
                  Answer
                </div>
              </CapabilityCard>
            </div>

            <p className="text-muted-foreground">
              Later, applications can combine these ideas. For now, we keep them
              separate so the RAG pipeline is easy to understand.
            </p>
          </Step>

          <Step number="7" title="The RAG Pipeline We Will Build">
            <p>
              This section will build the complete pipeline incrementally. Each
              upcoming lesson adds one missing piece.
            </p>

            <div className="space-y-3">
              <RoadmapItem
                lesson="003-001"
                title="Overview"
                description="Understand what RAG is and when to use it."
                current
              />

              <RoadmapItem
                lesson="003-002"
                title="Documents & Loaders"
                description="Load documents such as PDF, TXT, MD, and web content."
              />

              <RoadmapItem
                lesson="003-003"
                title="Chunking"
                description="Split documents into smaller chunks."
              />

              <RoadmapItem
                lesson="003-004"
                title="Embeddings"
                description="Create embeddings with OpenAI."
              />

              <RoadmapItem
                lesson="003-005"
                title="Vector Store"
                description="Store embeddings in a vector database."
              />

              <RoadmapItem
                lesson="003-006"
                title="Retrieval"
                description="Retrieve relevant chunks for a user's question."
              />

              <RoadmapItem
                lesson="003-007"
                title="RAG in Next.js"
                description="Build the complete RAG app with chat and citations."
              />
            </div>
          </Step>

          <Step number="8" title="What We Are Not Building Yet">
            <p>
              This is an overview lesson. We deliberately stop before the
              implementation details assigned to later lessons.
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <BoundaryItem>Document loaders</BoundaryItem>
              <BoundaryItem>Chunking</BoundaryItem>
              <BoundaryItem>Embeddings</BoundaryItem>
              <BoundaryItem>Vector stores</BoundaryItem>
              <BoundaryItem>Semantic retrieval</BoundaryItem>
              <BoundaryItem>RAG chat + citations</BoundaryItem>
            </div>

            <p className="text-muted-foreground">
              We first need the mental model. Then we can understand why each
              implementation piece exists.
            </p>
          </Step>

          <Step number="9" title="The Mental Model to Remember">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
              <div className="flex flex-col items-center gap-3">
                <MentalModelNode title="QUESTION" />
                <ArrowDown className="h-5 w-5 text-emerald-400" />
                <MentalModelNode title="RETRIEVE RELEVANT KNOWLEDGE" />
                <ArrowDown className="h-5 w-5 text-emerald-400" />
                <MentalModelNode title="ADD KNOWLEDGE TO CONTEXT" />
                <ArrowDown className="h-5 w-5 text-emerald-400" />
                <MentalModelNode title="GENERATE ANSWER" />
              </div>
            </div>

            <Takeaway>
              Retrieve relevant external information, augment the model&apos;s
              context with it, then generate the answer.
            </Takeaway>
          </Step>
        </section>

        <section className="mt-12 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-400">
              <BookOpen className="h-6 w-6" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">
                Next · 003-002
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Documents &amp; Loaders
              </h2>

              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
                We understand why RAG needs external knowledge. Next, we begin
                building the pipeline by learning how an application loads real
                documents that will eventually become our knowledge source.
              </p>
            </div>
          </div>
        </section>
      </div>
    </CourseLayout>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-sm font-bold text-emerald-400">
          {number}
        </div>

        <h2 className="pt-1 text-2xl font-bold tracking-tight">{title}</h2>
      </div>

      <div className="space-y-5 leading-7 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function ConceptCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="mb-3 flex items-center gap-2 text-foreground">
        <span className="text-emerald-400">{icon}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>

      <p className="text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}

function FlowRow({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
      {left}

      <div className="flex justify-center">
        <ArrowRight className="hidden h-6 w-6 text-muted-foreground md:block" />
        <ArrowDown className="h-6 w-6 text-muted-foreground md:hidden" />
      </div>

      {right}
    </div>
  );
}

function FlowBox({
  icon,
  label,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
}) {
  return (
    <div className="h-full rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center gap-2 text-foreground">
        <span className="text-emerald-400">{icon}</span>
        <p className="font-semibold">{label}</p>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function RAGStage({
  letter,
  title,
  icon,
  children,
}: {
  letter: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-lg font-bold text-emerald-400">
          {letter}
        </div>

        <div className="text-emerald-400">{icon}</div>
      </div>

      <h3 className="mt-5 text-xl font-bold text-foreground">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}

function FlowNode({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-xl rounded-xl border border-border bg-background p-4">
      <p className="text-xs font-semibold tracking-[0.18em] text-emerald-400">
        {title}
      </p>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}

function ContextBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <p className="mb-4 font-semibold text-foreground">{title}</p>
      {children}
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center font-mono text-sm text-foreground">
      {children}
    </div>
  );
}

function ComparisonCard({
  title,
  icon,
  accent = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-border bg-background"
      }`}
    >
      <div className="flex items-center gap-2 text-foreground">
        <span className={accent ? "text-emerald-400" : ""}>{icon}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>

      <div className="mt-4 text-sm leading-6">{children}</div>
    </div>
  );
}

function Takeaway({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
        Key takeaway
      </p>

      <p className="mt-2 font-semibold leading-7 text-foreground">{children}</p>
    </div>
  );
}

function CapabilityCard({
  title,
  subtitle,
  icon,
  accent = false,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        accent
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-border bg-background"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={accent ? "text-emerald-400" : "text-blue-400"}>
          {icon}
        </span>

        <div>
          <h3 className="font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-background/60 p-4 text-foreground">
        {children}
      </div>
    </div>
  );
}

function RoadmapItem({
  lesson,
  title,
  description,
  current = false,
}: {
  lesson: string;
  title: string;
  description: string;
  current?: boolean;
}) {
  return (
    <div
      className={`flex gap-4 rounded-2xl border p-4 ${
        current
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-border bg-background"
      }`}
    >
      <div
        className={`shrink-0 font-mono text-xs font-semibold ${
          current ? "text-emerald-400" : "text-muted-foreground"
        }`}
      >
        {lesson}
      </div>

      <div>
        <p className="font-semibold text-foreground">
          {title}
          {current && (
            <span className="ml-2 text-xs font-medium text-emerald-400">
              ← NOW
            </span>
          )}
        </p>

        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function BoundaryItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground">
      Not yet: {children}
    </div>
  );
}

function MentalModelNode({ title }: { title: string }) {
  return (
    <div className="w-full max-w-lg rounded-xl border border-emerald-500/30 bg-background px-4 py-3 text-center font-mono text-sm font-semibold text-foreground">
      {title}
    </div>
  );
}
