"use client";

/**
 * Lesson 001-006 — Simple LLM Chat UI
 *
 * PAST — 001-005 Streaming
 * --------------------------------
 * The server already knows how to:
 *
 *   OpenAI Responses API
 *        ↓
 *   response.output_text.delta
 *        ↓
 *   TextEncoder
 *        ↓
 *   HTTP bytes
 *        ↓
 *   ReadableStream
 *        ↓
 *   browser
 *
 * We proved that streaming worked with:
 *
 *   curl -N
 *
 *
 * NOW — 001-006 Simple LLM Chat UI
 * --------------------------------
 * The browser consumes that same streaming HTTP response and renders
 * the answer progressively.
 *
 *   Browser
 *      ↓
 *   fetch("/api/openai")
 *      ↓
 *   response.body
 *      ↓
 *   getReader()
 *      ↓
 *   reader.read()
 *      ↓
 *   Uint8Array
 *      ↓
 *   TextDecoder
 *      ↓
 *   string chunk
 *      ↓
 *   setAnswer()
 *      ↓
 *   React re-renders
 *
 *
 * THREE UI PHASES
 * --------------------------------
 *
 * 1. READY
 *
 *      Ready
 *      Send
 *
 * 2. WAITING FOR FIRST CHUNK
 *
 *      Streaming
 *      Generating...
 *
 *      Waiting for model...
 *      The model is preparing its response.
 *
 * 3. ACTIVELY STREAMING
 *
 *      Streaming
 *      Generating...
 *
 *      AI Response
 *      The answer grows progressively...
 *
 * When the HTTP stream finishes, the UI returns to Ready.
 *
 *
 * WHY THIS IS NOT SUSPENSE
 * --------------------------------
 * React Suspense is not what streams the model response.
 *
 * <LlmChat /> is already rendered and interactive when the user
 * presses Send. We are then imperatively calling fetch() and waiting
 * for the first chunk from response.body.
 *
 * Therefore, waiting for the first chunk is represented with ordinary
 * React state:
 *
 *   isWaitingForFirstChunk
 *
 * The actual model output is transported by the Web Streams API.
 *
 *
 * ENCODING / DECODING
 * --------------------------------
 *
 * Server:
 *
 *   string
 *      ↓
 *   TextEncoder
 *      ↓
 *   bytes
 *
 * Browser:
 *
 *   bytes
 *      ↓
 *   TextDecoder
 *      ↓
 *   string
 *
 *
 * IMPORTANT — A CHUNK IS NOT A WORD
 * --------------------------------
 * In 001-005 we observed OpenAI produce deltas such as:
 *
 *   " perce"
 *   "ives"
 *
 * which together become:
 *
 *   " perceives"
 *
 * Never assume:
 *
 *   one OpenAI event  = one word
 *   one HTTP chunk    = one OpenAI event
 *   one reader.read() = one word
 *
 * Append decoded chunks exactly as they arrive.
 *
 *
 * CLIENT COMPONENT
 * --------------------------------
 * This file needs "use client" because it uses:
 *
 *   useState()
 *   browser event handlers
 *   fetch()
 *   ReadableStream reader
 *   progressive React state updates
 *
 * The parent page remains a Server Component.
 *
 *
 * TEACHING DELAY
 * --------------------------------
 * sleep() intentionally slows browser rendering so students can see
 * progressive updates more clearly.
 *
 * Remove this artificial delay in a production chat interface.
 */

import { useState } from "react";

import { Button } from "@/components/ui/button";

const TEST_PROMPT =
  "Explain what a JavaScript Promise is in 5 short sentences.";

/** Teaching-only delay so streamed updates are easier to observe. */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function LlmChat() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");

  // True for the entire request:
  //
  // Send → waiting → streaming → finished
  const [isLoading, setIsLoading] = useState(false);

  // True only between pressing Send and receiving the first HTTP chunk.
  //
  // This lets us distinguish:
  //
  //   "The model has not started returning text yet"
  //
  // from:
  //
  //   "The model is actively streaming text."
  const [isWaitingForFirstChunk, setIsWaitingForFirstChunk] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    // Reject empty or whitespace-only prompts in the browser.
    //
    // The server validates independently because client-side validation
    // must never be the only protection around an API boundary.
    if (!prompt.trim()) return;

    // Start a new request.
    setAnswer("");
    setIsLoading(true);
    setIsWaitingForFirstChunk(true);

    try {
      // Send the prompt to the streaming Route Handler built in 001-005.
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      // fetch() resolves even when the server returns an HTTP error,
      // so check the status explicitly.
      if (!response.ok) {
        throw new Error(
          `Request failed: ${response.status} ${response.statusText}`,
        );
      }

      // Our Route Handler should return a streaming response body.
      if (!response.body) {
        throw new Error("Response body is missing.");
      }

      // Acquire a reader for the HTTP ReadableStream.
      //
      // getReader() itself does not read the whole response.
      const reader = response.body.getReader();

      // Server:
      //
      //   string → TextEncoder → bytes
      //
      // Browser:
      //
      //   bytes → TextDecoder → string
      const decoder = new TextDecoder();

      // Track whether we've received our first actual HTTP chunk.
      //
      // We use a local variable here because this logic belongs to this
      // particular async request rather than React rendering.
      let hasReceivedFirstChunk = false;

      while (true) {
        // Wait asynchronously for the next HTTP chunk.
        //
        // value is a Uint8Array.
        // done becomes true when the HTTP stream has ended.
        const { done, value } = await reader.read();

        if (done) break;

        // The first chunk has arrived.
        //
        // Hide the waiting indicator before progressively rendering
        // the response.
        if (!hasReceivedFirstChunk) {
          hasReceivedFirstChunk = true;
          setIsWaitingForFirstChunk(false);
        }

        // stream:true preserves incomplete multi-byte UTF-8 characters
        // between reader.read() calls.
        const chunk = decoder.decode(value, { stream: true });

        // Append exactly what arrived.
        //
        // Do NOT assume a chunk represents one word.
        //
        // Example:
        //
        //   current = "The agent perce"
        //   chunk   = "ives"
        //
        // Result:
        //
        //   "The agent perceives"
        setAnswer((current) => current + chunk);

        // Teaching-only delay.
        await sleep(200);
      }

      // Flush any bytes TextDecoder may still have buffered when the
      // HTTP stream ends.
      const finalChunk = decoder.decode();

      if (finalChunk) {
        // If an unusual response produced no earlier chunk but the
        // decoder still had final content, it now counts as our first
        // visible model output.
        setIsWaitingForFirstChunk(false);
        setAnswer((current) => current + finalChunk);
      }
    } catch (error) {
      console.error(error);

      setAnswer("Something went wrong.");
    } finally {
      // Always clean up both request states.
      setIsWaitingForFirstChunk(false);
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5"
    >
      {/* Overall request status. */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h2 className="text-lg font-semibold text-white">LLM Playground</h2>

        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span
            className={`h-2 w-2 rounded-full ${
              isLoading ? "animate-pulse bg-amber-400" : "bg-emerald-400"
            }`}
          />

          <span>{isLoading ? "Streaming" : "Ready"}</span>
        </div>
      </div>

      {/* Controlled prompt input. */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="prompt" className="text-sm font-medium text-zinc-300">
            Prompt
          </label>

          <span className="font-mono text-xs text-zinc-600">
            POST /api/openai
          </span>
        </div>

        <textarea
          id="prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Ask the model something..."
          disabled={isLoading}
          rows={3}
          className="w-full resize-none rounded-xl border border-zinc-800 bg-black/40 px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-60"
        />

        {/* Example prompt + primary action share one row. */}
        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="min-w-0 text-sm">
            <span className="text-zinc-500">Try: </span>

            <Button
              type="button"
              variant="link"
              onClick={() => setPrompt(TEST_PROMPT)}
              disabled={isLoading}
              className="h-auto max-w-full cursor-pointer p-0 text-left text-sm whitespace-normal text-zinc-300 underline-offset-4 hover:text-white disabled:cursor-not-allowed"
            >
              {TEST_PROMPT}
            </Button>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="min-w-28 shrink-0 cursor-pointer border border-zinc-200 bg-white font-semibold text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:border-zinc-500 disabled:bg-zinc-800 disabled:text-zinc-200 disabled:opacity-100"
          >
            {isLoading ? "Generating..." : "Send"}
          </Button>
        </div>
      </div>

      {/*
       * WAITING-FOR-FIRST-CHUNK UI
       *
       * This is intentionally ordinary React conditional rendering,
       * not a Suspense boundary.
       *
       * It appears immediately after Send and disappears when the first
       * HTTP chunk reaches reader.read().
       */}
      {isWaitingForFirstChunk && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-black/40 px-4 py-3"
        >
          <span
            aria-hidden="true"
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-200"
          />

          <div>
            <p className="text-sm font-medium text-zinc-200">
              Waiting for model...
            </p>

            <p className="text-xs text-zinc-500">
              The model is preparing its response.
            </p>
          </div>
        </div>
      )}

      {/*
       * ACTIVE STREAMING / COMPLETED RESPONSE
       *
       * The response panel appears as soon as decoded text is added to
       * answer. Subsequent chunks progressively grow the same answer.
       */}
      {answer && (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black/40">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-200">
                AI
              </div>

              <span className="text-sm font-semibold text-zinc-200">
                Response
              </span>
            </div>

            {isLoading && !isWaitingForFirstChunk && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                <span>Streaming</span>
              </div>
            )}
          </div>

          <div className="min-h-20 px-4 py-3">
            <div className="whitespace-pre-wrap text-sm leading-6 text-zinc-100">
              {answer}
            </div>

            {/* UI-only cursor; it is not part of the model response. */}
            {isLoading && !isWaitingForFirstChunk && (
              <span className="mt-1 inline-block h-4 w-1 animate-pulse bg-zinc-400" />
            )}
          </div>
        </div>
      )}
    </form>
  );
}
