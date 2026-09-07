"use client";

import { useState } from "react";

/**
 * Lesson 002-007 — Agent UI
 *
 * PAST — 002-006: Safety Guard
 * --------------------------------
 * Our agent backend is already complete for Section 002:
 *
 *   User prompt
 *       ↓
 *   Model
 *       ↓
 *   Tool calls?
 *       ↓
 *   Safety guard
 *       ↓
 *   Execute tools
 *       ↓
 *   Observations
 *       ↓
 *   Model again
 *
 * Until now, we interacted with that backend using curl.
 *
 *
 * NOW — 002-007: Agent UI
 * --------------------------------
 * This component gives the existing agent a browser interface.
 *
 * The important architecture is:
 *
 *   AgentDemo
 *       ↓
 *   fetch("/api/agents")
 *       ↓
 *   Existing agent backend
 *       ↓
 *   JSON response
 *       ↓
 *   AgentDemo
 *
 * This component is a Client Component because it needs browser-side
 * interaction and React state.
 *
 *
 * NEXT
 * --------------------------------
 * Section 003 moves into RAG. The agent UI remains intentionally simple here:
 * no streaming, tool-call visualization, conversation history, or persistence.
 */

export function AgentDemo() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function runAgent() {
    setIsLoading(true);
    setAnswer("");
    setError("");

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = (await response.json()) as {
        text?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "The agent request failed.");
        return;
      }

      setAnswer(data.text ?? "");
    } catch {
      setError("Unable to reach the agent.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Agent Demo
      </p>

      <h3 className="mt-2 text-lg font-semibold">Ask the agent</h3>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        This browser interface calls the same agent API that we previously
        tested with curl.
      </p>

      <div className="mt-5 space-y-3">
        <label htmlFor="agent-prompt" className="text-sm font-medium">
          Prompt
        </label>

        <textarea
          id="agent-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ask the agent to use its tools..."
          rows={5}
          className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none"
        />

        <button
          type="button"
          onClick={runAgent}
          disabled={isLoading || !prompt.trim()}
          className="rounded-lg border border-border bg-foreground px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Running..." : "Run Agent"}
        </button>
      </div>

      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 rounded-xl border border-border bg-background p-4"
        >
          <div
            aria-hidden="true"
            className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
          />

          <div>
            <p className="text-sm font-medium">Agent is working...</p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              It may use several tools before returning a final answer.
            </p>
          </div>
        </div>
      )}

      {answer && (
        <div className="mt-5 rounded-xl border border-border bg-background p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Answer
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{answer}</p>
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-border bg-background p-4">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Error
          </p>

          <p className="mt-2 text-sm leading-6">{error}</p>
        </div>
      )}
    </div>
  );
}
