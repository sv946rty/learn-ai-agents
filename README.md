# Learn AI Agents

Learn modern AI-agent engineering by building.

An open-source course by [Thunkx](https://thunkx.com).

## About

Learn AI Agents is a hands-on course for learning how modern AI agents work by building them step by step.

The course starts with language-model fundamentals and progresses through tool calling, agent loops, retrieval-augmented generation, LangGraph, the Model Context Protocol, application development, and evaluation.

Each section builds on the previous one so that the codebase grows alongside the course.

## Course

The course is organized into seven sections:

1. **LLMs** — Language-model fundamentals
2. **Agents** — Tool calling and agent loops
3. **RAG** — Retrieval-augmented generation
4. **LangGraph** — Stateful agent workflows
5. **MCP** — Model Context Protocol
6. **Build** — Build a complete AI-agent application
7. **Eval** — Evaluate and improve agent behavior

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui with Base UI
- pnpm

Additional AI libraries are introduced only when the course reaches the lessons that require them.

## Getting Started

Install dependencies:

    pnpm install

Start the development server:

    pnpm dev

Then open `http://localhost:3000`.

## Project Structure

    learn-ai-agents/
    ├── resources/
    │   ├── infographics/
    │   └── lessons/
    ├── public/
    ├── src/
    │   ├── app/
    │   ├── components/
    │   └── lib/
    ├── AGENTS.md
    └── README.md

The Git repository root and the Next.js application root are the same directory.

## Learning Materials

Course tutorials live in:

    resources/lessons/

Course infographics live in:

    resources/infographics/

The application itself lives under `src/`.

## Development

Before considering a lesson complete, verify the project with:

    pnpm lint
    pnpm build

Each lesson is implemented incrementally. Future course concepts and dependencies should not be introduced before the lesson that teaches them.

## License

License information will be added to the repository separately.
