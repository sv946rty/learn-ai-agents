import { openai } from "@/lib/openai/client";

type PromptRequest = {
    prompt: string;
};

/**
 * Lesson 001-005 — Streaming
 *
 * PAST — 001-004 Responses API Deep Dive
 * --------------------------------
 * In the previous lesson, we waited for OpenAI to finish generating
 * the complete Response before returning anything to the caller.
 *
 * The request flow was:
 *
 *   caller
 *     → POST /api/openai
 *     → request.json()
 *     → prompt validation
 *     → openai.responses.create(...)
 *     → completed OpenAI Response
 *     → selected Response fields
 *     → JSON response
 *
 * We inspected useful properties such as:
 *
 *   response.id
 *   response.status
 *   response.model
 *   response.output
 *   response.output_text
 *   response.usage
 *
 * This taught us what a completed Responses API result looks like.
 *
 * The important limitation was:
 *
 *   caller
 *     ↓
 *   wait...
 *     ↓
 *   wait...
 *     ↓
 *   complete response
 *
 * Even while the model was generating text, our caller received
 * nothing until generation was finished.
 *
 *
 * NOW — 001-005 Streaming
 * --------------------------------
 * In this lesson, we change the Responses API request to:
 *
 *   stream: true
 *
 * Instead of receiving one completed Response object, the OpenAI SDK
 * gives us a stream of events that we can consume asynchronously:
 *
 *   const stream = await openai.responses.create({
 *       model: "...",
 *       input: prompt,
 *       stream: true,
 *   });
 *
 *   for await (const event of stream) {
 *       ...
 *   }
 *
 * During our inspection, we observed events such as:
 *
 *   response.created
 *   response.in_progress
 *   response.output_item.added
 *   response.content_part.added
 *   response.output_text.delta
 *   response.output_text.done
 *   response.content_part.done
 *   response.output_item.done
 *   response.completed
 *
 * For this lesson, the most important event is:
 *
 *   response.output_text.delta
 *
 * Each delta contains another piece of generated text:
 *
 *   "An"
 *   " AI"
 *   " agent"
 *   " is"
 *   ...
 *
 * A delta is not necessarily a complete word. For example, OpenAI
 * may produce:
 *
 *   " perce"
 *   "ives"
 *
 * which becomes:
 *
 *   " perceives"
 *
 * We therefore treat each delta simply as the next piece of text,
 * without assuming where word boundaries occur.
 *
 *
 * OPENAI STREAM vs HTTP STREAM
 * --------------------------------
 * There are two separate streams in this route:
 *
 *   OpenAI stream
 *       ↓
 *   Next.js Route Handler
 *       ↓
 *   HTTP response stream
 *       ↓
 *   caller
 *
 * The OpenAI SDK gives us structured streaming events.
 *
 * Our Route Handler acts as an adapter:
 *
 *   OpenAI event stream
 *       │
 *       ├── response.created             → ignore
 *       ├── response.in_progress         → ignore
 *       ├── response.output_item.added   → ignore
 *       │
 *       ├── response.output_text.delta
 *       │         ↓
 *       │     event.delta
 *       │         ↓
 *       │     TextEncoder
 *       │         ↓
 *       │     controller.enqueue(...)
 *       │
 *       └── response.completed           → stream ends
 *                 ↓
 *          controller.close()
 *
 * We intentionally do not forward every OpenAI event to the caller.
 *
 * For now, our public API returns only the generated text.
 *
 *
 * READABLESTREAM
 * --------------------------------
 * `ReadableStream` represents the outgoing stream returned by our
 * Next.js Route Handler.
 *
 * When the stream starts, the Web Streams runtime calls:
 *
 *   start(controller)
 *
 * We do not call `start()` ourselves.
 *
 * The controller lets us place data into the outgoing stream:
 *
 *   controller.enqueue(...)
 *
 * Each time OpenAI produces another text delta, we immediately
 * enqueue that text into our outgoing stream.
 *
 * Conceptually:
 *
 *   OpenAI: "An"
 *       ↓
 *   enqueue("An")
 *       ↓
 *   caller receives "An"
 *
 *   OpenAI: " AI"
 *       ↓
 *   enqueue(" AI")
 *       ↓
 *   caller receives " AI"
 *
 *   OpenAI: " agent"
 *       ↓
 *   enqueue(" agent")
 *       ↓
 *   caller receives " agent"
 *
 * We do not first concatenate the entire answer and wait for OpenAI
 * to finish.
 *
 *
 * TEXTENCODER
 * --------------------------------
 * `event.delta` is a JavaScript string.
 *
 * The outgoing ReadableStream sends bytes, so TextEncoder converts:
 *
 *   JavaScript string
 *       ↓
 *   TextEncoder
 *       ↓
 *   Uint8Array bytes
 *
 * before those bytes are passed to:
 *
 *   controller.enqueue(...)
 *
 *
 * STREAM COMPLETION
 * --------------------------------
 * When OpenAI finishes generating the response, the async iteration
 * ends.
 *
 * We then call:
 *
 *   controller.close()
 *
 * to tell the consumer that our outgoing stream has finished.
 *
 * The resulting flow is:
 *
 *   prompt
 *     ↓
 *   POST /api/openai
 *     ↓
 *   runtime validation
 *     ↓
 *   openai.responses.create({
 *       stream: true
 *   })
 *     ↓
 *   OpenAI event stream
 *     ↓
 *   response.output_text.delta
 *     ↓
 *   event.delta
 *     ↓
 *   TextEncoder
 *     ↓
 *   controller.enqueue(...)
 *     ↓
 *   ReadableStream
 *     ↓
 *   HTTP response
 *     ↓
 *   caller receives text progressively
 *
 *
 * NEXT — 001-006 Simple LLM Chat UI
 * --------------------------------
 * We currently prove streaming from the command line with curl.
 *
 * In the next lesson, the browser will become the consumer of this
 * same HTTP stream.
 *
 * We will build a simple LLM chat interface that can:
 *
 *   enter a prompt
 *     ↓
 *   submit the prompt
 *     ↓
 *   show a generating/loading state
 *     ↓
 *   read the streamed HTTP response
 *     ↓
 *   progressively render generated text
 *
 * That lesson is also the appropriate place to discuss the
 * relationship between:
 *
 *   React UI state
 *   loading/skeleton UI
 *   Server and Client Components
 *   Suspense
 *   Cache Components
 *   LLM token streaming
 *
 * These concepts solve different problems and should not be treated
 * as interchangeable.
 *
 * `cacheComponents: true` remains part of our Next.js foundation,
 * but live user-specific model generation should not be cached.
 *
 * Tools, agent loops, RAG, LangGraph, MCP, and evaluation still
 * belong to later sections of the course.
 *
 *
 * TEST CASES
 * --------------------------------
 *
 * Prerequisite:
 *
 *   pnpm dev
 *
 *
 * Test 1 — Stream a valid prompt:
 *
 *   curl -N -X POST http://localhost:3000/api/openai \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"Explain what an AI agent is in three short sentences."}'
 *
 * Expected:
 *
 *   The generated answer is returned as plain text and can arrive
 *   progressively while OpenAI is still generating it.
 *
 * `-N` tells curl not to buffer its output, making progressive
 * output easier to observe.
 *
 *
 * Test 2 — Empty prompt:
 *
 *   curl -i -X POST http://localhost:3000/api/openai \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":""}'
 *
 * Expected:
 *
 *   HTTP/1.1 400 Bad Request
 *
 *   {"error":"Prompt is required."}
 *
 *
 * Test 3 — Whitespace-only prompt:
 *
 *   curl -i -X POST http://localhost:3000/api/openai \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":"   "}'
 *
 * Expected:
 *
 *   HTTP/1.1 400 Bad Request
 *
 *   {"error":"Prompt is required."}
 *
 *
 * Test 4 — Non-string prompt:
 *
 *   curl -i -X POST http://localhost:3000/api/openai \
 *     -H "Content-Type: application/json" \
 *     -d '{"prompt":123}'
 *
 * Expected:
 *
 *   HTTP/1.1 400 Bad Request
 *
 *   {"error":"Prompt is required."}
 *
 *
 * Together these tests demonstrate:
 *
 *   caller prompt
 *       ↓
 *   POST /api/openai
 *       ↓
 *   runtime validation
 *       ↓
 *   OpenAI streaming
 *       ↓
 *   output_text.delta events
 *       ↓
 *   Next.js ReadableStream
 *       ↓
 *   progressive plain-text HTTP response
 */

export async function POST(request: Request) {
    // Read the JSON body sent by the caller.
    //
    // `PromptRequest` describes the shape TypeScript expects while we
    // develop, but it does not validate incoming HTTP data at runtime.
    const body = (await request.json()) as PromptRequest;

    const prompt = body.prompt;

    // Keep the runtime validation introduced in 001-003.
    //
    // Invalid prompts are rejected before an unnecessary OpenAI API
    // request is made.
    if (typeof prompt !== "string" || !prompt.trim()) {
        return Response.json(
            { error: "Prompt is required." },
            { status: 400 },
        );
    }

    // Ask the OpenAI Responses API to stream its result.
    //
    // Unlike 001-004, this does not give us one completed Response
    // object containing response.output_text. Instead, `stream` lets us
    // asynchronously consume a sequence of Responses API events.
    const stream = await openai.responses.create({
        model: "gpt-5.6-luna",
        input: prompt,
        stream: true,
    });

    // Create the outgoing Web ReadableStream that our Next.js route
    // will return to the caller.
    //
    // The Web Streams runtime calls start(controller). We use that
    // controller to enqueue each generated text delta as it arrives.
    const textStream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            for await (const event of stream) {
                // The OpenAI stream contains several event types.
                //
                // For this lesson, forward only newly generated text.
                if (event.type === "response.output_text.delta") {
                    controller.enqueue(encoder.encode(event.delta));
                }
            }

            // The OpenAI event stream has finished, so tell the caller
            // that our outgoing HTTP stream is finished too.
            controller.close();
        },
    });

    // Return the ReadableStream itself instead of waiting for a complete
    // model response and returning JSON as we did in 001-004.
    //
    // The caller can now consume generated text progressively.
    return new Response(textStream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
        },
    });
}
